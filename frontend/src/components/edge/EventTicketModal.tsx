import { memo } from 'react';
import { X, Sparkles, Calendar } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '../ui/Button';
import { generateICS } from '../../lib/generateICS';
import type { EventData } from '../ui/EventCard';

export interface UserData {
  id: string;
  username: string;
  email?: string;
  role: 'STUDENT' | 'ADMIN';
  photoURL?: string | null;
  fcmToken?: string;
}

interface EventTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData;
  user: UserData;
  registrationId: string;
  peerAttendees?: Array<{ userId: string; username: string }>;
}

// ----------------------------------------------------------------------
// 1. COMPOUND SUB-COMPONENT: Header
// ----------------------------------------------------------------------
export const TicketHeader = memo(function TicketHeader({ 
  event 
}: { 
  event: EventData;
}) {
  return (
    <div className="mb-5 mt-2 w-full text-center px-4">
      <span className="px-2.5 py-0.5 text-[9px] font-extrabold bg-primary/10 text-primary border border-primary/20 rounded-md tracking-wider uppercase inline-flex items-center gap-1">
        <Sparkles className="h-2.5 w-2.5" />
        Verified Student Pass
      </span>
      <h3 className="text-md font-black tracking-tighter mt-3 text-foreground/90 uppercase line-clamp-1 max-w-[280px] mx-auto">
        {event.title}
      </h3>
      <p className="text-[9px] text-muted-foreground uppercase font-extrabold tracking-widest mt-1">
        {event.venue}
      </p>
    </div>
  );
});

// ----------------------------------------------------------------------
// 2. COMPOUND SUB-COMPONENT: QRPass
// ----------------------------------------------------------------------
export const TicketQRPass = memo(function TicketQRPass({ 
  payload 
}: { 
  payload: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 shrink-0 w-full mb-6">
      <div className="relative p-4 rounded-xl bg-black border border-white/5 shadow-inner-glow flex items-center justify-center shrink-0">
        {/* Subtle background glow effect locked in Vercel styling */}
        <div className="absolute inset-0 bg-primary/5 blur-xl rounded-xl pointer-events-none" />
        <QRCodeSVG 
          value={payload}
          size={160}
          bgColor={"transparent"}
          fgColor={"#ffffff"}
          level={"H"}
          includeMargin={true}
          className="relative z-10"
        />
      </div>
      <div className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-md tracking-widest uppercase leading-tight shrink-0">
        You're In! Pass active. 🎟️
      </div>
    </div>
  );
});

