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
    private get linkPrefix() {
        return `https://myfiles.alldebrid.com/${config.ALLDEBRID_API_KEY}/magnets/`
    }
    private CODES = {
        READY: 4,
    } as const
    private pinCheck:
        | {
              check: string
              userUrl: string
              pin: string
              expire: number
          }
        | undefined

    private client = got.extend({
        prefixUrl: 'https://api.alldebrid.com/v4/',
        searchParams: {
            agent: 'r2',
        },
        hooks: {
            init: [
                function (opts) {
                    if (config.ALLDEBRID_API_KEY) {
                        ;(opts.searchParams as any).apikey = config.ALLDEBRID_API_KEY
                    }
                },
            ],
        },
    })

    needPin() {
        return !Boolean(config.ALLDEBRID_API_KEY)
    }

    async checkPin() {
        if (!this.pinCheck) {
            return !this.needPin()
        }

        const res = await this.client
            .get('pin/check', {
                searchParams: {
                    pin: this.pinCheck.pin,
                    check: this.pinCheck.check,
                },
            })
            .json<{
                data:
                    | {
                          activated: false
                          expires_in: number
                      }
                    | {
                          apikey: string
                          activated: true
                          expires_in: number
                      }
            }>()

        console.log('Token expires in:', res.data?.expires_in)
        if (res.data.expires_in < 10) {
            this.pinCheck = null
        }

        if (res.data.activated) {
            console.log('activated')
            config.ALLDEBRID_API_KEY = res.data.apikey
            this.pinCheck = null
            return true
        }

        return false
    }

    async getPinUrl() {
        if (config.ALLDEBRID_API_KEY) {
            return
        }
        if (this.pinCheck) {
            if (this.pinCheck.expire > 200) {
                return this.pinCheck.userUrl
            }
        }
        const res = await this.client.get('pin/get').json<{
            data: {
                pin: string
                check: string
                expires_in: number
                user_url: string
                base_url: string
                check_url: string
            }
            error?: { code: string; message: string }
        }>()
        this.pinCheck = {
            pin: res.data.pin,
            check: res.data.check,
            userUrl: res.data.user_url,
            expire: res.data.expires_in,
        }
        return this.pinCheck.userUrl
    }

    static isMedia(filename: string): boolean {
        return /\.(mp4|mkv|avi)$/.test(filename)
    }

    private slugify(name: string): string {
        return slugify(name, { remove: /[\*\[\]{}%$&#+~\.()'"!:@]/g })
    }

    async remove(id: string) {
        console.log('[remove]', id)
        await this.client.get('magnet/delete', {
            searchParams: {
                id,
            },
        })
    }

    async getMagnets() {
        console.log('[getMagnets]')
        console.log(`#${this.counter}`)
        const res = await this.client
            .get('magnet/status', {
                searchParams: {
                    session: this.sessionId.toString(),
                    counter: (this.counter++).toString(),
                },
            })
            .json<{
                data: {
                    magnets: any[]
                    fullsync?: boolean
                    counter?: number
                }
                error?: { code: string; message: string }
            }>()

        // console.log({ res })

        if (res.error) {
            if (res.error.code === 'AUTH_BAD_APIKEY') {
                config.ALLDEBRID_API_KEY = ''
            }
            throw new Error(res.error.message)
        }

        this.counter = res.data.counter

        console.log({ magnets: res.data.magnets.length })

        const magnets = res.data.magnets
            .filter((m) => m.statusCode <= this.CODES.READY || !m.statusCode)
            .reduce<Magnet[]>((acc, m) => {
                const date = new Date(m.completionDate * 1000).getTime()
                const ready = m.statusCode === this.CODES.READY

                // console.log({ m })

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
