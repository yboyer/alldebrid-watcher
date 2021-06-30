import { manager } from './manager'

async function refreshUI() {
    const magnets = await manager.getMagnets()
    // console.log(magnets)
}

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', async () => {
    const replaceText = (selector: string, text: string) => {
        const element = document.getElementById(selector)
        if (element) {
            element.innerText = text
        }
    }
    setInterval(refreshUI, 5e3)
    refreshUI()

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(
            `${type}-version`,
            process.versions[type as keyof NodeJS.ProcessVersions]
        )
    }
})
