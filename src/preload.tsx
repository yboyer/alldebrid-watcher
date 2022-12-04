import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './client/App'
import { TokenProvider } from './client/TokenProvider'

//

async function init(rootEl) {
    if (!rootEl) return

    const root = createRoot(rootEl)
    root.render(
        <StrictMode>
            <TokenProvider>
                <App />
            </TokenProvider>
        </StrictMode>
    )
}

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', async () => {
    init(document.getElementById('app'))
})
