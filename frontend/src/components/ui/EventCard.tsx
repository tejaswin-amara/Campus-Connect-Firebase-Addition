import { memo } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { cn } from '../../lib/utils';
import { Calendar, MapPin, Users, Edit3, Trash2, ArrowUpRight } from 'lucide-react';
import { PopularityBadge, ConflictDetector } from '../innovations/AcademicInnovations';
import { SOVEREIGN_STYLES } from '../../lib/styles';
import { downloadICSEvent } from '../../utils/calendar';

export interface EventData {
  id: string | number;
  title: string;
  description: string;
  dateTime: string;
  endDateTime?: string;
  venue: string;
  category: string;
  maxCapacity?: number;
  registeredCount?: number;
  waitlistCount?: number;
  imageUrl?: string;
  imageMimeType?: string;
  registrationLink?: string;
  responsesLink?: string;
  createdAt?: string;
  isPaid?: boolean;
  ticketPrice?: number;
}

export interface EventCardProps {
  event: EventData;
  className?: string;
  onRegister?: (id: string | number) => void;
  onViewPass?: (id: string | number) => void;
  onDownloadCertificate?: (id: string | number) => void;
  onEdit?: (event: EventData) => void;
  onDelete?: (id: string | number) => void;
  onViewAttendees?: (id: string | number) => void;
  isAdmin?: boolean;
  registeredCount?: number;
  isRegistered?: boolean;
  isConflicting?: boolean;
  isWaitlisted?: boolean;
  isAttended?: boolean;
  peerAttendees?: Array<{ userId: string; username: string }>;
  isOnCampus?: boolean;
}

// ----------------------------------------------------------------------
// 1. COMPOUND SUB-COMPONENT: Container
// ----------------------------------------------------------------------
export const EventCardContainer = memo(function EventCardContainer({ 
  children, 
  className,
  category
}: { 
  children: ReactNode; 
  className?: string;
  category: string;
}) {
  const getCategoryBorder = (catStr: string) => {
    const cat = catStr.toLowerCase();
    if (cat.includes('tech')) return "hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgb(59,130,246,0.03)]";
    if (cat.includes('cultur')) return "hover:border-pink-500/30 hover:shadow-[0_8px_30px_rgb(236,72,153,0.03)]";
    if (cat.includes('sport')) return "hover:border-orange-500/30 hover:shadow-[0_8px_30px_rgb(249,115,22,0.03)]";
    if (cat.includes('work')) return "hover:border-cyan-500/30 hover:shadow-[0_8px_30px_rgb(6,182,212,0.03)]";
    return "hover:border-emerald-500/30 hover:shadow-[0_8px_30px_rgb(16,185,129,0.03)]";
  };

  return (
    <Card 
      role="article" 
      aria-roledescription="event card"
      className={cn(
        "bg-card border-micro shadow-inner-glow overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300 rounded-xl group",
        getCategoryBorder(category),
        className
      )}
    >
      {children}
    </Card>
  );
});

