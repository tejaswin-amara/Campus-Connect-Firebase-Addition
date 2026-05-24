import { useEffect, useRef, useState } from 'react';
import { X, Camera, CheckCircle, AlertOctagon, RefreshCw } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { db } from '../../lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';
import { Button } from '../ui/Button';

interface TicketScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCheckIn?: (studentName: string, eventTitle: string) => void;
}

export function TicketScannerModal({
  isOpen,
  onClose,
  onSuccessCheckIn
}: TicketScannerModalProps) {
  if (!isOpen) return null;

  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  
  const qrRegionId = 'reader-region';
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Web Audio API Synthesizer Chimes
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
        // High-fidelity success beep (Arpeggio chime)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        // Harsh low-frequency error buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140.00, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      }
    } catch (e) {
      console.warn('Audio Synthesizer not supported or blocked by user gesture:', e);
    }
  };

  // Physical check-in transaction resolver
  const processCheckIn = async (qrData: string) => {
    try {
      setScanStatus('scanning');
      
      let payload: any;
      try {
        payload = JSON.parse(qrData);
      } catch (jsonErr) {
        throw new Error('INVALID_TICKET');
      }

      if (typeof payload !== 'object' || payload === null) {
        throw new Error('INVALID_TICKET');
      }

      const { userId, eventId, registrationId } = payload;
      const eventIdStr = eventId?.toString();

      if (typeof userId !== 'string' || typeof eventIdStr !== 'string' || typeof registrationId !== 'string') {
        throw new Error('INVALID_TICKET');
      }

      // Enforce strict path-safe alphanumeric regex to prevent path traversal/injection in doc refs
      const pathSafeRegex = /^[a-zA-Z0-9_:-]+$/;
      if (!pathSafeRegex.test(userId) || !pathSafeRegex.test(eventIdStr) || !pathSafeRegex.test(registrationId)) {
        throw new Error('INVALID_TICKET');
      }

      // Mitigate buffer / large document injection attacks
      if (userId.length > 64 || eventIdStr.length > 64 || registrationId.length > 128) {
        throw new Error('INVALID_TICKET');
      }

      const result = await runTransaction(db, async (transaction) => {
        // 1. Fetch registration document atomically
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

        // 2. Fetch user profile to extract displayName inside transaction
        const userRef = doc(db, 'users', userId);
        const userSnap = await transaction.get(userRef);
        const username = userSnap.exists() ? userSnap.data().username : 'Student';

        // 3. Fetch event profile to extract title inside transaction
        const eventRef = doc(db, 'events', eventId.toString());
        const eventSnap = await transaction.get(eventRef);
        const eventTitle = eventSnap.exists() ? eventSnap.data().title : 'Event';

        // 4. Update atomic registration status to ATTENDED
        transaction.update(regRef, {
          status: 'ATTENDED',
          attendedAt: new Date().toISOString()
        });

        return { username, eventTitle };
      });

      // Haptic & Chime success feedback
      playSoundChime('success');
      if ('vibrate' in navigator) {
        navigator.vibrate(80); // Short tap
      }

      setScanStatus('success');
      setFeedbackMsg(`Access Granted: ${result.username}`);
      
      if (onSuccessCheckIn) {
        onSuccessCheckIn(result.username, result.eventTitle);
      }

      // Reset feedback to scanning mode after 3 seconds
      setTimeout(() => {
        setScanStatus('scanning');
        setFeedbackMsg('');
      }, 3000);

    } catch (err: any) {
      // Haptic and Audio Error feedback
      playSoundChime('error');
      if ('vibrate' in navigator) {
        navigator.vibrate([150, 80, 150]); // Dual intense vibrations
      }

      setScanStatus('error');
      if (err.message === 'DUPLICATE_TICKET') {
        setFeedbackMsg('Warning: Ticket Already Scanned');
      } else if (err.message === 'INVALID_TICKET' || err.message === 'TICKET_NOT_FOUND') {
        setFeedbackMsg('Access Denied: Invalid Ticket Pass');
      } else {
        console.error('Check-in error:', err);
        setFeedbackMsg('System Error processing Check-In');
      }

      // Reset feedback to scanning mode after 3.5 seconds
      setTimeout(() => {
        setScanStatus('scanning');
        setFeedbackMsg('');
      }, 3500);
    }
  };

  useEffect(() => {
    // Initialise Html5Qrcode Scanner on Mount
    const startScanner = async () => {
      try {
        const qrScanner = new Html5Qrcode(qrRegionId);
        html5QrcodeRef.current = qrScanner;

        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          setCameraPermission(true);
          setScanStatus('scanning');
          
          // Target back-facing camera if available for physical mobile check-in
          const targetCameraId = cameras.find(c => c.label.toLowerCase().includes('back'))?.id || cameras[0].id;
          
          await qrScanner.start(
            targetCameraId,
            {
              fps: 10,
              qrbox: { width: 220, height: 220 }
            },
            (qrCodeMessage) => {
              // Only process scan if scanner is actively in scanning status
              if (html5QrcodeRef.current && qrCodeMessage) {
                qrScanner.pause();
                processCheckIn(qrCodeMessage).then(() => {
                  // Resume scanning loop only after processing terminates
                  setTimeout(() => {
                    try {
                      qrScanner.resume();
                    } catch (e) {}
                  }, 3500);
                });
              }
            },
            () => {}
          );
        } else {
          setCameraPermission(false);
          setFeedbackMsg('No hardware camera found.');
        }
      } catch (err) {
        console.error('Camera Scanner start failed:', err);
        setCameraPermission(false);
        setFeedbackMsg('Failed to acquire camera permission.');
      }
    };

    // Micro-delay to ensure reader-region exists in DOM
    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      clearTimeout(timer);
      if (html5QrcodeRef.current) {
        try {
          html5QrcodeRef.current.stop().catch(e => console.warn('Scanner stop warning:', e));
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-2xl glass border-primary/30 shadow-2xl p-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
        
        {/* Success/Error flash rings */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl transition-colors duration-300 ${
          scanStatus === 'success' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' :
          scanStatus === 'error' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' :
          'bg-gradient-to-r from-primary via-purple-500 to-cyan-500'
        }`} />
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Scanner Title */}
        <div className="mb-4 mt-2">
          <span className="px-2.5 py-0.5 text-[9px] font-extrabold bg-primary/20 text-primary border border-primary/30 rounded-md tracking-wider uppercase inline-flex items-center gap-1.5">
            <Camera className="h-3 w-3" />
            Live Access Scanner
          </span>
          <h3 className="text-lg font-black tracking-tight mt-2 text-foreground">
            Check-In Scanner
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
            Position QR ticket pass in front of camera
          </p>
        </div>

        {/* Camera Scanner Region */}
        <div className={`relative w-[260px] h-[260px] rounded-2xl border bg-background/30 overflow-hidden flex items-center justify-center mb-5 transition-all duration-300 ${
          scanStatus === 'success' ? 'border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.25)]' :
          scanStatus === 'error' ? 'border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.25)]' :
          'border-white/10'
        }`}>
          
          <div id={qrRegionId} className="w-full h-full object-cover" />
          
          {/* Laser Scanning Line */}
          {scanStatus === 'scanning' && (
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-cyan-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] animate-pulse top-1/2 -translate-y-1/2 pointer-events-none" />
          )}

          {/* Success Overlay Panel */}
          {scanStatus === 'success' && (
            <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-emerald-300 animate-in fade-in duration-200">
              <CheckCircle className="h-12 w-12 text-emerald-400 mb-2 animate-bounce" />
              <p className="font-extrabold text-sm uppercase tracking-wider">{feedbackMsg}</p>
            </div>
          )}

          {/* Error Overlay Panel */}
          {scanStatus === 'error' && (
            <div className="absolute inset-0 bg-red-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-red-300 animate-in fade-in duration-200">
              <AlertOctagon className="h-12 w-12 text-red-400 mb-2 animate-bounce" />
              <p className="font-extrabold text-sm uppercase tracking-wider">{feedbackMsg}</p>
            </div>
          )}
        </div>

        {/* Feedback description banner */}
        <div className="w-full border-t border-border/40 pt-4 mb-2 flex items-center justify-center min-h-[50px]">
          {scanStatus === 'scanning' && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
              Waiting for ticket pass scan...
            </p>
          )}
          {scanStatus === 'idle' && (
            <p className="text-xs text-muted-foreground">
              {cameraPermission === false 
                ? 'Camera access denied. Please enable hardware permissions.' 
                : 'Initializing hardware camera resources...'}
            </p>
          )}
          {(scanStatus === 'success' || scanStatus === 'error') && (
            <p className={`text-xs font-bold uppercase tracking-wider ${
              scanStatus === 'success' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {feedbackMsg}
            </p>
          )}
        </div>

        <Button variant="outline" className="w-full mt-4" onClick={onClose}>
          Deactivate Scanner
        </Button>
      </div>
    </div>
  );
}
