import { createContext, useContext, useMemo, useState, useEffect, useLayoutEffect } from 'react'
import { api, authGetToken, authSetToken } from '@/lib/api'

const AuthContext = createContext(null)

const USER_KEY = 'medrese-user'
const THEME_KEY_PREFIX = 'medrese-theme'

function getStoredTheme(user) {
  const storageKey = user?.id ? `${THEME_KEY_PREFIX}:${user.id}` : `${THEME_KEY_PREFIX}:guest`
  const saved = localStorage.getItem(storageKey)

  if (saved === 'light' || saved === 'dark') return saved

  // Tema e ditës është pamja fillestare; zgjedhja e ruajtur e përdoruesit
  // vazhdon të respektohet.
  return 'light'
}

function applyTheme(theme) {
  if (typeof document === 'undefined') return

  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.classList.toggle('theme-light', theme === 'light')
  document.documentElement.classList.toggle('theme-dark', theme === 'dark')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY)

    if (!saved || saved === 'undefined') return null

    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  })
  const [theme, setThemeState] = useState(() => getStoredTheme(user))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authGetToken()

    if (!token) {
      setUser(null)
      localStorage.removeItem(USER_KEY)
      setLoading(false)
      return
    }

    api.auth
      .me()
      .then((res) => {
        const me = res.data

        setUser(me)
        localStorage.setItem(USER_KEY, JSON.stringify(me))
      })
      .catch(() => {
        authSetToken(null)
        setUser(null)
        localStorage.removeItem(USER_KEY)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useLayoutEffect(() => {
    const resolvedTheme = getStoredTheme(user)
    setThemeState(resolvedTheme)
    applyTheme(resolvedTheme)
  }, [user])

  useLayoutEffect(() => {
    applyTheme(theme)
  }, [theme])

  const login = async (email, password) => {
    try {
      const res = await api.auth.login(email, password)

      const payload = res?.data
      const token = payload?.token
      const me = payload?.user

      if (!token) {
        return { ok: false, error: 'Missing token in response' }
      }

      authSetToken(token)
      setUser(me)
      localStorage.setItem(USER_KEY, JSON.stringify(me))

      return { ok: true }
    } catch (e) {
      return { ok: false, error: 'Hyrja nuk u krye. Kontrolloni emailin, fjalëkalimin dhe lidhjen me serverin.' }
    }
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch {
      // ignore
    }

    authSetToken(null)
    setUser(null)
    localStorage.removeItem(USER_KEY)
  }

  const refreshUser = async () => {
    const res = await api.auth.me()
    const me = res?.data || res
    setUser(me)
    localStorage.setItem(USER_KEY, JSON.stringify(me))
    return me
  }

  const setTheme = (nextTheme) => {
    const normalized = nextTheme === 'light' ? 'light' : 'dark'
    const storageKey = user?.id ? `${THEME_KEY_PREFIX}:${user.id}` : `${THEME_KEY_PREFIX}:guest`

    localStorage.setItem(storageKey, normalized)
    setThemeState(normalized)
    applyTheme(normalized)
  }

  const value = useMemo(
    () => ({ user, login, logout, refreshUser, setTheme, theme, isAuthenticated: Boolean(user), loading }),
    [user, theme, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
