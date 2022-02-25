import storage from 'electron-json-storage'
import path from 'path'
import os from 'os'
import { promisify } from 'util'

storage.setDataPath(path.join(os.homedir(), '.r2'))
export const store = {
    has: promisify(storage.has),
    get: promisify<string, any>(storage.get),
    set: promisify(storage.set),
    remove: promisify(storage.remove),
    getAll: promisify<any>(storage.getAll),
}
