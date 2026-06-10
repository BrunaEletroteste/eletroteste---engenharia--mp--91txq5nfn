import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Bell,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react'
import logoUrl from '@/assets/logotransparente-20c57.png'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'

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
        <SidebarHeader className="relative z-10 flex h-16 shrink-0 items-center justify-center border-b border-slate-200 bg-white px-4 py-0 shadow-sm">
          <div className="flex h-10 w-full items-center justify-center">
            <img src={logoUrl} alt="EletroTeste Logo" className="h-full w-auto object-contain" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={location.pathname === '/dashboard'} asChild>
                    <Link to="/dashboard">
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
                {(user?.tipo_acesso === 'admin' || user?.tipo_acesso === 'revisor_interno') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive={location.pathname.includes('/clientes')} asChild>
                      <Link to="/clientes">
                        <Users />
                        <span>Clientes</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {user?.tipo_acesso === 'admin' && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive={location.pathname.includes('/usuarios')} asChild>
                        <Link to="/usuarios">
                          <Users />
                          <span>Gestão de Usuários</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={location.pathname.includes('/auditoria')}
                        asChild
                      >
                        <Link to="/auditoria">
                          <ShieldCheck />
                          <span>Logs de Auditoria</span>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage
                      src={
                        user?.avatar
                          ? pb.files.getURL(user, user.avatar)
                          : `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`
                      }
                      className="object-cover"
                    />
                    <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil" className="cursor-pointer flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
