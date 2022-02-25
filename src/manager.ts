import { alldebrid, Magnet } from './alldebrid'
import { Episode, Movie, themoviedb } from './themoviedb'
import { store } from './store'
import type { NotificationOptions } from './types/notification'
import { download } from './helpers/dowloader'
import { url } from './iina'
import { notify } from './electron'
import { twoDigits } from './utils'

class Manager {
    private cache = new Map<string, Magnet[]>()

    async update() {
        const all: any[] = await store.getAll()
        for await (const entry of Object.values(all)) {
            await store.set(entry.id.toString(), { ...entry, ready: true })
        }
    }

    static getPercent(magnet: Magnet, totalSize: number): string {
        if (magnet.downloaded !== undefined) {
            return ((magnet.downloaded / 2 / totalSize) * 100).toFixed(1)
        }

        if (magnet.uploaded !== undefined) {
            return (((totalSize / 2 + magnet.uploaded / 2) / totalSize) * 100).toFixed(1)
        }

        return ''
    }

    async getMagnets() {
        const { magnets, firstFetch } = await alldebrid.getMagnets()
        let notFound: Magnet[] | null = null
        if (firstFetch) {
            if (this.cache.size) {
                notFound = magnets.filter((m) => !this.cache.has(m.id))
            }
            this.cache = new Map(
                Object.entries(
                    magnets.reduce((acc, magnet) => {
                        if (!acc[magnet.id]) {
                            acc[magnet.id] = []
                        }
                        acc[magnet.id].push(magnet)
                        return acc
                    }, {})
                )
            )
            // console.log('cache', this.cache)
            if (!notFound) {
                return []
            }
            console.log('notFound', notFound)
        }
        for await (const magnet of notFound || magnets) {
            let refs = this.cache.get(magnet.id)
            if (!refs) {
                this.cache.set(magnet.id, [magnet])
                refs = [magnet]
            } else {
                if (magnet.filename && refs.find((r) => r.filename !== magnet.filename)) {
                    this.cache.set(magnet.id, [...refs, magnet])
                    refs = [magnet]
                }
            }

            const elements = new Map<string, NotificationOptions>()

            for await (const ref of refs) {
                const id = ref.slug
                // console.log('ref:', ref)
                let data: Episode | Movie = await store.get(id)
                // console.log({ data })

                if (!data.id) {
                    data = await themoviedb.getInfos(ref)
                    await store.set(id, data)
                }
                data.ready = magnet.ready || ref.ready
                await store.set(id, data)

                if (!data.ready && !magnet.downloaded) {
                    continue
                }

                const notifOptions = {
                    id: data.id,
                } as NotificationOptions
                if (themoviedb.isEpisode(data)) {
                    notifOptions.icon = data.cover
                        ? await download({
                              url: themoviedb.getIconUrl(data.cover),
                              name: data.cover,
                          })
                        : void 0

                    if (data.ready) {
                        notifOptions.title = 'New episode available'
                    } else {
                        notifOptions.title = 'Episode downloading...'
                        const percentDownload = Manager.getPercent(magnet, ref.size)
                        if (percentDownload) {
                            notifOptions.title += ` (${percentDownload}%)`
                        }
                        notifOptions.silent = true
                    }

                    notifOptions.body = `${data.title} [S${twoDigits(
                        data.episode.season
                    )}E${twoDigits(data.episode.number)}] - ${data.episode.title}`
                    notifOptions.urlOpen = data.ready
                        ? url(data.link)
                        : 'https://alldebrid.com/magnets/'
                } else {
                    notifOptions.icon = data.cover
                        ? await download({
                              url: themoviedb.getIconUrl(data.cover),
                              name: data.cover,
                          })
                        : void 0

                    if (data.ready) {
                        notifOptions.title = 'New movie available'
                    } else {
                        notifOptions.title = 'Movie downloading...'
                        const percentDownload = Manager.getPercent(magnet, ref.size)
                        if (percentDownload) {
                            notifOptions.title += ` (${percentDownload}%)`
                        }
                        notifOptions.silent = true
                    }
                    notifOptions.body = `${data.title || data.filename}`
                    if (data.releaseDate) {
                        notifOptions.body += ` (${new Date(
                            data.releaseDate
                        ).getUTCFullYear()})`
                    }
                    notifOptions.urlOpen = data.ready
                        ? url(data.link)
                        : 'https://alldebrid.com/magnets/'
                }
                elements.set(notifOptions.id, notifOptions)
            }

            elements.forEach((value) => {
                notify(value)
            })
        }

        return magnets
    }

    async remove(slug: string) {
        const elem = await store.get(slug)
        const files: Record<string, Episode | Movie> = await store.getAll()
        const items = Object.values(files).filter((f) => f.id === elem.id)
        await store.remove(slug)
        if (items.length === 1) {
            await alldebrid.remove(elem.id)
            this.cache.delete(elem.id)
        }
    }
}

export const manager = new Manager()
