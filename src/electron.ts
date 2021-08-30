import { app, Notification } from 'electron'

import type { NotificationOptions } from './types/notification'

const map = new Map<string, Notification>()
let isFocus = false

app.on('activate', function () {
    app.setBadgeCount(0)
})

app.on('browser-window-blur', function () {
    isFocus = false

    app.setBadgeCount(0)
})

app.on('browser-window-focus', function () {
    isFocus = true
    app.setBadgeCount(0)
})

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
    if (!isFocus && !data.silent) {
        app.setBadgeCount(app.getBadgeCount() + 1)
    }
    map.set(data.id, notif)
    if (data.urlOpen) {
        notif.on('click', () => {
            open(data.urlOpen)
        })
    }
}
