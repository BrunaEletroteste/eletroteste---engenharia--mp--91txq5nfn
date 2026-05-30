import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
          <Alert variant="destructive" className="max-w-md bg-white shadow-lg border-red-200">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Erro Inesperado</AlertTitle>
            <AlertDescription className="mt-3 flex flex-col gap-4">
              <p className="text-slate-600">
                Desculpe, ocorreu um erro inesperado na aplicação que impediu a renderização correta
                desta página.
              </p>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    this.setState({ hasError: false })
                    window.location.reload()
                  }}
                  className="w-full sm:w-auto text-slate-900"
                >
                  Recarregar Página
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}
