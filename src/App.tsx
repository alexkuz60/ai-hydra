import { Suspense, lazy, ComponentType } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ApiKeyExpirationNotifier } from "@/components/profile/ApiKeyExpirationNotifier";

// Auto-reload on stale chunk errors (happens after deploys)
function lazyWithRetry(factory: () => Promise<{ default: ComponentType<any> }>) {
  return lazy(() =>
    factory().catch((err) => {
      const key = 'chunk-reload';
      const lastReload = sessionStorage.getItem(key);
      const now = Date.now();
      // Reload only once per 10 seconds to avoid infinite loops
      if (!lastReload || now - Number(lastReload) > 10000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
      throw err;
    })
  );
}

// Lazy load pages with auto-retry on stale chunks
const Index = lazyWithRetry(() => import("./pages/Index"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const Signup = lazyWithRetry(() => import("./pages/Signup"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Tasks = lazyWithRetry(() => import("./pages/Tasks"));
const ExpertPanel = lazyWithRetry(() => import("./pages/ExpertPanel"));
const ModelRatings = lazyWithRetry(() => import("./pages/ModelRatings"));
const RoleLibrary = lazyWithRetry(() => import("./pages/RoleLibrary"));
const ToolsLibrary = lazyWithRetry(() => import("./pages/ToolsLibrary"));
const FlowEditor = lazyWithRetry(() => import("./pages/FlowEditor"));
const Hydrapedia = lazyWithRetry(() => import("./pages/Hydrapedia"));
const StaffRoles = lazyWithRetry(() => import("./pages/StaffRoles"));
const BehavioralPatterns = lazyWithRetry(() => import("./pages/BehavioralPatterns"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Minimal loading fallback to avoid layout shift
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ApiKeyExpirationNotifier />
            <BrowserRouter>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/expert-panel" element={<ExpertPanel />} />
                    <Route path="/model-ratings" element={<ModelRatings />} />
                    <Route path="/role-library" element={<RoleLibrary />} />
                    <Route path="/tools-library" element={<ToolsLibrary />} />
                    <Route path="/flow-editor" element={<FlowEditor />} />
                    <Route path="/hydrapedia" element={<Hydrapedia />} />
                    <Route path="/staff-roles" element={<StaffRoles />} />
                    <Route path="/behavioral-patterns" element={<BehavioralPatterns />} />
                    <Route path="/war-room" element={<Navigate to="/expert-panel" replace />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
