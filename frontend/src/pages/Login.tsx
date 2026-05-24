import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardDescription } from '../components/ui/Card';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Map simple username e.g. "admin" -> "admin@campusconnect.edu"
    const email = username.includes('@') ? username : `${username.trim()}@campusconnect.edu`;

    try {
      // Try standard sign-in
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      // If user doesn't exist yet, auto-create for hassle-free university onboarding
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          navigate('/dashboard');
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            setError('Invalid credentials. Check your password.');
          } else {
            setError(createErr.message || 'Authentication failed.');
          }
        }
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    try {
      if (loginWithGoogle) {
        await loginWithGoogle();
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Immersive Floating Glowing Orbs */}
      <div className="absolute top-1/4 left-1/10 w-80 h-80 bg-primary/15 rounded-full blur-[100px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-float pointer-events-none" />

      <Card className="w-full max-w-md relative z-10 glass border-primary/20 shadow-2xl rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-500">
        {/* Glow Header Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-purple-500 to-cyan-500 shadow-[0_4px_20px_rgba(168,85,247,0.4)]" />

        <CardHeader className="space-y-3 text-center pb-5 pt-8 flex flex-col items-center">
          <div className="w-56 h-auto py-1 flex items-center justify-center transition-all duration-500 hover:scale-105 filter drop-shadow-[0_0_20px_rgba(168,85,247,0.35)]">
            <img 
              src="/logo_full.png" 
              alt="Campus Connect Logo" 
              width={224}
              height={56}
              className="w-full h-auto"
            />
          </div>
          <CardDescription className="text-muted-foreground font-semibold text-sm">
            Sign in to access events and dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8 pt-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 text-xs font-bold text-destructive-foreground bg-destructive/90 rounded-xl border border-destructive/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/80" htmlFor="username">
                Username or Email
              </label>
              <input
                id="username"
                className="cyber-input"
                placeholder="e.g. admin or student"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/80" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="cyber-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground hover:brightness-110 hover:shadow-[0_0_22px_rgba(168,85,247,0.45)] h-11 w-full mt-3 cursor-pointer shadow-md"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Sci-Fi Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/40" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-background/80 px-3 py-0.5 text-muted-foreground backdrop-blur-md rounded-full border border-border/40">
                Or Continue With
              </span>
            </div>
          </div>

          {/* Premium Google OAuth Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold border border-border/40 bg-white/5 hover:bg-white/10 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 h-11 w-full transition-all duration-300 cursor-pointer shadow-sm glow-hover"
          >
            <svg className="h-4.5 w-4.5 mr-1" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.6h3.29c1.92,-1.78 3.02,-4.4 3.02,-7.4C21.65,11.83 21.54,11.45 21.35,11.1z" fill="#4285F4" />
                <path d="M12,20.8c2.38,0 4.37,-0.8 5.83,-2.1l-3.29,-2.6c-0.91,0.61 -2.08,0.98 -3.54,0.98 -2.72,0 -5.02,-1.84 -5.84,-4.3H1.77v2.7C3.25,18.33 7.37,20.8 12,20.8z" fill="#34A853" />
                <path d="M6.16,12.78c-0.21,-0.63 -0.33,-1.3 -0.33,-2c0,-0.7 0.12,-1.37 0.33,-2V6.08H1.77C1.1,7.4 0.72,8.9 0.72,10.5c0,1.6 0.38,3.1 1.05,4.42l3.5,-2.7C5.48,15.15 5.84,13.98 6.16,12.78z" fill="#FBBC05" />
                <path d="M12,5.2c1.3,0 2.46,0.45 3.38,1.33l2.54,-2.54C16.37,2.51 14.38,1.7 12,1.7c-4.63,0 -8.75,2.47 -10.23,5.38l3.5,2.7C6.09,6.54 8.39,5.2 12,5.2z" fill="#EA4335" />
              </g>
            </svg>
            Google OAuth
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
