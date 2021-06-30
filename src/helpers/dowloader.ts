import stream from 'stream'
import got from 'got'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { promisify } from 'util'

const pipeline = promisify(stream.pipeline)

export async function download({ url, name }) {
    const dist = path.join(os.tmpdir(), name)
    try {
        fs.statSync(dist)
    } catch (e) {
        await pipeline(got.stream(url), fs.createWriteStream(dist))
    }
    return dist
}
