import ConfigStore from 'electron-store'
const store = new ConfigStore()

export const config = {
    get ALLDEBRID_API_KEY(): string {
        return store.get('ALLDEBRID_API_KEY') as string
    },
    set ALLDEBRID_API_KEY(value) {
        store.set('ALLDEBRID_API_KEY', value)
    },
    TMDB_API_KEY: process.env.TMDB_API_KEY,
}
