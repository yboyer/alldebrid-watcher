import { HTMLAttributes, useState } from 'react'
import { useIsDarkTheme } from './useIsDarkTheme'

const useStyles: (
    isDark: boolean
) => Record<string, HTMLAttributes<HTMLSpanElement>['style']> = (isDark) => ({
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
        color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#000',
        padding: 7,
        textAlign: 'center',
        borderRadius: 5,
        outline: 'none',
        maxWidth: 500,
        transition: 'border-color 150ms',
    },
    searchBarHover: {
        transition: 'background-color 200ms',
        backgroundColor: isDark ? 'rgb(255 255 255 / 5%)' : 'rgb(0 0 0 / 3%)',
    },
    searchBarFocus: {
        backgroundColor: isDark ? 'rgb(255 255 255 / 2%)' : 'rgb(0 0 0 / 0%)',
        borderColor: isDark ? 'rgb(33 150 243 / 90%)' : 'rgb(0 0 0 / 100%)',
        transition: 'background-color 0ms',
    },
})

export function SearchBar({ onValue }) {
    const isDarkTheme = useIsDarkTheme()
    const [focus, setFocus] = useState(false)
    const [hover, setHover] = useState(false)

    const styles = useStyles(isDarkTheme)

    return (
        <div style={styles.searchContainer}>
            <input
                style={{
                    ...styles.searchBar,
                    ...(hover ? styles.searchBarHover : {}),
                    ...(focus ? styles.searchBarFocus : {}),
                }}
                className="searchBar"
                type="search"
                placeholder="Search..."
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onChange={(e) => onValue(e.target.value)}
            />
        </div>
    )
}
