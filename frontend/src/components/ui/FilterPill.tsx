import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface FilterPillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  label: string;
  glowColor?: 'purple' | 'cyan' | 'emerald';
}

export function FilterPill({ 
  isActive, 
  label, 
  glowColor = 'purple',
  className,
  ...props 
}: FilterPillProps) {
  
  const glowClasses = {
    purple: 'shadow-glow-purple bg-primary/20 text-primary border-primary/45',
    cyan: 'shadow-glow-cyan bg-cyan-500/20 text-cyan-400 border-cyan-500/45',
    emerald: 'shadow-glow-emerald bg-emerald-500/20 text-emerald-400 border-emerald-500/45'
  };

  return (
    <button
      className={cn(
        // Base structure with spring transition and squish active physics
        "px-5 py-2 text-xs uppercase tracking-wider rounded-full border select-none font-bold outline-none",
        "transition-all duration-300 ease-spring active:scale-95 hover:-translate-y-[1.5px] cursor-pointer shrink-0",
        
        // Active vs Inactive state
        isActive 
          ? cn("scale-105 border-opacity-70", glowClasses[glowColor]) 
          : "text-muted-foreground border-border/30 hover:border-border/60 hover:text-foreground hover:bg-secondary/40 hover:shadow-[0_4px_12px_rgba(255,255,255,0.02)] bg-secondary/25 backdrop-blur-md",
        
        className
      )}
      {...props}
    >
      {label}
    </button>
  );
}
