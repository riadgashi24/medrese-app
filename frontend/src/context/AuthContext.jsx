import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { api, authGetToken, authSetToken } from '@/lib/api'

const AuthContext = createContext(null)

const USER_KEY = 'medrese-user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY)

    if (!saved || saved === "undefined") return null

    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const token = authGetToken();

  if (!token) {
    setLoading(false);
    return;
  }

  api.auth
    .me()
    .then((res) => {
      const me = res.data;

      setUser(me);
      localStorage.setItem(USER_KEY, JSON.stringify(me));
    })
    .catch(() => {
      authSetToken(null);
      setUser(null);
      localStorage.removeItem(USER_KEY);
    })
    .finally(() => {
      setLoading(false);
    });
}, []);

const login = async (email, password) => {
  try {
    const res = await api.auth.login(email, password)

    const payload = res?.data

    const token = payload?.token
    const me = payload?.user

    if (!token) {
      return { ok: false, error: "Missing token in response" }
    }

    authSetToken(token)
    setUser(me)

    localStorage.setItem(USER_KEY, JSON.stringify(me))

    return { ok: true }
  } catch (e) {
    return { ok: false, error: "Login failed" }
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

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated: Boolean(user) }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

