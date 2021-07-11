import { alldebrid } from './alldebrid'
import { themoviedb } from './themoviedb'
import { store } from './store'
import type { NotificationOptions } from './types/notification'
import { ipcRenderer } from 'electron'
import { download } from './helpers/dowloader'
import { url } from './iina'

function twoDigits(x: number): string {
    return `0${x}`.slice(-2)
}

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
        if (firstFetch) {
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
            return
        }
        for await (const magnet of magnets) {
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
                console.log('ref:', ref)
                let data = await store.get(ref.filename.toString())

                if (!data.id) {
                    data = await themoviedb.getInfos(ref)
                    await store.set(data.filename.toString(), data)
                }
                data.ready = magnet.ready || ref.ready
                await store.set(data.filename.toString(), data)

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
                    await ipcRenderer.invoke('notify', notifOptions)
                    data.notified = true
                    await store.set(data.filename.toString(), data)
                }
            }
        }

        const elements = await store.getAll()
        return Object.values(elements).sort((a: any, b: any) => b.id - a.id)
    }
}

export const manager = new Manager()
