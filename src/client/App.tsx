import { useEffect, useState, HTMLAttributes } from 'react'
import { store } from '../store'
import { themoviedb } from '../themoviedb'
import { url } from '../iina'
import { ipcRenderer } from 'electron'
import { twoDigits } from '../utils'

const css = `
.element {
    text-align: center;
    display: flex;
    align-items: center;
    border-radius: 7px;
    padding: 6px 10px;
    width: 125px;
    cursor: pointer;
    flex-direction: column;
}
.element:hover {
    background-color: #7955486b;
}
`

const styles: Record<string, HTMLAttributes<HTMLSpanElement>['style']> = {
    container: {
        display: 'flex',
        overflow: 'hidden',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    cover: {
        width: 125,
        height: 188,
        borderRadius: 5,
        marginBottom: 2,
        backgroundColor: 'rgb(0 0 0 / 30%)',
    },
    title: {
        fontSize: 13,
        marginLeft: 12,
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        width: '100%',
    },
}

export function App() {
    const [media, setMedia] = useState([])

    useEffect(() => {
        async function get() {
            const storage = await store.getAll()
            console.log(storage)
            setMedia(Object.values(storage).sort((a: any, b: any) => b.date - a.date))
        }

        get()
    }, [])

    useEffect(() => {
        ipcRenderer.on('magnet', async () => {
            const storage = await store.getAll()
            setMedia(Object.values(storage))
        })

        return () => {
            ipcRenderer.removeAllListeners('magnet')
        }
    }, [])

    function handleClick(media: any) {
        location.href = url(media.link)
        console.log(media)
    }

    return (
        <>
            <style>{css}</style>
            <div style={styles.container}>
                {media.map((media) => {
                    const title = media.title || media.filename
                    let subtitle = ''
                    if (media.episode) {
                        subtitle = `[S${twoDigits(media.episode.season)}E${twoDigits(
                            media.episode.number
                        )}] - ${media.episode.title}`
                    }

                    return (
                        <div
                            key={media.slug}
                            style={styles.element}
                            className="element"
                            onClick={() => handleClick(media)}
                        >
                            {media.cover ? (
                                <img
                                    src={themoviedb.getIconUrl(media.cover, 342)}
                                    style={styles.cover}
                                />
                            ) : (
                                <div style={styles.cover} />
                            )}
                            <span style={styles.title} title={title}>
                                {title}
                            </span>
                            <span style={styles.title} title={subtitle}>
                                {subtitle}
                            </span>
                            {media.resolution || media.language ? (
                                <span style={styles.title}>
                                    {media.resolution} -{' '}
                                    {media.language?.toUpperCase() || 'N/A'}
                                </span>
                            ) : null}
                            {media.releaseDate ? (
                                <span style={styles.title}>
                                    {new Date(media.releaseDate).getUTCFullYear()}
                                </span>
                            ) : null}
                        </div>
                    )
                })}
            </div>
        </>
    )
}
