import { Sparkles, Flame, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';

export function PopularityBadge({ 
  capacity, 
  registered, 
  category,
  createdAt
}: { 
  capacity: number; 
  registered: number; 
  category: string; 
  createdAt?: string;
}) {
  const ratio = registered / Math.max(capacity, 1);
  const velocity = capacity > 0 ? (registered / capacity) * 100 : 0;
  
  let prediction = "Stable Demand";
  let dotColor = "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]";
  let borderClass = "border-cyan-500/20 bg-cyan-500/5 text-cyan-400";

  // Bounding published-time check within last 24 hours
  const isRecent = createdAt 
    ? (new Date().getTime() - new Date(createdAt).getTime()) < 24 * 60 * 60 * 1000 
    : false;

  if (velocity > 85) {
    // Occupancy above 85% unlocks Red pulsing Capacity Critical state
    prediction = "Capacity Critical 🚨";
    dotColor = "bg-red-500 animate-ping shadow-[0_0_8px_rgba(239,68,68,0.8)]";
    borderClass = "border-red-500/35 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]";
  } else if (velocity > 50 && isRecent) {
    // Velocity above 50% within 24 hours of publish unlocks Cyan Trending state
    prediction = "Trending Rapidly 🔥";
    dotColor = "bg-cyan-400 animate-ping shadow-[0_0_8px_rgba(34,211,238,0.8)]";
    borderClass = "border-cyan-400/35 bg-cyan-400/10 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.25)]";
  } else if (ratio > 0.8 || category.toLowerCase() === 'technical') {
    prediction = "High Capacity Forecast 🚀";
    dotColor = "bg-primary animate-ping shadow-[0_0_8px_rgba(168,85,247,0.8)]";
    borderClass = "border-primary/35 bg-primary/10 text-primary shadow-[0_0_15px_rgba(168,85,247,0.15)]";
  } else if (ratio < 0.2) {
    prediction = "Available Seats";
    dotColor = "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.6)]";
    borderClass = "border-muted-foreground/20 bg-muted/20 text-muted-foreground";
  }

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase transition-all duration-300", borderClass)}>
      <span className="relative flex h-2 w-2">
        <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", dotColor)} />
        <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColor.replace("animate-ping", ""))} />
      </span>
      <span className="flex items-center gap-1">
        <Sparkles className="h-3 w-3 shrink-0 opacity-80" />
        AI Forecast: {prediction}
      </span>
    </div>
  );
}

export function ConflictDetector({ isConflicting }: { isConflicting: boolean }) {
  if (!isConflicting) return null;

  return (
    <div className="flex items-start gap-3 p-4 mt-3 text-sm text-red-300 bg-red-950/30 rounded-2xl border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.12)] animate-pulse">
      <div className="p-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 mt-0.5">
        <ShieldAlert className="h-4 w-4 shrink-0" />
      </div>
      <div>
        <h4 className="font-bold text-red-200 text-xs uppercase tracking-wider mb-0.5">Schedule Conflict</h4>
        <p className="text-xs opacity-90 leading-relaxed">This event overlaps with another event you have registered for. Please check your dashboard calendar details.</p>
      </div>
    </div>
  );
}

export function EngagementStreak({ 
  streakDays, 
  multiplierActive 
}: { 
  streakDays: number; 
  multiplierActive: boolean; 
}) {
  return (
    <div className={cn(
      "flex items-center gap-3.5 px-4 py-2.5 glass border-primary/25 rounded-2xl shadow-xl transition-all duration-300 select-none group",
      multiplierActive 
        ? "shadow-glow-purple border-primary/45 bg-primary/15" 
        : "hover:border-primary/45 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
    )}>
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/10 border border-primary/20 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-300">
        <Flame className={cn("h-6 w-6 text-primary group-hover:text-purple-400 transition-colors", multiplierActive ? "animate-pulse text-purple-400" : "animate-pulse")} />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      </div>
      
      <div>
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Streak</p>
          <span className={cn(
            "px-1.5 py-0.5 text-[8px] font-extrabold border rounded-md transition-colors",
            multiplierActive 
              ? "bg-primary/20 text-primary border-primary/30" 
              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          )}>
            {multiplierActive ? "3x MULTIPLIER" : "MULTIPLIER Active"}
          </span>
        </div>
        <p className="text-xl font-black text-foreground tracking-tight flex items-baseline gap-1">
          {streakDays} <span className="text-xs font-semibold text-muted-foreground uppercase tracking-normal">Days</span>
        </p>
      </div>
    </div>
  );
}
