import storage from 'electron-json-storage'
import path from 'path'
import os from 'os'
import { promisify } from 'util'

storage.setDataPath(path.join(os.homedir(), '.r2'))
export const store = {
    has: promisify(storage.has),
    get: promisify(storage.get),
    set: promisify(storage.set),
    getAll: promisify(storage.getAll),
}
