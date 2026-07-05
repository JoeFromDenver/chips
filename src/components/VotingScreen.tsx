import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { CHIPS } from "../data/chips";
import { saveVotesToFirestore, fetchUserVotesFromFirestore, type VoteData, isFirebaseConfigured } from "../services/firebase";
import { ChevronLeft, QrCode, CloudLightning, Check, RefreshCw } from "lucide-react";
import QRCode from "qrcode";

interface VotingScreenProps {
  username: string;
  partyCode: string;
  onLeave: () => void;
}

interface EmojiParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  tx: number; // target X offset
}

export const VotingScreen: React.FC<VotingScreenProps> = ({ username, partyCode, onLeave }) => {
  // State for user votes
  // Initialize votes as 0 for all categories
  const [votes, setVotes] = useState<VoteData>(() => {
    const initial: VoteData = {};
    CHIPS.forEach((chip) => {
      initial[chip.id] = { best: 0, spicy: 0, weird: 0, leastBest: 0 };
    });
    return initial;
  });

  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "saved" | "error">("idle");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [particles, setParticles] = useState<EmojiParticle[]>([]);
  const particleIdRef = useRef(0);
  
  // Ref for debouncing writes to Firestore
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // Fetch initial votes if Firebase is configured
  useEffect(() => {
    const loadInitialVotes = async () => {
      if (isFirebaseConfigured()) {
        setSyncStatus("syncing");
        const existing = await fetchUserVotesFromFirestore(partyCode, username);
        if (existing) {
          // Merge with initial template to ensure no missing keys
          setVotes((prev) => {
            const merged = { ...prev };
            Object.keys(existing).forEach((key) => {
              if (merged[key]) {
                merged[key] = { ...merged[key], ...existing[key] };
              }
            });
            return merged;
          });
          setSyncStatus("saved");
        } else {
          setSyncStatus("idle");
        }
      }
      isInitialLoad.current = false;
    };
    loadInitialVotes();
  }, [partyCode, username]);

  // Debounce syncing to Firestore when votes change
  useEffect(() => {
    if (isInitialLoad.current) return;
    
    setSyncStatus("syncing");
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (isFirebaseConfigured()) {
        const success = await saveVotesToFirestore(partyCode, username, votes);
        if (success) {
          setSyncStatus("saved");
        } else {
          setSyncStatus("error");
        }
      } else {
        // Local mode
        setSyncStatus("saved");
      }
    }, 1200); // 1.2 second debounce

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [votes, partyCode, username]);

  // Generate QR code for offline tallying
  const handleGenerateQr = async () => {
    try {
      const payload = {
        r: partyCode,
        u: username,
        v: votes,
      };
      const jsonStr = JSON.stringify(payload);
      const url = await QRCode.toDataURL(jsonStr, { margin: 2, scale: 6 });
      setQrCodeUrl(url);
      setShowQrDialog(true);
    } catch (err) {
      console.error("Failed to generate QR Code:", err);
    }
  };

  // Trigger emoji floating animations on tap
  const spawnParticle = (emoji: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + window.scrollX;
    const y = e.clientY - rect.top + window.scrollY;
    // Random float offset
    const tx = (Math.random() - 0.5) * 80;
    
    const newParticle: EmojiParticle = {
      id: particleIdRef.current++,
      emoji,
      x,
      y,
      tx,
    };
    
    setParticles((prev) => [...prev, newParticle]);
    
    // Remove particle after animation completes
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
    }, 1000);
  };

  const handleVote = (chipId: string, category: "best" | "spicy" | "weird" | "leastBest", e: React.MouseEvent<HTMLButtonElement>, emoji: string) => {
    spawnParticle(emoji, e);
    setVotes((prev) => {
      const chipVotes = prev[chipId] || { best: 0, spicy: 0, weird: 0, leastBest: 0 };
      return {
        ...prev,
        [chipId]: {
          ...chipVotes,
          [category]: chipVotes[category] + 1,
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 relative pb-12 select-none">
      {/* Floating particles style container */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatUp {
          0% {
            transform: translate(-50%, -50%) translateY(0) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translateY(-120px) translateX(var(--tx)) scale(0.6);
            opacity: 0;
          }
        }
        .emoji-particle {
          position: absolute;
          pointer-events: none;
          font-size: 1.5rem;
          animation: floatUp 1s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
          z-index: 50;
        }
      `}} />

      {/* Sticky header */}
      <header className="sticky top-0 bg-zinc-950/80 border-b border-zinc-900 backdrop-blur-md z-40 py-3 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={onLeave} className="text-zinc-400 hover:text-zinc-50 h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="text-xs uppercase font-extrabold tracking-widest text-zinc-500">Showdown</h2>
              <h1 className="text-sm font-black uppercase text-zinc-100">{partyCode}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Syncing indicator */}
            <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider uppercase">
              {syncStatus === "syncing" && (
                <span className="text-blue-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Syncing
                </span>
              )}
              {syncStatus === "saved" && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              {syncStatus === "error" && (
                <span className="text-red-400 flex items-center gap-1">
                  <CloudLightning className="w-3 h-3" /> Sync Fail
                </span>
              )}
              {syncStatus === "idle" && (
                <span className="text-zinc-500">Offline</span>
              )}
            </div>

            <Button
              onClick={handleGenerateQr}
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider h-8 gap-1.5 px-3"
            >
              <QrCode className="w-3.5 h-3.5 text-zinc-300" /> Tally QR
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grid container */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        <div className="text-center mb-6">
          <Badge variant="outline" className="border-red-500/20 bg-red-950/10 text-red-400 font-extrabold text-xs uppercase px-3 py-1 mb-2 tracking-widest">
            Tap buttons to cast unlimited votes!
          </Badge>
          <p className="text-xs text-zinc-400">
            Swipe through cards to view chip stats and the legendary Trader Joe's corporate pitch history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {CHIPS.map((chip) => {
            const userChipVotes = votes[chip.id] || { best: 0, spicy: 0, weird: 0, leastBest: 0 };
            return (
              <Card 
                key={chip.id} 
                className={`bg-zinc-900/40 border-zinc-800/80 backdrop-blur-sm relative overflow-hidden flex flex-col justify-between shadow-xl border-t-2 ${chip.accentColor} transition-transform duration-300 hover:scale-[1.01]`}
              >
                {/* Embedded dynamic particles inside the relative card */}
                {particles.map((p) => (
                  <span
                    key={p.id}
                    className="emoji-particle"
                    style={{
                      left: p.x,
                      top: p.y,
                      "--tx": `${p.tx}px`,
                    } as React.CSSProperties}
                  >
                    {p.emoji}
                  </span>
                ))}

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-3xl bg-zinc-800/50 p-2 rounded-xl border border-zinc-700/50">{chip.emoji}</span>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{chip.brand}</p>
                      <h3 className="font-extrabold text-lg tracking-tight leading-tight text-zinc-100">{chip.name}</h3>
                    </div>
                  </div>
                  
                  {/* Traits badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {chip.characteristics.map((char, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 ${
                          char === "Employee Idea" 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700/30"
                        }`}
                      >
                        {char}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-4 flex-grow">
                  {/* Chip cover photo */}
                  <div className="w-full h-48 rounded-lg overflow-hidden border border-zinc-800/30 bg-zinc-950/20 relative flex items-center justify-center mb-2">
                    <img 
                      src={`${import.meta.env.BASE_URL}assets/chips/${chip.id}.jpg`} 
                      alt={chip.name} 
                      className="w-full h-full object-contain hover:scale-105 transition-all duration-500"
                    />
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{chip.description}</p>
                  
                  {/* Rating parameters */}
                  <div className="flex gap-4 text-xs font-bold text-zinc-400 bg-zinc-950/40 p-2 rounded-lg border border-zinc-900">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-500 text-[10px] uppercase tracking-wider">Crunch</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span 
                            key={i} 
                            className={`w-2 h-2.5 rounded-sm ${
                              i < chip.crunchLevel ? "bg-amber-500" : "bg-zinc-800"
                            }`}
                          ></span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-red-500 text-[10px] uppercase tracking-wider">Spice</span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span 
                            key={i} 
                            className={`w-2 h-2.5 rounded-sm ${
                              i < chip.spiceLevel ? "bg-red-500 animate-pulse" : "bg-zinc-800"
                            }`}
                          ></span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Anecdote pitch card */}
                  {chip.anecdote && (
                    <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1 bg-amber-500/20 border-l border-b border-amber-500/30 rounded-bl text-[8px] font-black uppercase text-amber-400 tracking-wider">
                        Boulder TJ Story
                      </div>
                      <p className="text-[11px] italic text-amber-300/90 leading-relaxed pr-6 mt-1 font-medium">
                        "{chip.anecdote}"
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900/50 bg-zinc-950/20 py-4 px-4">
                  <Button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleVote(chip.id, "best", e, "👑")}
                    className="bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 h-11 text-xs uppercase font-extrabold flex justify-between px-3 group transition"
                  >
                    <span className="flex items-center gap-1 text-zinc-300">
                      👑 Best
                    </span>
                    <Badge className="bg-gradient-to-r from-yellow-500 to-amber-600 text-zinc-950 text-[10px] font-black group-hover:scale-110 transition-transform">
                      {userChipVotes.best}
                    </Badge>
                  </Button>

                  <Button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleVote(chip.id, "spicy", e, "🔥")}
                    className="bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 h-11 text-xs uppercase font-extrabold flex justify-between px-3 group transition"
                  >
                    <span className="flex items-center gap-1 text-zinc-300">
                      🔥 Spicy
                    </span>
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-600 text-zinc-50 text-[10px] font-black group-hover:scale-110 transition-transform">
                      {userChipVotes.spicy}
                    </Badge>
                  </Button>

                  <Button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleVote(chip.id, "weird", e, "🌀")}
                    className="bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 h-11 text-xs uppercase font-extrabold flex justify-between px-3 group transition"
                  >
                    <span className="flex items-center gap-1 text-zinc-300">
                      🌀 Weird
                    </span>
                    <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-zinc-50 text-[10px] font-black group-hover:scale-110 transition-transform">
                      {userChipVotes.weird}
                    </Badge>
                  </Button>

                  <Button
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleVote(chip.id, "leastBest", e, "📉")}
                    className="bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 h-11 text-xs uppercase font-extrabold flex justify-between px-3 group transition"
                  >
                    <span className="flex items-center gap-1 text-zinc-300">
                      📉 Worst
                    </span>
                    <Badge className="bg-gradient-to-r from-zinc-600 to-zinc-800 text-zinc-200 text-[10px] font-black group-hover:scale-110 transition-transform">
                      {userChipVotes.leastBest}
                    </Badge>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Offline QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-tight text-center">Offline Tally QR</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs text-center">
              Show this QR code to the host to sync your votes offline. They will scan it using their camera dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center p-4 bg-white rounded-xl max-w-[240px] mx-auto my-3 border-4 border-zinc-800">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Vote Tally QR Code" className="w-full h-auto" />
            ) : (
              <div className="w-[200px] h-[200px] bg-zinc-800 animate-pulse flex items-center justify-center text-xs text-zinc-500 font-bold uppercase">
                Generating...
              </div>
            )}
          </div>
          
          <div className="text-[10px] text-zinc-500 font-bold uppercase mt-2">
            User: {username} | Room: {partyCode}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
