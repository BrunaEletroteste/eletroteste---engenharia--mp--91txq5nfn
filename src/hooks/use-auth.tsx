import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.isValid ? pb.authStore.record : null)
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkActive = (record: any) =>
      record && record.ativo === true && record.tipo_acesso !== 'visitante'

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      const isValidAndActive = pb.authStore.isValid && checkActive(record)
      if (pb.authStore.isValid && !checkActive(record)) {
        pb.authStore.clear()
      }
      setUser(isValidAndActive ? record : null)
      setIsAuthenticated(isValidAndActive)
    })

    const initAuth = async () => {
      if (pb.authStore.isValid) {
        if (!checkActive(pb.authStore.record)) {
          pb.authStore.clear()
          setLoading(false)
        } else {
          pb.collection('users')
            .authRefresh({ requestKey: null })
            .then((authData) => {
              if (!checkActive(authData.record)) {
                pb.authStore.clear()
              }
            })
            .catch((err: any) => {
              console.error('Auth refresh error', err)
              if (err?.status === 0 || (err?.status && err.status >= 500)) {
                setError(
                  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
                )
              } else {
                pb.authStore.clear()
              }
            })
            .finally(() => setLoading(false))
        }
      } else {
        if (pb.authStore.record) pb.authStore.clear()
        setLoading(false)
      }
    }

    initAuth()

    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name: name || '',
        tipo_acesso: 'visitante',
        ativo: false,
      })
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)

      if (!authData.record || authData.record.ativo !== true) {
        pb.authStore.clear()
        return { error: new Error('Conta inativa') }
      }

      if (authData.record.tipo_acesso === 'visitante') {
        pb.authStore.clear()
        return { error: new Error('Visitante') }
      }

      try {
        await pb.collection('audit_logs').create({
          user: authData.record.id,
          action_type: 'login',
          details: 'Login efetuado com sucesso',
        })
      } catch (e) {
        console.error('Falha ao registrar log de auditoria do login', e)
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signUp, signIn, signOut, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}
