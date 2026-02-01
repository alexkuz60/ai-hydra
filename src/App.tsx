import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Lazy load pages to reduce initial bundle size and improve FID
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Profile = lazy(() => import("./pages/Profile"));
const Tasks = lazy(() => import("./pages/Tasks"));
const ExpertPanel = lazy(() => import("./pages/ExpertPanel"));
const ModelRatings = lazy(() => import("./pages/ModelRatings"));
const RoleLibrary = lazy(() => import("./pages/RoleLibrary"));
const ToolsLibrary = lazy(() => import("./pages/ToolsLibrary"));
const FlowEditor = lazy(() => import("./pages/FlowEditor"));
const Hydrapedia = lazy(() => import("./pages/Hydrapedia"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
            <BrowserRouter>
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
                  <Route path="/war-room" element={<Navigate to="/expert-panel" replace />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
