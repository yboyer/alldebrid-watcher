import { Notification } from 'electron'
import type { NotificationOptions } from './types/notification'

const map = new Map<string, Notification>()

export function notify(data: NotificationOptions) {
    const notif = map.get(data.id) || new Notification(data)
    let changed = false
    if (data.silent === undefined) {
        data.silent = false
    }
    Object.keys(data).forEach((key) => {
        if (!changed && notif[key] !== data[key]) {
            changed = true
        }
        notif[key] = data[key]
    })
    if (changed) {
        notif.show()
    }
    map.set(data.id, notif)
    if (data.urlOpen) {
        notif.on('click', () => {
            open(data.urlOpen)
        })
    }
}
