import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

import Layout from './components/Layout'
import Index from './pages/Index'
import ReportForm from './pages/ReportForm'
import ReportPrint from './pages/ReportPrint'
import ConfigOptions from './pages/ConfigOptions'
import Clientes from './pages/Clientes'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import UsersPage from './pages/Users'
import AuditLogs from './pages/AuditLogs'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Index />} />
            <Route path="/relatorio/novo" element={<ReportForm />} />
            <Route path="/relatorio/editar/:id" element={<ReportForm />} />
            <Route path="/relatorio/visualizar/:id" element={<ReportForm />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/configuracoes/opcoes" element={<ConfigOptions />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/usuarios" element={<UsersPage />} />
            <Route path="/auditoria" element={<AuditLogs />} />
          </Route>
          <Route
            path="/relatorio/imprimir/:id"
            element={
              <ProtectedRoute>
                <ReportPrint />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
