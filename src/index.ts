import { app, BrowserWindow, ipcMain, Notification } from 'electron'
import type { NotificationOptions } from './types/notification'
import path from 'path'
import open from 'open'
import { manager } from './manager'
import { alldebrid } from './alldebrid'

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
        },
        trafficLightPosition: { x: 10, y: 20 },
        transparent: true,
        width: 800,
        titleBarStyle: 'hiddenInset',
        minWidth: 320,
        minHeight: 280,
        vibrancy: 'menu',
    })

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'))

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    return mainWindow
}

async function refreshUI(mainWindow: BrowserWindow) {
    try {
        const magnets = await manager.getMagnets()
        if (magnets.length) {
            mainWindow.webContents.send('magnet')
        }
    } catch (err) {
        console.error(err)
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        waitForPin(mainWindow)
    }
}

async function checkPin(mainWindow: BrowserWindow) {
    const ok = await alldebrid.checkPin()
    if (ok) {
        mainWindow.webContents.send('needToken', null)
        refreshUI(mainWindow)
        return true
    }

    const url = await alldebrid.getPinUrl()
    mainWindow.webContents.send('needToken', url)
    return false
}

async function waitForPin(mainWindow: BrowserWindow) {
    if (alldebrid.needPin()) {
        checkPin(mainWindow)
        const intervalNumber = setInterval(async () => {
            if (await checkPin(mainWindow)) {
                clearInterval(intervalNumber)
            }
        }, 1000)
    } else {
        mainWindow.webContents.send('needToken', null)
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    if (!app.isInApplicationsFolder()) {
        // app.moveToApplicationsFolder()
    }
    let mainWindow = createWindow()

    ipcMain.handle('remove', async (_, slug: string) => {
        await manager.remove(slug)
        mainWindow.webContents.send('magnet')
    })

    mainWindow.once('ready-to-show', function () {
        waitForPin(mainWindow)
    })

    ipcMain.handle('checkPin', function () {
        waitForPin(mainWindow)
    })

    setInterval(() => refreshUI(mainWindow), 5e3)
    refreshUI(mainWindow)

    // app.dock.hide()

    // console.log(path.join(__dirname, 'icon.png'))
    // const tray = new Tray(path.join(__dirname, 'icon.png'))
    // const contextMenu = Menu.buildFromTemplate([{ label: 'Item1', type: 'radio' }])
    // tray.setToolTip('This is my application.')
    // // tray.setContextMenu(contextMenu)

    ipcMain.handle('notify', (_, data: NotificationOptions) => {
        const notif = new Notification(data)
        notif.show()
        if (data.urlOpen) {
            notif.on('click', () => {
                open(data.urlOpen)
            })
        }
    })

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            mainWindow = createWindow()
        }
    })

    app.on('browser-window-blur', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            mainWindow = createWindow()
        }
    })

    app.on('browser-window-focus', function () {
        console.log('focus')
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
