import { useState, useCallback } from 'react';
import { Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { QRCodeSVG } from 'qrcode.react';
import type { UserProfile, PeerRelation } from '../../types';

interface SquadPanelProps {
  user: UserProfile;
  myPeers: PeerRelation[];
  onAddPeer: (email: string) => Promise<{ success: boolean; error?: string; username?: string }>;
}

export function SquadPanel({
  user,
  myPeers,
  onAddPeer
}: SquadPanelProps) {
  const [searchEmail, setSearchEmail] = useState('');
  const [isAddingPeer, setIsAddingPeer] = useState(false);
  const [peerSearchError, setPeerSearchError] = useState('');
  const [peerSearchSuccess, setPeerSearchSuccess] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const email = searchEmail.trim();
    if (!email) return;

    setPeerSearchError('');
    setPeerSearchSuccess('');
    setIsAddingPeer(true);

    try {
      const result = await onAddPeer(email);
      if (result.success) {
        setPeerSearchSuccess(`${result.username || 'Peer'} added to squad!`);
        setSearchEmail('');
      } else {
        setPeerSearchError(result.error || 'Failed to add peer.');
      }
    } catch (err: any) {
      setPeerSearchError('System error establishing peer connection.');
    } finally {
      setIsAddingPeer(false);
    }
  }, [searchEmail, onAddPeer]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <Users className="h-5 w-5 text-cyan-400" />
        <h3 className="text-xl font-bold tracking-tight">Your Squad Graph</h3>
      </div>

      {/* Add to Squad Card */}
      <Card className="glass border-primary/20 p-5 rounded-2xl relative z-0 overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-primary to-cyan-500" />
        <h4 className="text-sm font-extrabold text-foreground mb-3 uppercase tracking-wider">Connect with Peers</h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              required
              id="peer-email-input"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter peer's email..."
              className="cyber-input h-10 text-xs flex-grow"
              aria-label="Peer email address"
            />
            <Button 
              type="submit" 
              variant="primary" 
              className="h-10 text-xs px-4 bg-gradient-to-r from-primary to-purple-600 border-primary/25 cursor-pointer active:scale-95 font-bold shrink-0"
              disabled={isAddingPeer}
            >
              {isAddingPeer ? 'Connecting...' : 'Add'}
            </Button>
          </div>
          {peerSearchError && <p className="text-[10px] font-semibold text-red-400" role="alert">{peerSearchError}</p>}
          {peerSearchSuccess && <p className="text-[10px] font-semibold text-emerald-400" role="status">{peerSearchSuccess}</p>}
        </form>

        {/* Squad List */}
        <div className="mt-5 space-y-2 border-t border-border/40 pt-4 max-h-[180px] overflow-y-auto scrollbar-thin">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">My Squad ({myPeers.length})</p>
          {myPeers.length === 0 ? (
            <p className="text-[10px] text-muted-foreground/70 italic">No peers added yet. Invite your classmates to assemble your squad!</p>
          ) : (
            myPeers.map((peer) => (
              <div 
                key={peer.id} 
                className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 border border-border/40 hover:bg-white/10 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-cyan-500 border border-white/10 flex items-center justify-center text-xs font-black text-white shrink-0">
                  {peer.username ? peer.username.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="min-w-0 flex-grow">
                  <p className="text-xs font-black text-foreground truncate">{peer.username}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{peer.email}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Profile QR Card */}
      <Card className="glass border-cyan-500/20 p-5 rounded-2xl relative z-0 overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-500 to-emerald-500" />
        <h4 className="text-sm font-extrabold text-foreground mb-1.5 uppercase tracking-wider">My Profile Pass</h4>
        <p className="text-[9px] text-muted-foreground leading-relaxed mb-4">Let a peer scan this pass from their screen to instantly add you to their academic squad!</p>
        
        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/5 border border-white/10 animate-pulse-slow">
          <QRCodeSVG 
            value={`campusconnect:profile:${user.id}`}
            size={120}
            bgColor={"transparent"}
            fgColor={"#ffffff"}
            level={"M"}
            includeMargin={true}
          />
          <span className="text-[9px] font-bold text-cyan-400 mt-2.5 uppercase tracking-wider">Scan to Add Squad</span>
        </div>
      </Card>
    </div>
  );
}
