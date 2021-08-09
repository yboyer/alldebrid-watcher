import { Notification } from 'electron'
import type { NotificationOptions } from './types/notification'

export function notify(data: NotificationOptions) {
    const notif = new Notification(data)
    notif.show()
    if (data.urlOpen) {
        notif.on('click', () => {
            open(data.urlOpen)
        })
    }
}
