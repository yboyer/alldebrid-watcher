import got from 'got'
import { parse } from 'parse-torrent-title'
import { config } from './config'
import slugify from 'slugify'

export type Magnet = {
    id: string
    filename?: string
    slug?: string
    link?: string
    date?: number
    downloaded?: number
    uploaded?: number
    size?: number
    ready?: boolean
}

class Alldebrid {
    private counter = 0
    private sessionId = Math.round(Math.random() * 30000)
    private linkPrefix = `https://myfiles.alldebrid.com/${config.ALLDEBRID_API_KEY}/magnets/`
    private CODES = {
        READY: 4,
    } as const

    static isMedia(filename: string): boolean {
        return /\.(mp4|mkv|avi)$/.test(filename)
    }

    private slugify(name: string): string {
        return slugify(name, { remove: /[\*\[\]{}%$&#+~\.()'"!:@]/g })
    }

    async getMagnets() {
        console.log('[getMagnets]')
        console.log(`#${this.counter}`)
        const res = await got
            .get(`https://api.alldebrid.com/v4/magnet/status`, {
                searchParams: {
                    agent: 'r2',
                    apikey: config.ALLDEBRID_API_KEY,
                    session: this.sessionId.toString(),
                    counter: (this.counter++).toString(),
                },
            })
            .json<{ data: { magnets: any[]; fullsync?: boolean; counter?: number } }>()

        console.log({ res })

        if (res.data.fullsync) {
            this.counter = res.data.counter
        }

        console.log({ magnets: res.data.magnets })

        const magnets = res.data.magnets
            .filter((m) => m.statusCode <= this.CODES.READY || !m.statusCode)
            .reduce<Magnet[]>((acc, m) => {
                const date = new Date(m.uploadDate * 1000).getTime()
                const ready = m.statusCode === this.CODES.READY

                console.log({ m })

                const id = m.id.toString()

                if (m.statusCode === undefined) {
                    if (!m.notified && !m.deleted) {
                        acc.push({
                            id,
                            downloaded: m.downloaded,
                            uploaded: m.uploaded,
                        })
                    }
                } else if (Alldebrid.isMedia(m.filename)) {
                    acc.push({
                        id,
                        filename: m.filename,
                        size: m.size,
                        slug: this.slugify(m.filename),
                        link: encodeURIComponent(`${this.linkPrefix}${m.filename}`),
                        date,
                        ready,
                    })
                } else {
                    m.links?.forEach((link) => {
                        if (Alldebrid.isMedia(link.filename)) {
                            acc.push({
                                id,
                                filename: link.filename,
                                size: m.size,
                                slug: this.slugify(link.filename),
                                link: encodeURIComponent(
                                    `${this.linkPrefix}${m.filename}/${link.filename}`
                                ),
                                date,
                                ready,
                            })
                        }
                    })
                }

                return acc
            }, [])
            .map((file) => {
                return {
                    ...file,
                    metadata: parse(file.filename || ''),
                }
            })

        return {
            magnets,
            firstFetch: this.counter === 1,
        }
    }
}

export const alldebrid = new Alldebrid()
