import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

import { ErrorBoundary } from './components/ErrorBoundary'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Index from './pages/Index'
import ReportForm from './pages/ReportForm'
import ReportPrint from './pages/ReportPrint'
import ReportPreview from './pages/ReportPreview'
import PublicValidation from './pages/PublicValidation'
import ConfigOptions from './pages/ConfigOptions'
import Clientes from './pages/Clientes'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import Login from './pages/Login'
import UsersPage from './pages/Users'
import AuditLogs from './pages/AuditLogs'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading, error } = useAuth()

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-md shadow-sm border border-red-100">
          <h2 className="text-lg font-bold mb-2">Erro de Conexão</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

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
    <ErrorBoundary>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/validar/:id" element={<PublicValidation />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<Dashboard />} />
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
            <Route
              path="/relatorio/preview/:id"
              element={
                <ProtectedRoute>
                  <ReportPreview />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </ErrorBoundary>
  </BrowserRouter>
)

export default App
