import got from 'got'
import { config } from './config'
import { GENRES } from './helpers/genres'

export type Movie = {
    id: number
    tmdbId: number
    releaseDate: number
    title: string
    originalTitle: string
    originalLanguage: string
    overview: string
    cover: string
    filename: string
    link: string
    resolution: string
    codec: string
    language: string
    audio: string
    source: string
    genres: string
    date: number
}

class ThemovieDB {
    private client = got.extend({
        prefixUrl: 'https://api.themoviedb.org/3/',
    })
    baseCoverUrl = 'https://image.tmdb.org/t/p/w300'

    getIconUrl(cover: string): string {
        return `https://image.tmdb.org/t/p/w400${cover}`
    }

    async getMovieInfos(magnet): Promise<Movie> {
        const { results } = await this.client
            .get(`search/movie`, {
                searchParams: {
                    language: 'fr',
                    page: '1',
                    query: magnet.metadata.title,
                    api_key: config.TMDB_API_KEY,
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
            link: magnet.link,
            resolution: magnet.metadata.resolution,
            codec: magnet.metadata.codec,
            language: magnet.metadata.language,
            audio: magnet.metadata.audio,
            source: magnet.metadata.source,
            genres: globalData?.genre_ids.map((id) => GENRES[id]).sort(),
            date: magnet.date,
        }
    }

    async getTVGlobalInfos({ tvId }) {
        return await this.client
            .get(`tv/${tvId}`, {
                searchParams: {
                    language: 'fr',
                    api_key: config.TMDB_API_KEY,
                },
            })
            .json<any>()
    }

    async getEpisodeInfos({ tvId, season, episode }) {
        return this.client
            .get(`tv/${tvId}/season/${season}/episode/${episode}`, {
                searchParams: {
                    language: 'fr',
                    api_key: config.TMDB_API_KEY,
                },
            })
            .json<any>()
    }

    async getTVInfos(magnet) {
        const {
            results: [globalData],
        } = await this.client
            .get(`search/tv`, {
                searchParams: {
                    language: 'fr',
                    page: '1',
                    query: magnet.metadata.title,
                    api_key: config.TMDB_API_KEY,
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
            link: magnet.link,
            resolution: magnet.metadata.resolution,
            codec: magnet.metadata.codec,
            language: magnet.metadata.language,
            audio: magnet.metadata.audio,
            source: magnet.metadata.source,
            genres: globalData?.genre_ids.map((id: number) => GENRES[id]).sort(),
            date: magnet.date,
        }
    }

    async getInfos(magnet) {
        if (magnet.metadata.season) {
            return this.getTVInfos(magnet)
        }
        return this.getMovieInfos(magnet)
    }
}

export const themoviedb = new ThemovieDB()
