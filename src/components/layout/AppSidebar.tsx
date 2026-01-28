import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  LogOut, 
  Settings, 
  Moon, 
  Sun, 
  Globe, 
  Zap, 
  Users, 
  CheckSquare, 
  Home,
  ChevronUp,
  BarChart3,
  Library
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = user ? [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/expert-panel', icon: Users, label: t('nav.expertPanel') },
    { path: '/tasks', icon: CheckSquare, label: t('nav.tasks') },
    { path: '/role-library', icon: Library, label: t('nav.roleLibrary') },
    { path: '/model-ratings', icon: BarChart3, label: t('nav.modelRatings') },
  ] : [
    { path: '/', icon: Home, label: t('nav.home') },
  ];

  return (
    <Sidebar collapsible="icon">
      {/* Logo Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="AI-Hydra"
            >
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative flex items-center justify-center w-8 h-8">
                  <Zap className="h-6 w-6 text-sidebar-primary hydra-text-glow transition-transform group-hover:scale-110" />
                </div>
                <span className={cn(
                  "text-lg font-bold bg-gradient-to-r from-sidebar-primary to-hydra-expert bg-clip-text text-transparent",
                  isCollapsed && "hidden"
                )}>
                  AI-Hydra
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="hydra-scrollbar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                    className={cn(
                      "hydra-menu-hover transition-all duration-200",
                      isActive(item.path) && "hydra-menu-active"
                    )}
                  >
                    <Link to={item.path} className="flex items-center gap-2">
                      <item.icon className={cn(
                        "h-4 w-4 transition-all duration-200",
                        isActive(item.path) && "text-hydra-glow hydra-text-glow"
                      )} />
                      <span className={cn(
                        "transition-colors duration-200",
                        isActive(item.path) && "text-sidebar-primary font-medium"
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with user menu and settings */}
      <SidebarFooter className="border-t border-sidebar-border">
        {/* Theme & Language */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleTheme}
              tooltip={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton tooltip={t('profile.language')}>
                  <Globe className="h-4 w-4" />
                  <span>{availableLanguages.find(l => l.code === language)?.name}</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                side="right" 
                align="end" 
                className="bg-popover border border-border z-50"
              >
                {availableLanguages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? 'text-primary' : ''}
                  >
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        {/* User Menu */}
        <SidebarMenu>
          {user ? (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip={t('nav.profile')}>
                    <User className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                    <ChevronUp className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  side="right" 
                  align="end" 
                  className="bg-popover border border-border z-50 min-w-[180px]"
                >
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {t('nav.profile')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ) : (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t('nav.login')}>
                  <Link to="/login">
                    <User className="h-4 w-4" />
                    <span>{t('nav.login')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t('nav.signup')}>
                  <Link to="/signup" className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
                    <Zap className="h-4 w-4" />
                    <span>{t('nav.signup')}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
