'use client'

import { useState, useEffect, useCallback } from 'react'

export type ColorTheme = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'pink'

const STORAGE_KEY = 'fisiohub-color-theme'

const COLOR_CLASSES: Record<ColorTheme, string | null> = {
  default: null,
  blue: 'color-blue',
  green: 'color-green',
  purple: 'color-purple',
  orange: 'color-orange',
  pink: 'color-pink',
}

function applyColorTheme(theme: ColorTheme) {
  const html = document.documentElement
  Object.values(COLOR_CLASSES).forEach((cls) => {
    if (cls) html.classList.remove(cls)
  })
  const cls = COLOR_CLASSES[theme]
  if (cls) html.classList.add(cls)
}

export function useColorTheme() {
  const [theme, setThemeState] = useState<ColorTheme>('default')

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ColorTheme) ?? 'default'
    setThemeState(stored)
    applyColorTheme(stored)
  }, [])

  const setTheme = useCallback((newTheme: ColorTheme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyColorTheme(newTheme)
  }, [])

  return { theme, setTheme }
}
