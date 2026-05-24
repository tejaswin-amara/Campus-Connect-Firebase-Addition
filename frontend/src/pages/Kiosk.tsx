import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle, AlertOctagon, RefreshCw, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { Link } from 'react-router-dom';

/**
 * Locked-down standalone route specifically designed for front-facing iPad self-serve booths.
 * Features a circular pulse scanner rings, continuous hardware camera loop sweeps, and audio success arpeggios.
 */
export default function Kiosk() {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  const qrRegionId = 'kiosk-reader-region';
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Web Audio API Programmatic Wave Synthesizer Chimes
  const playSoundChime = (type: 'success' | 'error') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140.00, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {
      console.warn('Audio gesture block:', e);
    }
  };

  // Passive Check-In Atomic Resolution Transaction
  const processCheckIn = async (qrData: string) => {
    try {
      setScanStatus('scanning');
      const payload = JSON.parse(qrData);
      const { userId, eventId } = payload;

      if (!userId || !eventId) {
        throw new Error('INVALID_TICKET');
      }

      const result = await runTransaction(db, async (transaction) => {
        const regId = `${userId}_${eventId}`;
        const regRef = doc(db, 'registrations', regId);
        const regSnap = await transaction.get(regRef);

        if (!regSnap.exists()) {
          throw new Error('TICKET_NOT_FOUND');
        }

        const regData = regSnap.data();
        if (regData.status === 'ATTENDED') {
          throw new Error('DUPLICATE_TICKET');
        }

        const userRef = doc(db, 'users', userId);
        const userSnap = await transaction.get(userRef);
        const username = userSnap.exists() ? userSnap.data().username : 'Student';

        const eventRef = doc(db, 'events', eventId.toString());
        const eventSnap = await transaction.get(eventRef);
        const eventTitle = eventSnap.exists() ? eventSnap.data().title : 'Event';

        transaction.update(regRef, {
          status: 'ATTENDED',
          attendedAt: new Date().toISOString()
        });

        return { username, eventTitle };
      });

      playSoundChime('success');
      if ('vibrate' in navigator) {
        navigator.vibrate(80);
      }

      setScanStatus('success');
      setFeedbackMsg(`Welcome, ${result.username}! Check-In Verified for ${result.eventTitle}`);

    } catch (err: any) {
      playSoundChime('error');
      if ('vibrate' in navigator) {
        navigator.vibrate([150, 80, 150]);
      }

      setScanStatus('error');
      if (err.message === 'DUPLICATE_TICKET') {
        setFeedbackMsg('Warning: Ticket Already Scanned');
      } else if (err.message === 'INVALID_TICKET' || err.message === 'TICKET_NOT_FOUND') {
        setFeedbackMsg('Access Denied: Invalid Student Pass');
      } else {
        setFeedbackMsg('System Resolution Failed');
      }
    }
  };

  useEffect(() => {
    const startScanner = async () => {
      try {
        const qrScanner = new Html5Qrcode(qrRegionId);
        html5QrcodeRef.current = qrScanner;
        setCameraPermission(true);
        setScanStatus('scanning');

        await qrScanner.start(
          { facingMode: 'user' }, // Target front-facing iPad camera by default
          {
            fps: 15,
            qrbox: { width: 260, height: 260 }
          },
          (qrCodeMessage) => {
            if (html5QrcodeRef.current && qrCodeMessage) {
              qrScanner.pause();
              processCheckIn(qrCodeMessage).then(() => {
                // Resume check-in loops autonomously after 3 seconds
                setTimeout(() => {
                  try {
                    setScanStatus('scanning');
                    setFeedbackMsg('');
                    qrScanner.resume();
                  } catch (e) {}
                }, 3000);
              });
            }
          },
          () => {}
        );
      } catch (err) {
        console.error('Kiosk front camera permission error:', err);
        setCameraPermission(false);
        setScanStatus('error');
        setFeedbackMsg('No front-facing iPad camera acquired.');
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (html5QrcodeRef.current) {
        try {
          html5QrcodeRef.current.stop().catch(e => console.warn('Kiosk stop warning:', e));
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-[300] flex flex-col items-center justify-center p-6 transition-colors duration-500 select-none ${
      scanStatus === 'success' ? 'bg-emerald-950/95' :
      scanStatus === 'error' ? 'bg-red-950/95' :
      'bg-background'
    }`}>
      {/* Dynamic Background Pulsing Neon Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

      {/* Standalone Kiosk Card Frame */}
      <div className="relative w-full max-w-2xl rounded-3xl glass border-primary/20 p-8 flex flex-col items-center text-center shadow-3xl bg-[#0F0F13]/60 backdrop-blur-md">
        
        {/* Glow indicator headers */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl transition-colors duration-500 ${
          scanStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]' :
          scanStatus === 'error' ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]' :
          'bg-gradient-to-r from-primary via-purple-500 to-cyan-500'
        }`} />

        {/* Exit Kiosk Standout Link */}
        <Link 
          to="/dashboard" 
          className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
        >
          <X className="h-4 w-4" />
          Exit Kiosk
        </Link>

        {/* Titles */}
        <div className="mb-6 mt-4">
          <span className="px-3 py-1 text-[10px] font-extrabold bg-primary/20 text-primary border border-primary/30 rounded-md tracking-wider uppercase inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.15)] animate-pulse-slow">
            <Camera className="h-3.5 w-3.5" />
            Unmanned Check-In Station
          </span>
          <h2 className="text-3xl font-black tracking-tight text-foreground mt-3 uppercase tracking-wide">
            Self-Serve Check-In
          </h2>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            KLH Bachupally Campus • Place Event Pass QR code facing the screen
          </p>
        </div>

        {/* Pulsing circle scanner frames */}
        <div className={`relative w-[300px] h-[300px] rounded-full border overflow-hidden flex items-center justify-center mb-8 transition-all duration-500 ${
          scanStatus === 'success' ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)] scale-105' :
          scanStatus === 'error' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] scale-105' :
          'border-white/10 hover:border-primary/30 shadow-[0_0_30px_rgba(168,85,247,0.08)]'
        }`}>
          {/* Reader Viewport */}
          <div id={qrRegionId} className="w-full h-full object-cover rounded-full" />

          {/* Success Flash Panels */}
          {scanStatus === 'success' && (
            <div className="absolute inset-0 bg-emerald-900/90 flex flex-col items-center justify-center p-6 text-emerald-300 animate-in zoom-in-95 duration-300">
              <CheckCircle className="h-16 w-16 text-emerald-400 mb-3 animate-bounce" />
              <span className="text-sm font-extrabold uppercase tracking-widest text-emerald-200">Access Granted</span>
            </div>
          )}

          {/* Error Flash Panels */}
          {scanStatus === 'error' && (
            <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center p-6 text-red-300 animate-in zoom-in-95 duration-300">
              <AlertOctagon className="h-16 w-16 text-red-400 mb-3 animate-bounce" />
              <span className="text-sm font-extrabold uppercase tracking-widest text-red-200">Check-In Denied</span>
            </div>
          )}

          {/* Holographic Laser Scanning Line */}
          {scanStatus === 'scanning' && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-primary to-cyan-400 shadow-[0_0_15px_rgba(168,85,247,0.9)] top-0 animate-kiosk-scan pointer-events-none" />
          )}
        </div>

        {/* Dynamic status feedback banner */}
        <div className={`w-full min-h-[60px] flex items-center justify-center rounded-2xl p-4 transition-all duration-300 ${
          scanStatus === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.08)] animate-pulse' :
          scanStatus === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.08)] animate-pulse' :
          'bg-white/5 border border-white/5 text-muted-foreground'
        }`}>
          {scanStatus === 'scanning' && (
            <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-foreground animate-pulse">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              Continuous Scanner Active... Ready For Next Pass
            </p>
          )}
          {scanStatus === 'idle' && (
            <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-primary" />
              {cameraPermission === false 
                ? 'Camera access denied. Please enable hardware permissions.' 
                : 'Initializing Front Facing iPad Camera...'}
            </p>
          )}
          {(scanStatus === 'success' || scanStatus === 'error') && (
            <p className="text-sm font-black uppercase tracking-wide leading-relaxed">
              {feedbackMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
