import { useState } from 'react'

export function useIsDarkTheme() {
    const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)')
    const [dark, setDark] = useState(darkModePreference.matches)

    darkModePreference.addEventListener('change', (e) => setDark(e.matches))

    return dark
}
