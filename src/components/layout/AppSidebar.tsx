import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
  ChevronUp,
  BarChart3,
  Library,
  Wrench,
  GitBranch,
  BookOpen,
  UserCog,
  Sparkles,
  Compass,
  Map
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGuideTourContext } from '@/contexts/GuideTourContext';
import { MiniHydraGears } from './MiniHydraGears';

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { openPicker: openGuideTour } = useGuideTourContext();
  const { isAdmin } = useUserRoles();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Navigation items - Hydrapedia is always available
  const navItems = user ? [
    { path: '/tasks', icon: CheckSquare, label: t('nav.tasks') },
    { path: '/staff-roles', icon: UserCog, label: t('nav.staffRoles') },
    { path: '/behavioral-patterns', icon: Sparkles, label: t('nav.behavioralPatterns') },
    { path: '/role-library', icon: Library, label: t('nav.roleLibrary') },
    { path: '/tools-library', icon: Wrench, label: t('nav.toolsLibrary') },
    { path: '/flow-editor', icon: GitBranch, label: t('nav.flowEditor') },
    { path: '/model-ratings', icon: BarChart3, label: t('nav.modelRatings') },
    { path: '/hydrapedia', icon: BookOpen, label: t('nav.hydrapedia') },
  ] : [
    // Guest users only see Hydrapedia
    { path: '/hydrapedia', icon: BookOpen, label: t('nav.hydrapedia') },
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
              <Link to="/" className="flex items-center gap-1 group font-rounded">
                <span className={cn(
                  "text-xl font-bold bg-gradient-to-r from-sidebar-primary to-hydra-expert bg-clip-text text-transparent",
                  isCollapsed && "hidden"
                )}>
                  ai
                </span>
                <img 
                  src="/logo.svg" 
                  alt="" 
                  className="h-7 w-7 transition-transform duration-500 group-hover:animate-[spin-slow_0.6s_ease-in-out]" 
                />
                <span className={cn(
                  "text-xl font-bold bg-gradient-to-r from-hydra-expert to-hydra-arbiter bg-clip-text text-transparent",
                  isCollapsed && "hidden"
                )}>
                  hydra
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
            <SidebarMenu className="gap-2">
              {/* Expert Panel – large square card */}
              {user && (
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/expert-panel"
                        className={cn(
                          "flex items-center justify-center w-full aspect-square rounded-lg border-2 border-muted hover:bg-muted/50 transition-all duration-200 active:scale-95",
                          isActive('/expert-panel') && "hydra-menu-active bg-accent/30"
                        )}
                      >
                        <MiniHydraGears className="w-[85%] h-[85%]" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{t('nav.expertPanel')}</TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              )}
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                    className={cn(
                      "transition-all duration-200 active:scale-95 active:opacity-80 border-2 border-muted rounded-md hover:bg-muted/50 py-3",
                      isActive(item.path) && "hydra-menu-active bg-accent/30"
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

        {/* Guide Tour */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={openGuideTour}
                  tooltip={language === 'ru' ? 'Экскурсия' : 'Guided Tour'}
                  className="transition-all duration-200 active:scale-95 border-2 border-dashed border-hydra-guide/30 rounded-md hover:bg-hydra-guide/10 py-3 text-hydra-guide"
                >
                  <Compass className="h-4 w-4" />
                  <span>{language === 'ru' ? 'Экскурсия' : 'Guided Tour'}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive('/guide-editor')}
                    tooltip={language === 'ru' ? 'Редактор экскурсий' : 'Tour Editor'}
                    className={cn(
                      "transition-all duration-200 active:scale-95 border-2 border-muted rounded-md hover:bg-muted/50 py-3",
                      isActive('/guide-editor') && "hydra-menu-active bg-accent/30"
                    )}
                  >
                    <Link to="/guide-editor" className="flex items-center gap-2">
                      <Map className={cn(
                        "h-4 w-4 transition-all duration-200",
                        isActive('/guide-editor') && "text-hydra-glow hydra-text-glow"
                      )} />
                      <span className={cn(
                        "transition-colors duration-200",
                        isActive('/guide-editor') && "text-sidebar-primary font-medium"
                      )}>
                        {language === 'ru' ? 'Редактор экскурсий' : 'Tour Editor'}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
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
