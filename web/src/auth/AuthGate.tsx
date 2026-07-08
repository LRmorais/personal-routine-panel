import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { auth } from '../firebase'

type AuthContextValue = {
  user: User
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthGate')
  return ctx
}

function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha incorretos.'
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com esse e-mail — use "Entrar" em vez de "Criar conta".'
    case 'auth/weak-password':
      return 'Senha muito curta (mínimo 6 caracteres).'
    default:
      return 'Falha ao entrar. Tente novamente.'
  }
}

function LoginScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-slate-950 px-6 text-slate-100">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
        <h1 className="text-2xl font-semibold tracking-tight">Ritmo</h1>
      </div>
      <form onSubmit={onSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 placeholder:text-slate-500"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-slate-100 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white active:bg-blue-700 disabled:opacity-50"
        >
          {mode === 'signup' ? 'Criar conta' : 'Entrar'}
        </button>
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
      </form>
      <button
        onClick={() => {
          setMode(mode === 'signup' ? 'signin' : 'signup')
          setError(null)
        }}
        className="text-sm text-slate-400 active:text-slate-200"
      >
        {mode === 'signup' ? 'Já tenho conta — entrar' : 'Primeiro acesso — criar conta'}
      </button>
    </div>
  )
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [])

  const signOutUser = () => signOut(auth)

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center text-slate-400">
        Carregando...
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return <AuthContext.Provider value={{ user, signOutUser }}>{children}</AuthContext.Provider>
}
