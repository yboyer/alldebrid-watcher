import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { App } from './client/App'

//

async function init(rootEl) {
    if (!rootEl) return

    ReactDOM.render(
        <StrictMode>
            <App />
        </StrictMode>,
        rootEl
    )
}

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', async () => {
    init(document.getElementById('app'))
})
