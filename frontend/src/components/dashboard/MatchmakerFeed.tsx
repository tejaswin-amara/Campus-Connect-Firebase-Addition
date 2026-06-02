import { Sparkles, Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import type { RecommendedEvent } from '../../utils/matchmaker';

export interface MatchmakerFeedProps {
  recommendations: RecommendedEvent[];
  onRegister: (id: string | number) => void;
  registrationCounts: Record<string, number>;
  peerAttendeesMap: Record<string | number, Array<{ userId: string; username: string }>>;
}

export function MatchmakerFeed({
  recommendations,
  onRegister,
  registrationCounts,
  peerAttendeesMap
}: MatchmakerFeedProps) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div 
      role="region" 
      aria-label="AI Event Recommendations"
      className="p-6 rounded-2xl glass border-primary/30 relative overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.15)] bg-gradient-to-br from-[#0F0F13]/90 via-[#130E20]/90 to-[#0C0F16]/90 border border-primary/20 animate-in fade-in duration-500"
    >
      {/* Glow backgrounds */}
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-[60px]" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-[60px]" aria-hidden="true" />

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5 relative z-10">
        <div className="p-2 rounded-xl bg-primary/15 border border-primary/30 text-primary shadow-[0_0_15px_rgba(168,85,247,0.3)] animate-pulse-slow" aria-hidden="true">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight text-foreground uppercase">AI Matchmaker Feed</h3>
          <p className="text-[11px] text-muted-foreground font-semibold">Smart event recommendations curated from your interests and squad circles.</p>
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid gap-5 md:grid-cols-3 relative z-10" role="feed" aria-busy="false" aria-label="AI Recommendations list">
        {recommendations.map((event) => {
          const eventDate = new Date(event.dateTime);
          const registeredCount = registrationCounts[event.id] || event.registeredCount || 0;
          const peerAttendees = peerAttendeesMap[event.id] || [];
          
          // Generate a premium dynamic match percentage badge
          const matchPercent = Math.min(98, Math.max(70, Math.floor(70 + event.matchScore * 1.5)));

          return (
            <div 
              key={event.id}
              role="article"
              aria-roledescription="recommended event"
              aria-label={`Recommended event: ${event.title}, match rate ${matchPercent} percent`}
              tabIndex={0}
              className="flex flex-col p-4 rounded-xl border border-white/5 bg-[#0A0A0E]/50 hover:bg-[#0A0A0E]/80 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all duration-300 relative group outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {/* Score Indicator Badge */}
              <span 
                className="absolute top-4 right-4 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-gradient-to-r from-primary to-cyan-500 text-white shadow-md"
                aria-label={`${matchPercent} percent match score`}
              >
                {matchPercent}% MATCH
              </span>

              {/* Cover Category Tag */}
              <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                {event.category}
              </div>

              {/* Title */}
              <h4 className="text-sm font-black text-foreground group-hover:text-primary leading-tight line-clamp-1 transition-colors duration-200 pr-16">
                {event.title}
              </h4>

              {/* Match reasons */}
              <p className="text-[10px] text-cyan-400 mt-1 italic font-bold leading-tight">
                ✨ {event.matchReasons[0]}
              </p>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-2 leading-normal">
                {event.description}
              </p>

              {/* Info columns */}
              <div className="space-y-1.5 mt-4 border-t border-white/5 pt-3 mb-4" role="group" aria-label="Event details">
                <div className="flex items-center text-[10px] font-bold text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 mr-2 text-primary/80" aria-hidden="true" />
                  <span>
                    <span className="sr-only">Date: </span>
                    {eventDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center text-[10px] font-bold text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mr-2 text-primary/80" aria-hidden="true" />
                  <span>
                    <span className="sr-only">Location: </span>
                    <span className="truncate">{event.venue}</span>
                  </span>
                </div>
                {event.maxCapacity !== undefined && event.maxCapacity > 0 && (
                  <div className="flex items-center text-[10px] font-bold text-muted-foreground">
                    <Users className="h-3.5 w-3.5 mr-2 text-primary/80" aria-hidden="true" />
                    <span>
                      <span className="sr-only">Capacity: </span>
                      Seats: {registeredCount} / {event.maxCapacity}
                    </span>
                  </div>
                )}
              </div>

              {/* Peer attendees overlay */}
              {peerAttendees.length > 0 && (
                <div className="flex items-center gap-1.5 mb-4" role="group" aria-label="Squad attendees">
                  <div className="flex -space-x-1.5 overflow-hidden" role="list">
                    {peerAttendees.slice(0, 2).map((peer) => (
                      <div 
                        key={peer.userId}
                        role="listitem"
                        aria-label={`Squad peer member ${peer.username}`}
                        className="inline-flex h-5 w-5 rounded-full ring-2 ring-[#0A0A0E] bg-gradient-to-br from-primary to-cyan-500 border border-white/10 flex items-center justify-center text-[8px] font-black text-white"
                        title={peer.username}
                      >
                        {peer.username.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] text-muted-foreground font-bold tracking-tight">
                    {peerAttendees.length === 1 ? 'Squad attendee' : `${peerAttendees.length} squad attendees`}
                  </span>
                </div>
              )}

              {/* Action Trigger */}
              <button
                onClick={() => onRegister(event.id)}
                aria-label={`Register now for recommended event: ${event.title}`}
                className="w-full mt-auto h-8 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-extrabold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 border border-primary/20 hover:border-primary transition-all duration-300 cursor-pointer"
              >
                Register Now
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
