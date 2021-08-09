import { alldebrid } from './alldebrid'
import { themoviedb } from './themoviedb'
import { store } from './store'
import type { NotificationOptions } from './types/notification'
import { download } from './helpers/dowloader'
import { url } from './iina'
import { notify } from './electron'
import { twoDigits } from './utils'

class Manager {
    private cache = new Map<string, any[]>()

    async update() {
        const all: any[] = await store.getAll()
        for await (const entry of Object.values(all)) {
            await store.set(entry.id.toString(), { ...entry, ready: true })
        }
    }

    async getMagnets() {
        const { magnets, firstFetch } = await alldebrid.getMagnets()
        let notFound = null
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
            console.log('cache', this.cache)
            if (!notFound) {
                return []
            }
            console.log('notFound', notFound)
        }
        for await (const magnet of notFound || magnets) {
            let refs = this.cache.get(magnet.id.toString())
            if (!refs) {
                this.cache.set(magnet.id, [magnet])
                refs = [magnet]
            } else {
                if (magnet.filename && refs.find((r) => r.filename !== magnet.filename)) {
                    this.cache.set(magnet.id, [...refs, magnet])
                    refs = [magnet]
                }
            }

            for await (const ref of refs) {
                const id = ref.slug
                console.log('ref:', ref)
                let data = await store.get(id)
                console.log({ data })

                if (!data.id) {
                    data = await themoviedb.getInfos(ref)
                    await store.set(id, data)
                }
                data.ready = magnet.ready || ref.ready
                await store.set(id, data)

                const notifOptions = {} as NotificationOptions
                if (data.episode) {
                    notifOptions.icon = data.cover
                        ? await download({
                              url: themoviedb.getIconUrl(data.cover),
                              name: data.cover,
                          })
                        : void 0

                    notifOptions.title = data.ready
                        ? 'New episode available'
                        : 'Episode downloading...'
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

                    notifOptions.title = data.ready
                        ? 'New movie available'
                        : 'Movie downloading...'
                    notifOptions.body = `${data.title || data.filename} (${new Date(
                        data.releaseDate || 'N/C'
                    ).getUTCFullYear()})`
                    notifOptions.urlOpen = data.ready
                        ? url(data.link)
                        : 'https://alldebrid.com/magnets/'
                }

                if (data.ready || !data.notified) {
                    notify(notifOptions)
                    data.notified = true
                    await store.set(id, data)
                }
            }
        }

        return magnets
    }
}

export const manager = new Manager()