// ----------------------------------------------------------------------
// 3. COMPOUND SUB-COMPONENT: Meta
// ----------------------------------------------------------------------
export const TicketMeta = memo(function TicketMeta({ 
  event,
  user,
  registrationId,
  peerAttendees = []
}: { 
  event: EventData;
  user: UserData;
  registrationId: string;
  peerAttendees?: Array<{ userId: string; username: string }>;
}) {
  return (
    <div className="w-full pt-4 px-4 text-center">
      <div className="grid grid-cols-2 gap-4 text-left mb-4 bg-black/40 border border-white/5 rounded-xl p-3.5 shadow-inner-glow">
        <div>
          <p className="overline-premium text-[8px] tracking-widest text-muted-foreground/60">Card Holder</p>
          <p className="text-xs font-black text-foreground/90 uppercase truncate">{user.username}</p>
        </div>
        <div>
          <p className="overline-premium text-[8px] tracking-widest text-muted-foreground/60">Date of Event</p>
          <p className="text-xs font-black text-foreground/90 mono-premium">
            {new Date(event.dateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
      
      <p className="overline-premium text-[8px] tracking-widest text-muted-foreground/60 mt-1">Ticket Reference ID</p>
      <p className="text-[10px] text-primary/80 font-bold truncate max-w-[280px] mx-auto mono-premium">{registrationId || `REG-${user.id.slice(0, 8)}`}</p>

      {peerAttendees && peerAttendees.length > 0 && (
        <div className="flex flex-col items-center justify-center gap-1.5 mt-4 pt-3.5 border-t border-white/5 animate-in fade-in duration-300">
          <div className="flex -space-x-1.5 overflow-hidden">
            {peerAttendees.slice(0, 3).map((peer) => (
              <div 
                key={peer.userId} 
                className="inline-flex h-5.5 w-5.5 rounded-full ring-2 ring-[#030303] bg-gradient-to-br from-primary to-cyan-500 border border-white/10 flex items-center justify-center text-[8px] font-black text-white hover:scale-110 transition-transform duration-300 cursor-help"
                title={peer.username}
              >
                {peer.username.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground font-bold tracking-tight">
            {peerAttendees.length === 1 
              ? `${peerAttendees[0].username} is also attending!`
              : `${peerAttendees[0].username} & ${peerAttendees.length - 1} peers are attending`}
          </span>
        </div>
      )}
    </div>
  );
});

// ----------------------------------------------------------------------
// 4. COMPOUND SUB-COMPONENT: Actions
// ----------------------------------------------------------------------
export const TicketActions = memo(function TicketActions({ 
  onClose,
  event 
}: { 
  onClose: () => void;
  event: EventData;
}) {
  return (
    <div className="flex gap-2.5 w-full mt-5 px-4 z-20">
      <Button 
        variant="outline" 
        className="flex-1 text-xs font-bold border border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground tactile-trigger cursor-pointer h-10" 
        onClick={onClose}
      >
        Dismiss
      </Button>
      <Button 
        variant="primary" 
        className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 shadow-md border-cyan-500/20 text-white text-xs font-bold tactile-trigger cursor-pointer h-10" 
        onClick={() => generateICS(event)}
      >
        <Calendar className="h-4 w-4 shrink-0" />
        Add Calendar
      </Button>
    </div>
  );
});

// ----------------------------------------------------------------------
// 5. MAIN BACKWARD-COMPATIBLE MODAL EXPORT
// ----------------------------------------------------------------------
export function EventTicketModal({
  isOpen,
  onClose,
  event,
  user,
  registrationId,
  peerAttendees = []
}: EventTicketModalProps) {
  if (!isOpen) return null;

  const qrPayload = JSON.stringify({
    userId: user.id,
    eventId: event.id,
    registrationId: registrationId
  });

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Elite Tactile Perforated Ticket Card */}
      <div className="relative w-full max-w-[340px] bg-[#050505] border border-white/5 shadow-2xl rounded-2xl flex flex-col items-center justify-center py-6 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Glow Accent Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-cyan-500 rounded-t-2xl shadow-inner-glow" />
        
        {/* Close trigger */}
        <button 
          onClick={onClose} 
          aria-label="Close ticket pass modal"
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer tactile-trigger"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Compound Layout Elements */}
        <TicketHeader event={event} />
        
        <TicketQRPass payload={qrPayload} />

        {/* Tactile coupon perforations with cutouts */}
        <div className="relative w-full flex items-center justify-center py-1">
          {/* Circular Perforation Cutouts */}
          <div className="absolute -left-2.5 w-5 h-5 rounded-full bg-[#030303] border-r border-white/5 z-20 shadow-inner" />
          <div className="absolute -right-2.5 w-5 h-5 rounded-full bg-[#030303] border-l border-white/5 z-20 shadow-inner" />
          {/* Perforation line */}
          <div className="w-[85%] border-t border-dashed border-white/10" />
        </div>

        <TicketMeta 
          event={event} 
          user={user} 
          registrationId={registrationId} 
          peerAttendees={peerAttendees} 
        />

        <TicketActions onClose={onClose} event={event} />
      </div>
    </div>
  );
}

// Attach sub-components for the compound component pattern
Object.assign(EventTicketModal, {
  Header: TicketHeader,
  QRPass: TicketQRPass,
  Meta: TicketMeta,
  Actions: TicketActions
});
