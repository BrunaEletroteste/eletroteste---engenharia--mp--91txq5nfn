import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Users, Settings, Bell, LogOut } from 'lucide-react'
import logoUrl from '@/assets/logotransparente-c06b6.png'
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleLogout = () => {
    signOut()
    navigate('/login')
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-slate-200 bg-white p-4">
          <div className="flex items-center h-8">
            <img src={logoUrl} alt="EletroTeste Logo" className="h-full object-contain" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname.includes('/relatorio') || location.pathname === '/'}
                    asChild
                  >
                    <Link to="/">
                      <FileText />
                      <span>Relatórios</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user?.tipo_acesso === 'admin' && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={location.pathname.includes('/clientes')} asChild>
                        <Link to="/clientes">
                          <Users />
                          <span>Clientes</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={location.pathname.includes('/configuracoes')}
                        asChild
                      >
                        <Link to="/configuracoes/opcoes">
                          <Settings />
                          <span>Configurações</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex flex-col min-h-screen bg-muted/30">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background px-4 shadow-sm md:px-6 transition-all duration-200">
          <SidebarTrigger />
          <div className="flex-1 overflow-hidden">
            <h1 className="text-lg font-semibold truncate">
              Relatórios - Manutenção Preventiva de Cabine Primária
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end text-sm mr-2">
              <span className="font-medium">{user?.name || user?.email}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {user?.tipo_acesso?.replace('_', ' ')}
              </span>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive border-2 border-background"></span>
            </Button>
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair do Sistema">
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