// ----------------------------------------------------------------------
// 2. COMPOUND SUB-COMPONENT: Cover
// ----------------------------------------------------------------------
export const EventCardCover = memo(function EventCardCover({ 
  event,
  isUpcoming 
}: { 
  event: EventData;
  isUpcoming: boolean;
}) {
  const getCategoryStyles = (categoryStr: string) => {
    const cat = categoryStr.toLowerCase();
    if (cat.includes('tech')) return SOVEREIGN_STYLES.glowBlue;
    if (cat.includes('cultur')) return SOVEREIGN_STYLES.glowPink;
    if (cat.includes('sport')) return SOVEREIGN_STYLES.glowOrange;
    if (cat.includes('work')) return SOVEREIGN_STYLES.glowCyan;
    return SOVEREIGN_STYLES.glowEmerald;
  };

  return (
    <div className="relative h-44 w-full bg-black/40 overflow-hidden border-b border-white/5">
      {/* Dark gradient overlay for extreme Linear styling */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />

      <img 
        src={event.imageUrl || `/api/events/image/${event.id}`} 
        alt={event.title}
        width={400}
        height={225}
        loading="lazy"
        className="w-full h-full object-cover opacity-85 transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80';
        }}
      />

      {/* Badges Overlays */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 flex-wrap gap-2">
        <span className={cn(
          "px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded-md border border-white/5 bg-black/75 backdrop-blur-md shadow-sm shrink-0", 
          getCategoryStyles(event.category)
        )}>
          {event.category}
        </span>
        <div className="flex flex-wrap gap-1.5 items-center shrink-0">
          {event.isPaid && (
            <span className="px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)] backdrop-blur-md mono-premium animate-pulse-slow">
              ₹{event.ticketPrice}
            </span>
          )}
          {isUpcoming && (
            <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded-md bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(168,85,247,0.1)] backdrop-blur-md">
              Upcoming
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

// ----------------------------------------------------------------------
// 3. COMPOUND SUB-COMPONENT: Header
// ----------------------------------------------------------------------
export const EventCardHeader = memo(function EventCardHeader({ 
  title 
}: { 
  title: string;
}) {
  return (
    <CardHeader className="pb-1 pt-4 relative z-20 px-5 pr-28">
      <CardTitle className="line-clamp-2 text-lg font-bold heading-premium text-foreground/90 group-hover:text-primary leading-tight transition-colors duration-300">
        {title}
      </CardTitle>
    </CardHeader>
  );
});

// ----------------------------------------------------------------------
// 4. COMPOUND SUB-COMPONENT: Body
// ----------------------------------------------------------------------
export const EventCardBody = memo(function EventCardBody({ 
  event,
  registeredCount,
  isConflicting,
  peerAttendees
}: { 
  event: EventData;
  registeredCount: number;
  isConflicting: boolean;
  peerAttendees: Array<{ userId: string; username: string }>;
}) {
  const eventDate = new Date(event.dateTime);
  
  return (
    <CardContent className="flex-1 flex flex-col px-5 pb-2 pt-1">
      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed flex-grow font-semibold">
        {event.description}
      </p>

      {/* AI Capacity Forecast */}
      {event.maxCapacity !== undefined && event.maxCapacity > 0 && (
        <div className="mb-4">
          <PopularityBadge 
            capacity={event.maxCapacity} 
            registered={registeredCount} 
            category={event.category} 
            createdAt={(event as any).createdAt}
          />
        </div>
      )}
      
      {/* Event Details Grid */}
      <div className="space-y-2.5 mb-4 border-t border-white/5 pt-3.5" role="group" aria-label="Event details">
        <div className="flex items-center text-xs font-semibold text-muted-foreground">
          <div className="p-1 rounded-md bg-white/5 border border-white/5 text-primary/80 mr-2.5 shrink-0" aria-hidden="true">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <span className="mono-premium text-[11px] tracking-tight">
            <span className="sr-only">Date: </span>
            {eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="flex items-center text-xs font-semibold text-muted-foreground">
          <div className="p-1 rounded-md bg-white/5 border border-white/5 text-primary/80 mr-2.5 shrink-0" aria-hidden="true">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <span>
            <span className="sr-only">Location: </span>
            <span className="truncate">{event.venue}</span>
          </span>
        </div>

        {event.maxCapacity !== undefined && event.maxCapacity > 0 && (
          <div className="flex items-center text-xs font-semibold text-muted-foreground">
            <div className="p-1 rounded-md bg-white/5 border border-white/5 text-primary/80 mr-2.5 shrink-0" aria-hidden="true">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <span className="flex items-baseline gap-1 text-[11px]">
              <span className="sr-only">Capacity: </span>
              Seats: <strong className="text-foreground mono-premium">{registeredCount}</strong> <span className="text-muted-foreground/50">/</span> <span className="mono-premium text-muted-foreground/80">{event.maxCapacity}</span>
            </span>
          </div>
        )}
      </div>

      {/* Peer Attendees Overlap Grid */}
      {peerAttendees && peerAttendees.length > 0 && (
        <div className="flex items-center gap-2 mb-3.5 animate-in fade-in duration-300" role="group" aria-label="Squad attendees">
          <div className="flex -space-x-2 overflow-hidden" role="list">
            {peerAttendees.slice(0, 3).map((peer) => (
              <div 
                key={peer.userId} 
                role="listitem"
                aria-label={`Squad peer member ${peer.username}`}
                className={cn(
                  "inline-flex h-6.5 w-6.5 rounded-full ring-2 ring-card bg-gradient-to-br from-primary to-cyan-500 border border-white/10 flex items-center justify-center text-[9px] font-black text-white hover:scale-110 cursor-help transition-all duration-300"
                )}
                title={peer.username}
              >
                {peer.username.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground font-bold tracking-tight">
            {peerAttendees.length === 1 
              ? `${peerAttendees[0].username} is attending`
              : `${peerAttendees[0].username} & ${peerAttendees.length - 1} peers attending`}
          </span>
        </div>
      )}

      {/* Conflicts Indicator */}
      {isConflicting && (
        <div className="mb-3.5">
          <ConflictDetector isConflicting={isConflicting} />
        </div>
      )}
    </CardContent>
  );
});

// ----------------------------------------------------------------------
// 5. COMPOUND SUB-COMPONENT: Footer / Actions
// ----------------------------------------------------------------------
export const EventCardFooter = memo(function EventCardFooter({
  event,
  onRegister,
  onViewPass,
  onDownloadCertificate,
  onEdit,
  onDelete,
  onViewAttendees,
  isAdmin,
  registeredCount = 0,
  isRegistered = false,
  isWaitlisted = false,
  isAttended = false,
  isOnCampus = true
}: EventCardProps) {
  return (
    <div className="px-5 pb-5 pt-1.5 mt-auto flex flex-col z-20">
      {!isAdmin && (
        <div className="w-full">
          {isAttended && onDownloadCertificate ? (
            <button 
              onClick={() => onDownloadCertificate(event.id)}
              aria-label="Download attendance certificate"
              className={cn(
                "w-full h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-cyan-500/25 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.05)] transition-all duration-300 tactile-trigger cursor-pointer font-extrabold"
              )}
            >
              Certificate 🎓
            </button>
          ) : isWaitlisted ? (
            <button 
              disabled={true}
              aria-label="You are on the waitlist"
              className="w-full h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-wider border border-amber-500/25 bg-amber-500/5 text-amber-400 cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              Waitlisted ⏳
            </button>
          ) : isRegistered && onViewPass ? (
            <div className="flex gap-2.5 w-full animate-in fade-in duration-200">
              <button 
                disabled={!isOnCampus}
                onClick={() => isOnCampus && onViewPass(event.id)}
                aria-label={isOnCampus ? "View event pass" : "Pass locked: Must be on campus to view"}
                className={cn(
                  "flex-1 h-10 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all duration-300 cursor-pointer",
                  isOnCampus 
                    ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.05)] tactile-trigger"
                    : "opacity-50 border-red-500/20 bg-red-950/10 text-red-400 cursor-not-allowed shadow-none"
                )}
                title={isOnCampus ? "View event pass" : "Pass locked: Must be on campus"}
              >
                {isOnCampus ? 'View Pass 🎟️' : 'Locked 🔒'}
              </button>
              <button 
                onClick={() => downloadICSEvent(event)}
                aria-label="Add event to calendar"
                className="flex-1 h-10 px-3 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border border-cyan-500/25 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.05)] transition-all duration-300 tactile-trigger cursor-pointer"
              >
                Calendar 📅
              </button>
            </div>
          ) : onRegister ? (
            <button 
              onClick={() => !isRegistered && onRegister(event.id)}
              disabled={isRegistered}
              aria-label={isRegistered ? 'Already registered' : event.maxCapacity && registeredCount >= event.maxCapacity ? 'Join event waitlist' : event.isPaid ? `Pay and register for rupees ${event.ticketPrice}` : 'Register for event'}
              className={cn(
                "w-full h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all duration-300 tactile-trigger cursor-pointer shadow-sm",
                isRegistered 
                  ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/25 cursor-not-allowed shadow-none" 
                  : event.maxCapacity && registeredCount >= event.maxCapacity
                    ? "bg-gradient-to-r from-amber-500/80 to-orange-600/80 text-amber-950 hover:brightness-110 border-amber-500/20 shadow-sm"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 border-primary/10 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
              )}
            >
              {isRegistered ? 'Registered ✓' : event.maxCapacity && registeredCount >= event.maxCapacity ? (
                <>Join Waitlist ⏳</>
              ) : event.isPaid ? (
                <>
                  Pay & Register (₹{event.ticketPrice})
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </>
              ) : (
                <>
                  Register Now
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </>
              )}
            </button>
          ) : null}
        </div>
      )}
      
      {isAdmin && (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-2.5 w-full">
            <button 
              onClick={() => onEdit && onEdit(event)}
              aria-label={`Edit event: ${event.title}`}
              className={cn(
                "flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:text-foreground h-9.5 px-3 rounded-xl font-bold border border-white/5 transition-all duration-300 text-xs flex items-center justify-center gap-1.5 tactile-trigger cursor-pointer"
              )}
            >
              <Edit3 className="h-3.5 w-3.5 text-primary/80" aria-hidden="true" />
              Edit
            </button>
            <button 
              onClick={() => onDelete && onDelete(event.id)}
              aria-label={`Delete event: ${event.title}`}
              className={cn(
                "flex-1 bg-destructive/5 text-destructive hover:bg-destructive hover:text-primary-foreground h-9.5 px-3 rounded-xl font-bold border border-destructive/20 transition-all duration-300 text-xs flex items-center justify-center gap-1.5 tactile-trigger cursor-pointer"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </button>
          </div>
          <button 
            onClick={() => onViewAttendees && onViewAttendees(event.id)}
            aria-label={`View attendee list for event: ${event.title}`}
            className={cn(
              "w-full bg-primary/10 text-primary hover:bg-primary/20 h-9.5 px-3 rounded-xl font-black border border-primary/20 transition-all duration-300 text-xs flex items-center justify-center gap-1.5 tactile-trigger cursor-pointer"
            )}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Attendee Panel 👥
          </button>
        </div>
      )}
    </div>
  );
});

// ----------------------------------------------------------------------
// 6. MAIN EXPORT: EventCard (Backward Compatible Root)
// ----------------------------------------------------------------------
export const EventCard = memo(function EventCard(props: EventCardProps) {
  const eventDate = new Date(props.event.dateTime);
  const isUpcoming = eventDate > new Date();

  return (
    <EventCardContainer className={props.className} category={props.event.category}>
      <EventCardCover event={props.event} isUpcoming={isUpcoming} />
      <EventCardHeader title={props.event.title} />
      <EventCardBody 
        event={props.event} 
        registeredCount={props.registeredCount ?? 0}
        isConflicting={props.isConflicting ?? false}
        peerAttendees={props.peerAttendees ?? []}
      />
      <EventCardFooter {...props} />
    </EventCardContainer>
  );
});

// Attach sub-components for the elite Compound Component pattern:
Object.assign(EventCard, {
  Container: EventCardContainer,
  Cover: EventCardCover,
  Header: EventCardHeader,
  Body: EventCardBody,
  Footer: EventCardFooter
});
