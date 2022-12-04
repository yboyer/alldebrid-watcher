import got from 'got'
import { GENRES } from './helpers/genres'
import { encrypto } from './helpers/crypto'

export type Movie = {
    id: string
    tmdbId: number
    releaseDate: number
    title: string
    originalTitle: string
    originalLanguage: string
    overview: string
    cover: string
    filename: string
    slug: string
    link: string
    resolution: string
    codec: string
    language: string
    audio: string
    source: string
    genres: string
    date: number
    ready: boolean
}

export type Episode = {
    id: string
    tmdbId: number
    releaseDate: number
    title: string
    originalTitle: string
    originalLanguage: string
    overview: string
    cover: any
    episode: {
        number: number
        season: number
        overview: string
        releaseDate: number
        title: string
        cover: string
    }
    filename: string
    slug: string
    link: string
    resolution: string
    codec: string
    language: string
    audio: string
    source: string
    genres: string
    date: string
    ready: boolean
}

class ThemovieDB {
    private client = got.extend({
        prefixUrl: 'https://api.themoviedb.org/3/',
        searchParams: {
            api_key: encrypto.decrypt(
                '5210bb395ad80d109dcbca80320b846868df854f2c3bf5e363562393b57b155c',
                this.constructor.name
            ),
            language: 'fr',
        },
    })

    getIconUrl(cover: string, width = 400): string {
        return `https://image.tmdb.org/t/p/w${width}${cover}`
    }

    async getMovieInfos(magnet): Promise<Movie> {
        const { results } = await this.client
            .get(`search/movie`, {
                searchParams: {
                    page: '1',
                    query: magnet.metadata.title,
                    year: magnet.metadata.year,
                },
            })
            .json<any>()
        // const globalData = undefined

        const globalData =
            results.find(
                (movie: any) =>
                    new Date(movie.release_date).getFullYear() === magnet.metadata.year
            ) || results[0]

        return {
            id: magnet.id,
            tmdbId: globalData?.id,
            releaseDate: globalData && new Date(globalData.release_date).getTime(),
            title: globalData?.title,
            originalTitle: globalData?.original_title,
            originalLanguage: globalData?.original_language,
            overview: globalData?.overview,
            cover: globalData?.poster_path,
            filename: magnet.filename,
            slug: magnet.slug,
            link: magnet.link,
            resolution: magnet.metadata.resolution,
            codec: magnet.metadata.codec,
            language: magnet.metadata.language,
            audio: magnet.metadata.audio,
            source: magnet.metadata.source,
            genres: globalData?.genre_ids.map((id) => GENRES[id]).sort(),
            date: magnet.date,
            ready: magnet.ready,
        }
    }

    async getTVGlobalInfos({ tvId }) {
        return await this.client.get(`tv/${tvId}`).json<any>()
    }

    async getEpisodeInfos({ tvId, season, episode }) {
        return this.client
            .get(`tv/${tvId}/season/${season}/episode/${episode}`, {})
            .json<any>()
    }

    async getTVInfos(magnet): Promise<Episode> {
        const {
            results: [globalData],
        } = await this.client
            .get(`search/tv`, {
                searchParams: {
                    page: '1',
                    query: magnet.metadata.title,
                },
            })
            .json<any>()

        let episode: any
        try {
            episode = await this.getEpisodeInfos({
                tvId: globalData.id,
                season: magnet.metadata.season,
                episode: magnet.metadata.episode,
            })
        } catch (e) {}

        return {
            id: magnet.id,
            tmdbId: globalData?.id,
            releaseDate: globalData && new Date(globalData.release_date).getTime(),
            title: globalData?.name,
            originalTitle: globalData?.original_title,
            originalLanguage: globalData?.original_language,
            overview: globalData?.episode,
            cover: globalData?.poster_path,
            episode: {
                number: episode?.episode_number,
                season: episode?.season_number,
                overview: episode?.overview,
                releaseDate: episode && new Date(episode.air_date).getTime(),
                title: episode?.name,
                cover: episode?.still_path,
            },
            filename: magnet.filename,
            slug: magnet.slug,
            link: magnet.link,
            resolution: magnet.metadata.resolution,
            codec: magnet.metadata.codec,
            language: magnet.metadata.language,
            audio: magnet.metadata.audio,
            source: magnet.metadata.source,
            genres: globalData?.genre_ids.map((id: number) => GENRES[id]).sort(),
            date: magnet.date,
            ready: magnet.ready,
        }
    }

    async getInfos(magnet) {
        if (magnet.metadata.season) {
            return this.getTVInfos(magnet)
        }
        return this.getMovieInfos(magnet)
    }

    isEpisode(el: Episode | Movie): el is Episode {
        return (el as Episode).episode !== undefined
    }
}

export const themoviedb = new ThemovieDB()
