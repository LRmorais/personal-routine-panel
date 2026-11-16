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
    <div className="app-bg fixed inset-0 flex flex-col items-center justify-center gap-5 px-6 text-slate-100">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl btn-primary text-3xl font-black text-white">
          R
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">Ritmo</h1>
        <p className="max-w-60 text-center text-sm text-slate-400">Um dia de cada vez. Construa sua sequência.</p>
      </div>
      <form onSubmit={onSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl btn-primary px-5 py-3 font-medium text-white active:bg-blue-700 disabled:opacity-50"
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
      <div className="fixed inset-0 flex items-center justify-center text-slate-400">
        Carregando...
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return <AuthContext.Provider value={{ user, signOutUser }}>{children}</AuthContext.Provider>
}
