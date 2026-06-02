import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Bell, Search, Info, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Polished interactive states
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'info',
      icon: Info,
      title: 'Environment Active',
      text: 'Cloud Firestore initialized and production rules compiled successfully 🌐',
      time: 'Just now',
      unread: true
    },
    {
      id: 2,
      type: 'success',
      icon: Sparkles,
      title: 'Multiplier Unlocked',
      text: ' Streak Multiplier: Unlocked 2x bonus points on Event card interest 🔥',
      time: '12m ago',
      unread: true
    },
    {
      id: 3,
      type: 'primary',
      icon: Bell,
      title: 'Neural Forecast Alert',
      text: 'AI Forecast: Technology seminar capacity predicted high. Reserve seats soon! 🚀',
      time: '2h ago',
      unread: false
    },
    {
      id: 4,
      type: 'warning',
      icon: AlertTriangle,
      title: 'Schedule warning',
      text: 'Temporal clash detected on overlapping registered academic programs 📅',
      time: '1d ago',
      unread: false
    }
  ]);

  const [searchParams, setSearchParams] = useSearchParams();
  const searchVal = searchParams.get('q') || '';

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  const handleToggleNotifications = () => {
    const nextState = !isNotificationsOpen;
    setIsNotificationsOpen(nextState);
    if (nextState) {
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationsOpen]);

  return (
    <div className="min-h-screen bg-background flex flex-col relative select-none">
      {/* Top Floating Glow Element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-44 bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl pointer-events-none z-0" />

      {/* Modern Floating Header Panel */}
      <header className="sticky top-4 z-[100] w-full max-w-7xl mx-auto px-4 md:px-8 pointer-events-none">
        <div className="w-full rounded-2xl glass border-border/40 px-4 md:px-6 py-3 flex items-center justify-between pointer-events-auto shadow-2xl transition-all duration-300 relative z-[100]">
          
          {/* Logo & Navigation */}
          <div className="flex items-center gap-5">
            <NavLink to="/" className="flex items-center space-x-2.5 group mr-2">
              <div className="relative h-9 w-9 flex items-center justify-center bg-primary/10 rounded-xl border border-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:border-primary/40 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                <img 
                  src="/logo_icon.png" 
                  alt="Campus Connect Icon" 
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="font-display font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-primary bg-clip-text text-transparent group-hover:brightness-110 transition-all duration-300">
                Campus Connect
              </span>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <NavLink 
                to="/dashboard"
                className={({ isActive }) => cn(
                  "relative px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-lg hover:bg-white/5", 
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {({ isActive }) => (
                  <>
                    <span>Dashboard</span>
                    {isActive && (
                      <span className="absolute bottom-1.5 left-4 right-4 h-0.5 rounded-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                    )}
                  </>
                )}
              </NavLink>
              <NavLink 
                to="/events"
                className={({ isActive }) => cn(
                  "relative px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-lg hover:bg-white/5", 
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {({ isActive }) => (
                  <>
                    <span>Events Hub</span>
                    {isActive && (
                      <span className="absolute bottom-1.5 left-4 right-4 h-0.5 rounded-full bg-primary shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
                    )}
                  </>
                )}
              </NavLink>
            </nav>
          </div>

          {/* Desktop Search bar & User Profile */}
          <div className="flex items-center gap-4">
            
            {/* Elegant Header Search Box */}
            {user && (
              <div className="relative hidden lg:block w-52 pointer-events-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  value={searchVal}
                  onChange={handleSearchChange}
                  aria-label="Search events"
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border/40 bg-background/25 text-xs placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:shadow-[0_0_15px_-3px_rgba(168,85,247,0.25)] transition-all duration-300"
                />
              </div>
            )}

            {user ? (
              <div ref={dropdownRef} className="flex items-center gap-3 relative">
                
                {/* Notification Bell */}
                <button 
                  onClick={handleToggleNotifications}
                  aria-label="Toggle notifications"
                  aria-expanded={isNotificationsOpen}
                  className={cn(
                    "relative p-2 rounded-xl bg-white/5 border text-muted-foreground hover:text-foreground hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all duration-300 cursor-pointer",
                    isNotificationsOpen ? "border-primary/50 bg-primary/10 text-primary" : "border-border/40 hover:border-primary/30"
                  )}
                >
                  <Bell className="h-4.5 w-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)] border border-background" />
                  )}
                </button>

                {/* Floating Notifications Dropdown Drawer */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 top-12 w-80 rounded-2xl bg-[#0F0F13]/95 backdrop-blur-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.8)] p-4 animate-slide-down text-left pointer-events-auto z-[100]">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-primary/20 text-primary border border-primary/30 rounded-md">
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={handleMarkAllRead}
                        aria-label="Mark all notifications as read"
                        className="text-[9px] font-bold uppercase tracking-wider text-primary hover:brightness-110 cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {notifications.map(n => {
                        const IconComponent = n.icon;
                        return (
                          <div 
                            key={n.id}
                            className={cn(
                              "flex gap-2.5 p-2 rounded-xl border transition-all duration-300",
                              n.unread 
                                ? "bg-primary/10 border-primary/20" 
                                : "bg-black/40 border-white/5 opacity-75"
                            )}
                          >
                            <div className={cn(
                              "p-1.5 rounded-lg border shrink-0 mt-0.5",
                              n.type === 'info' && "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
                              n.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                              n.type === 'primary' && "bg-primary/15 border-primary/20 text-primary",
                              n.type === 'warning' && "bg-amber-500/10 border-amber-500/20 text-amber-400"
                            )}>
                              <IconComponent className="h-3.5 w-3.5" />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-foreground leading-tight flex items-center gap-1">
                                {n.title}
                                {n.unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                              </h4>
                              <p className="text-[10px] text-muted-foreground leading-normal">{n.text}</p>
                              <span className="text-[8px] text-muted-foreground/60 font-semibold block">{n.time}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Vertical Separator */}
                <div className="h-6 w-px bg-border/40 hidden md:block" />

                {/* Profile Pill */}
                <div className="flex items-center gap-3.5 bg-white/5 border border-border/40 px-3.5 py-1.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    {user.photoURL ? (
                      <div className="relative w-8 h-8 rounded-full border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        <img 
                          src={user.photoURL} 
                          alt={user.username} 
                          width={32}
                          height={32}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover select-none pointer-events-none"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="hidden absolute inset-0 bg-primary/20 items-center justify-center text-primary font-black uppercase tracking-wider text-[10px]">
                          {user.username.slice(0, 2)}
                        </div>
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shrink-0 font-black uppercase tracking-wider text-[10px]">
                        {user.username.slice(0, 2)}
                      </div>
                    )}
                    <span className="text-xs font-bold text-foreground/95 hidden md:block uppercase tracking-wider">{user.username}</span>
                  </div>
                  
                  <button 
                    onClick={handleLogout} 
                    aria-label="Sign out"
                    className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 border border-border/40 transition-all duration-300 cursor-pointer" 
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <NavLink 
                to="/login" 
                className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-[0.98] cursor-pointer"
              >
                Sign In
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 md:px-8 py-6 relative z-10">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </main>

      {/* Premium Sci-Fi Footer */}
      <footer className="w-full border-t border-border/40 bg-background/50 backdrop-blur-md py-6 relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Campus Connect</span>
            <span className="h-3 w-px bg-border/40 hidden md:block" />
            <p className="text-xs text-muted-foreground font-semibold">
              Built for university event engagement & real-time sync.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Made by</span>
              <a 
                href="https://www.linkedin.com/in/tejaswin-amara" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1 font-bold text-foreground/80 hover:text-primary transition-all duration-300 hover:scale-105"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Tejaswin Amara
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
