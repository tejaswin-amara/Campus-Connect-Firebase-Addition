import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  glow?: boolean;
}

export function Button({
  variant = 'primary',
  glow = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Core architecture & easing parameters
        "inline-flex items-center justify-center font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl border border-transparent select-none outline-none",
        "transition-all duration-300 ease-spring active:scale-[0.96] hover:-translate-y-[1.5px] cursor-pointer",
        
        // Variant palette systems
        variant === 'primary' && cn(
          "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground hover:brightness-110",
          glow && "shadow-glow-purple border-primary/20 hover:shadow-[0_0_25px_rgba(168,85,247,0.45)]"
        ),
        
        variant === 'secondary' && cn(
          "bg-secondary/80 text-secondary-foreground hover:bg-secondary border-border/30 hover:border-border/60",
          glow && "shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        ),
        
        variant === 'outline' && cn(
          "bg-transparent text-foreground hover:bg-secondary/40 border-border/40 hover:border-primary/40",
          glow && "hover:shadow-glow-purple"
        ),

        variant === 'ghost' && "bg-transparent text-muted-foreground hover:bg-secondary/20 hover:text-foreground border-transparent",

        variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/95 border-destructive/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]",

        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
