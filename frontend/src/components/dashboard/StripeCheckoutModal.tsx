import type { RefObject } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { EventData } from '../../types';

export interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutEvent: EventData | null;
  checkoutCardName: string;
  setCheckoutCardName: (val: string) => void;
  checkoutCardNumber: string;
  setCheckoutCardNumber: (val: string) => void;
  checkoutCardExpiry: string;
  setCheckoutCardExpiry: (val: string) => void;
  checkoutCardCVV: string;
  setCheckoutCardCVV: (val: string) => void;
  isProcessingPayment: boolean;
  checkoutError: string;
  onSubmit: (e: React.FormEvent) => void;
  modalRef: RefObject<HTMLDivElement | null>;
}

export function StripeCheckoutModal({
  isOpen,
  onClose,
  checkoutEvent,
  checkoutCardName,
  setCheckoutCardName,
  checkoutCardNumber,
  setCheckoutCardNumber,
  checkoutCardExpiry,
  setCheckoutCardExpiry,
  checkoutCardCVV,
  setCheckoutCardCVV,
  isProcessingPayment,
  checkoutError,
  onSubmit,
  modalRef
}: StripeCheckoutModalProps) {
  if (!isOpen || !checkoutEvent) return null;

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="stripe-checkout-title"
      aria-describedby="stripe-checkout-desc"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        ref={modalRef} 
        tabIndex={-1} 
        className="relative w-full max-w-md rounded-2xl glass border-cyan-500/30 bg-[#0F0F13]/95 shadow-2xl p-6 flex flex-col animate-in zoom-in-95 duration-200 outline-none"
      >
        {/* Ambient neon styling indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-primary rounded-t-2xl" aria-hidden="true" />
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-4">
          <div>
            <h3 id="stripe-checkout-title" className="text-md font-black tracking-tight text-foreground uppercase">Premium Checkout</h3>
            <p id="stripe-checkout-desc" className="text-[10px] text-muted-foreground">Secured via Stripe Elements 💳</p>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close checkout modal"
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        {/* Event pricing Summary */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-foreground truncate max-w-[250px]">{checkoutEvent.title}</p>
            <p className="text-[9px] text-muted-foreground">📍 {checkoutEvent.venue}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block font-bold">Total Price</span>
            <span className="text-lg font-black text-cyan-400">₹{checkoutEvent.ticketPrice}</span>
          </div>
        </div>

        {checkoutError && (
          <div 
            role="alert" 
            aria-live="assertive"
            className="p-3 text-xs font-bold text-destructive-foreground bg-destructive/90 rounded-xl border border-destructive/30 mb-4 flex items-center gap-2 animate-pulse"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {checkoutError}
          </div>
        )}

        {/* Stripe Card Elements Fields */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="stripe-name-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Cardholder Name
            </label>
            <input
              type="text"
              required
              id="stripe-name-input"
              value={checkoutCardName}
              onChange={(e) => setCheckoutCardName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="cyber-input h-10 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="stripe-number-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Card Number
            </label>
            <input
              type="text"
              required
              maxLength={19}
              id="stripe-number-input"
              value={checkoutCardNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').substring(0, 16);
                const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                setCheckoutCardNumber(formatted);
              }}
              placeholder="4242 4242 4242 4242"
              className="cyber-input h-10 text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="stripe-expiry-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Expiration Date
              </label>
              <input
                type="text"
                required
                maxLength={5}
                id="stripe-expiry-input"
                value={checkoutCardExpiry}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, '').substring(0, 4);
                  if (val.length >= 2) {
                    val = `${val.substring(0, 2)}/${val.substring(2)}`;
                  }
                  setCheckoutCardExpiry(val);
                }}
                placeholder="MM/YY"
                className="cyber-input h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="stripe-cvv-input" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                CVV/CVC
              </label>
              <input
                type="password"
                required
                maxLength={3}
                id="stripe-cvv-input"
                value={checkoutCardCVV}
                onChange={(e) => setCheckoutCardCVV(e.target.value.replace(/\D/g, ''))}
                placeholder="***"
                className="cyber-input h-10 text-xs font-mono"
              />
            </div>
          </div>

          {/* Checkout CTA */}
          <button
            type="submit"
            disabled={isProcessingPayment}
            className="w-full mt-4 h-11 bg-gradient-to-r from-cyan-500 to-primary hover:brightness-115 text-primary-foreground font-black text-xs uppercase tracking-wider rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isProcessingPayment ? 'Processing...' : `Pay & Register • ₹${checkoutEvent.ticketPrice}`}
          </button>
        </form>
      </div>
    </div>
  );
}
