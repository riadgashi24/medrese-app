import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { DEMO_USERS, ROLE_LABELS } from '@/data/mockData'
import Logo from '@/components/ui/Logo'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('director@medrese.edu')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    if (!result.ok) setError(result.error)
    setLoading(false)
  }


  const quickLogin = (user) => {
    setEmail(user.email)
    setPassword(user.password)
    login(user.email, user.password)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <div className="mesh-bg" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo />
        </div>

        <form onSubmit={handleSubmit} className="glass p-8 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Fjalekalimi</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2">
          {loading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          )}
          {loading ? 'Duke hyre...' : 'Hyr'}
        </Button>
          <p className="text-center text-xs text-surface-700">
            Fjalekalimi demo per te gjitha llogarite: <span className="font-mono text-surface-300">demo123</span>
          </p>
        </form>

        <div className="mt-6 glass p-4">
          <p className="section-label mb-3">Hyrje e shpejte sipas rolit</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => quickLogin(user)}
                className="rounded-lg border border-white/8 bg-surface-900/40 px-3 py-2 text-left text-xs hover:border-brand-500/30 hover:bg-brand-500/5 transition-colors"
              >
                <span className="block font-medium text-surface-100">{ROLE_LABELS[user.role]}</span>
                <span className="text-surface-700 font-mono">{user.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
