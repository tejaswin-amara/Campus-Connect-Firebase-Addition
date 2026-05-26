import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SovereignErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sovereign Error Boundary caught an exception:', error, errorInfo);
    
    // Auto-reload on chunk load failures to immediately recover the active student session
    const errorText = (error.message || '') + (error.stack || '');
    const isChunkLoadFail = 
      errorText.includes('Failed to fetch dynamically imported module') ||
      errorText.includes('ChunkLoadError') ||
      errorText.includes('Loading chunk');

    if (isChunkLoadFail) {
      console.warn('Dynamic chunk load failure detected. Auto-reloading client to sync latest manifest...');
      const lastReload = sessionStorage.getItem('cc_last_chunk_reload');
      const now = Date.now();
      
      // Throttle reloads to at most once per 15 seconds to prevent infinite crash loops
      if (!lastReload || now - parseInt(lastReload) > 15000) {
        sessionStorage.setItem('cc_last_chunk_reload', now.toString());
        window.location.reload();
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F0F13] text-foreground p-6 select-none font-sans">
          {/* Futuristic ambient neon background glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[350px] w-[350px] rounded-full bg-red-500/10 blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 max-w-md w-full glass border-red-500/30 p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center">
            {/* Holographic header accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 rounded-t-2xl" />

            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-5 animate-bounce">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h3 className="text-xl font-black tracking-tight text-red-200 uppercase">System Exception Guarded</h3>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              An unhandled rendering exception occurred. The Sovereign Apex Engine has successfully intercepted the crash to prevent complete client failure.
            </p>

            <div className="w-full mt-4 p-3 rounded-lg bg-black/40 border border-white/5 text-left overflow-x-auto max-h-[120px] scrollbar-thin">
              <p className="text-[10px] font-mono text-red-300 leading-tight select-text">
                {this.state.error?.stack || this.state.error?.message || 'Unknown render context crash.'}
              </p>
            </div>

            <Button
              onClick={this.handleReset}
              variant="outline"
              className="w-full mt-6 border-red-500/25 text-red-400 hover:bg-red-500/10 active:scale-[0.97] transition-all duration-200"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin-slow" />
              Reset & Flush Context
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
