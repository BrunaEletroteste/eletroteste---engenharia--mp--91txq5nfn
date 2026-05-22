import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ReportProvider } from '@/context/report-context'

import Layout from './components/Layout'
import Index from './pages/Index'
import ReportForm from './pages/ReportForm'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <ReportProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/relatorio/novo" element={<ReportForm />} />
            <Route path="/relatorio/editar/:id" element={<ReportForm />} />
            <Route path="/relatorio/visualizar/:id" element={<ReportForm />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </ReportProvider>
  </BrowserRouter>
)

export default App
