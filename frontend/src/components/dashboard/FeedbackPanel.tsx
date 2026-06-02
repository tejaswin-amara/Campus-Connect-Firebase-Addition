import { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import type { EventData } from '../../types';

interface FeedbackPanelProps {
  pendingFeedbackEvent: EventData;
  onSubmitFeedback: (rating: number, takeaway: string) => Promise<boolean>;
  onSkip: () => void;
}

export function FeedbackPanel({
  pendingFeedbackEvent,
  onSubmitFeedback,
  onSkip
}: FeedbackPanelProps) {
  const [rating, setRating] = useState(5);
  const [takeaway, setTakeaway] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const comment = takeaway.trim();
    if (!comment) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmitFeedback(rating, comment);
      if (success) {
        setTakeaway('');
        setRating(5);
      }
    } catch (err) {
      // Handled by parent callback
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, takeaway, onSubmitFeedback]);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-background/30 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-md rounded-2xl glass border-primary/30 shadow-2xl p-6 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200">
        {/* Holographic Glowing Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-emerald-500 rounded-t-2xl" />

        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-4 animate-bounce">
          <Sparkles className="h-6 w-6" />
        </div>

        <h3 className="text-xl font-black tracking-tight text-foreground uppercase">Rate Your Experience!</h3>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          We noticed you recently checked in to <strong className="text-primary">"{pendingFeedbackEvent.title}"</strong>. Help KLH organizers improve event quality by submitting a quick rating!
        </p>

        <form onSubmit={handleSubmit} className="w-full mt-6 space-y-4">
          {/* Star selector */}
          <div 
            className="flex justify-center gap-2" 
            role="radiogroup" 
            aria-label="Event rating from 1 to 5 stars"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                role="radio"
                aria-checked={star === rating}
                aria-label={`${star} Star${star > 1 ? 's' : ''}`}
                className={cn(
                  "text-3xl transition-transform duration-200 hover:scale-125 cursor-pointer active:scale-95 focus:outline-none focus:scale-125",
                  star <= rating ? "text-amber-400" : "text-slate-600"
                )}
              >
                ★
              </button>
            ))}
          </div>

          {/* Takeaway text field */}
          <div className="space-y-1 text-left">
            <label htmlFor="feedback-comment-input" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              One-line Takeaway
            </label>
            <input
              type="text"
              required
              id="feedback-comment-input"
              value={takeaway}
              onChange={(e) => setTakeaway(e.target.value)}
              placeholder="e.g. Breathtaking learning experience, highly recommended!"
              className="cyber-input h-11 text-xs"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={onSkip}
            >
              Skip
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              className="flex-1 bg-gradient-to-r from-primary to-cyan-500 border-primary/30"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
