import { NotificationConstructorOptions } from 'electron'

export type NotificationOptions = NotificationConstructorOptions & {
    urlOpen: string
    id: string
}
