import { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * Premium glassmorphic PWA installation prompt toast.
 * Listens for system beforeinstallprompt triggers and guides users into standalone native shells.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function InstallToast() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent automatic browser banners
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Hide toast if app is already running standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-[160] glass border-primary/30 p-5 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.2)] animate-in slide-in-from-bottom-5 duration-300">
      <button 
        onClick={() => setIsVisible(false)} 
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex gap-4">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse">
          <Download className="h-5 w-5" />
        </div>

        <div>
          <span className="px-2 py-0.5 text-[8px] font-extrabold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded uppercase tracking-wider inline-flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            Install Native App
          </span>
          <h4 className="text-sm font-black text-foreground mt-1.5 uppercase tracking-wide">Install Campus Connect</h4>
          <p className="text-[11px] text-muted-foreground font-semibold leading-relaxed mt-0.5">
            Add to your home screen for zero-latency offline scheduling, secure haptics, and instant push updates.
          </p>

          <Button 
            variant="primary" 
            onClick={handleInstallClick} 
            className="mt-3.5 w-full bg-gradient-to-r from-primary to-purple-600 hover:brightness-110 shadow-lg text-white font-extrabold cursor-pointer transition-all duration-300"
          >
            Install App 📱
          </Button>
        </div>
      </div>
    </div>
  );
}
