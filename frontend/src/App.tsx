import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthProvider';
import { useAuth } from './hooks/useAuth';
import { MainLayout } from './layouts/MainLayout';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { SovereignErrorBoundary } from './components/ui/SovereignErrorBoundary';

// Aggressive Code-Splitting: Lazy load heavy page chunks to minimize bundle weight
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Events = lazy(() => import('./pages/Events'));
const Kiosk = lazy(() => import('./pages/Kiosk'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F13] text-foreground font-sans select-none">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <RefreshCw className="h-6 w-6 text-primary animate-spin" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Verifying Identity...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function RouteSuspenseFallback() {
  return (
    <div className="min-h-[50vh] w-full flex flex-col items-center justify-center gap-4 animate-pulse select-none font-sans">
      <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(168,85,247,0.15)]">
        <RefreshCw className="h-5 w-5 animate-spin" />
      </div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
        Resolving Dynamic Chunk...
      </p>
    </div>
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 relative select-none">
      {/* Background Cyber Glow */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <span className="text-[120px] md:text-[220px] font-black tracking-tighter text-primary">404</span>
      </div>
      
      {/* Main Glass Alert Card */}
      <div className="relative z-10 space-y-6 max-w-md w-full glass border-destructive/20 p-8 rounded-2xl shadow-2xl hover:border-destructive/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-all duration-500">
        <div className="h-14 w-14 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive mx-auto shadow-inner animate-pulse">
          <AlertTriangle className="h-6 w-6" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-black bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Orbit Coordinates Lost</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The page you are trying to scan is outside KLH University coordinates or has been migrated to a secure database.
          </p>
        </div>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-300 active:scale-[0.97] cursor-pointer shadow-md"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <Suspense fallback={<RouteSuspenseFallback />}>
      <Routes>
        {/* Standalone independent routes bypassing main navigation sidebar/layout */}
        <Route path="/login" element={<Login />} />
        <Route 
          path="/kiosk" 
          element={
            <ProtectedRoute>
              <Kiosk />
            </ProtectedRoute>
          } 
        />
        
        {/* Wrapped application routes inside MainLayout structure */}
        <Route 
          path="/*" 
          element={
            <MainLayout>
              <Suspense fallback={<RouteSuspenseFallback />}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/events" 
                    element={
                      <ProtectedRoute>
                        <Events />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </MainLayout>
          }
        />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <SovereignErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </SovereignErrorBoundary>
  );
}

export default App;
