import { useEffect, useState, HTMLAttributes, MouseEvent, useMemo } from 'react'
import { store } from '../store'
import { themoviedb } from '../themoviedb'
import { url } from '../iina'
import { ipcRenderer } from 'electron'
import { twoDigits } from '../utils'
import Logo from './close_black_24dp.svg'
import { useIsDarkTheme } from './useIsDarkTheme'

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
.remove {
    opacity: 0;
    background-color: rgba(255, 255, 255, 0.8);
    transition-delay: 0s;
    visibility: hidden;
}
.element:not(.removing):hover .remove {
    opacity: 1;
    // transition-delay: 150ms;
    visibility: visible;
}
.remove:hover {
    background-color: #FFF;
}
.element.removing {
    opacity: 0.4;
    cursor: default;
}
.element.removing:hover {
    background-color: inherit;
}
.element.removing .remove {
    display: none;
}
`

const useStyles: (
    isDark: boolean
) => Record<string, HTMLAttributes<HTMLSpanElement>['style']> = (isDark) => ({
    mainContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    element: {
        position: 'relative',
    },
    container: {
        display: 'flex',
        overflow: 'auto',
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: 12,
        paddingTop: 6,
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
        color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#000',
    },
    removeIcon: {
        position: 'absolute',
        cursor: 'default',
        top: -6,
        right: -4,
        backdropFilter: 'blur(5px)',
        display: 'flex',
        borderRadius: '50%',
        fill: '#5a5a5a',
        width: 14,
        height: 14,
        padding: 4,
        boxShadow: '0 1px 3px 0px #00000040',
        transitionProperty: 'opacity',
        transitionDuration: '0ms',
        transitionTimingFunction: 'ease-out',
    },
    searchContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '13px 77px',
    },
    searchBar: {
        width: '100%',
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: isDark ? 'rgb(255 255 255 / 25%)' : 'rgb(0 0 0 / 25%)',
        color: isDark ? '#fff' : '#000',
        padding: 7,
        textAlign: 'center',
        borderRadius: 5,
        outline: 'none',
        maxWidth: 500,
    },
})

function sanitize(str: string) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
}

export function App() {
    const [medias, setMedias] = useState([])
    const [search, setSearch] = useState('')

    const isDarkTheme = useIsDarkTheme()

    const styles = useStyles(isDarkTheme)

    async function get() {
        const storage = await store.getAll()
        setMedias(
            Object.values(storage)
                .sort((a: any, b: any) => b.date - a.date)
                .map((media: any) => {
                    let subtitle = ''
                    if (media.episode) {
                        subtitle = `[S${twoDigits(media.episode.season)}E${twoDigits(
                            media.episode.number
                        )}] - ${media.episode.title}`
                    }
                    return {
                        ...media,
                        title: media.title || media.filename,
                        subtitle,
                    }
                })
        )
    }

    const filteredMedias = useMemo(() => {
        if (search) {
            return medias.filter((m) => {
                const words = search.split(' ')
                const compare = ['title', 'subtitle']

                return words.every((w) =>
                    compare.some((c) => sanitize(m[c]).includes(sanitize(w)))
                )
            })
        }
        return medias
    }, [search, medias])

    useEffect(() => {
        get()
    }, [])

    useEffect(() => {
        ipcRenderer.on('magnet', async () => {
            get()
        })

        return () => {
            ipcRenderer.removeAllListeners('magnet')
        }
    }, [])

    function handleClick(media: any) {
        if (media.removing) return
        location.href = url(media.link)
    }

    function handleRemove(e: MouseEvent, media: any) {
        e.stopPropagation()
        media.loading = true

        setMedias((old) =>
            old.map((el) => (el.slug === media.slug ? { ...el, removing: true } : el))
        )
        ipcRenderer.invoke('remove', media.slug)
    }

    return (
        <div style={styles.mainContainer}>
            <style>{css}</style>
            <div style={styles.searchContainer}>
                <input
                    style={styles.searchBar}
                    type="search"
                    placeholder="Search..."
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div style={styles.container}>
                {filteredMedias.map((media) => {
                    const className = `element${media.removing ? ' removing' : ''}`

                    return (
                        <div
                            key={media.slug}
                            style={styles.element}
                            className={className}
                            onClick={() => handleClick(media)}
                        >
                            <div
                                style={styles.removeIcon}
                                className="remove"
                                onClick={(e) => handleRemove(e, media)}
                            >
                                <Logo />
                            </div>
                            {media.cover ? (
                                <img
                                    src={themoviedb.getIconUrl(media.cover, 342)}
                                    style={styles.cover}
                                />
                            ) : (
                                <div style={styles.cover} />
                            )}
                            <span style={styles.title} title={media.title}>
                                {media.title}
                            </span>
                            <span style={styles.title} title={media.subtitle}>
                                {media.subtitle}
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
        </div>
    )
}
