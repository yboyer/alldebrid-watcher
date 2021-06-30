import { alldebrid } from './alldebrid'
import { themoviedb } from './themoviedb'
import { store } from './store'
import type { NotificationOptions } from './types/notification'
import { ipcRenderer } from 'electron'
import { download } from './helpers/dowloader'
import { url } from './iina'

class Manager {
    private firstFetch = true

    async update() {
        const all: any[] = await store.getAll()
        for await (const entry of Object.values(all)) {
            await store.set(entry.id.toString(), { ...entry, ready: true })
        }
    }

    async getMagnets() {
        const torrents = await alldebrid.getMagnets()
        const movies = torrents.filter((t) => t.metadata.season === void 0)
        for await (const torrent of movies) {
            if (this.firstFetch && (await store.has(torrent.id.toString()))) {
                continue
            }

            console.log({ torrent })

            let data = null
            if (!torrent.filename) {
                data = await store.get(torrent.id.toString())
                if (typeof torrent.ready === 'boolean') {
                    data.ready = torrent.ready
                }
                await store.set(data.id.toString(), data)
            } else {
                data = await themoviedb.getInfos(torrent)
                if (typeof torrent.ready === 'boolean') {
                    data.ready = torrent.ready
                    await store.set(data.id.toString(), data)
                }
            }

            console.log({ data })

            if (!this.firstFetch) {
                const icon = data.cover
                    ? await download({
                          url: themoviedb.getIconUrl(data.cover),
                          name: data.cover,
                      })
                    : void 0
                if (data.ready) {
                    await ipcRenderer.invoke('notify', {
                        title: 'New movie available',
                        body: `${data.title || data.filename} (${new Date(
                            data.releaseDate || 'N/C'
                        ).getUTCFullYear()})`,
                        icon,
                        urlOpen: url(data.link),
                    } as NotificationOptions)
                    data.notified = true
                    await store.set(data.id.toString(), data)
                } else if (!data.notified) {
                    await ipcRenderer.invoke('notify', {
                        title: 'Movie downloading...',
                        body: `${data.title || data.filename} (${new Date(
                            data.releaseDate || 'N/C'
                        ).getUTCFullYear()})`,
                        urlOpen: 'https://alldebrid.com/magnets/',
                        icon,
                    } as NotificationOptions)
                    data.notified = true
                    await store.set(data.id.toString(), data)
                }
            }
        }

        this.firstFetch = false

        const elements = await store.getAll()
        return Object.values(elements).sort((a: any, b: any) => b.id - a.id)
    }
}

export const manager = new Manager()
