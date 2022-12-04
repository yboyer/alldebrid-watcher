import { ipcRenderer, shell } from 'electron'
import { HTMLAttributes, useEffect, useState } from 'react'
import { useIsDarkTheme } from './useIsDarkTheme'

const useStyles: (
    isDark?: boolean
) => Record<string, HTMLAttributes<HTMLSpanElement>['style']> = (isDark) => ({
    mainContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#000',
    },
    title: {
        color: isDark ? '#FFF' : '#000',
        margin: 0,
    },
    button: {
        marginTop: 20,
        borderRadius: 5,
        borderStyle: 'none',
        color: isDark ? '#000' : 'rgba(255, 255, 255, 0.7)',
        padding: '5px 10px',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.7)' : '#000',
    },
})

export function TokenProvider({ children }) {
    const [needToken, setNeedToken] = useState(true)
    const [tokenUrl, setTokenUrl] = useState('')
    const isDark = useIsDarkTheme()

    const styles = useStyles(isDark)

    useEffect(() => {
        ipcRenderer.invoke('checkPin')
        ipcRenderer.on('needToken', async (_, url) => {
            setNeedToken(Boolean(url))
            setTokenUrl(url)
        })
    }, [])

    if (needToken && !tokenUrl) {
        return null
    }

    if (needToken) {
        return (
            <>
                <div style={styles.mainContainer}>
                    <h1 style={styles.title}>R2</h1>
                    <p>AllDebrid watcher</p>
                    <button
                        style={styles.button}
                        onClick={() => {
                            shell.openExternal(tokenUrl)
                        }}
                    >
                        Open AllDebrid to start
                    </button>
                </div>
            </>
        )
    }

    return <>{children}</>
}
