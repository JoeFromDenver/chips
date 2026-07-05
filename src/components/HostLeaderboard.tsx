import React, { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { CHIPS } from "../data/chips";
import { subscribeToPartyVotes, isFirebaseConfigured } from "../services/firebase";
import type { AggregatedVotes, VoteData } from "../services/firebase";
import { ChevronLeft, RotateCw, Sparkles, Camera, Trophy } from "lucide-react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import { TallyScanner } from "./TallyScanner";

interface HostLeaderboardProps {
  partyCode: string;
  onLeave: () => void;
}

export const HostLeaderboard: React.FC<HostLeaderboardProps> = ({ partyCode, onLeave }) => {
  const [votes, setVotes] = useState<AggregatedVotes>(() => {
    const initial: AggregatedVotes = {};
    CHIPS.forEach((c) => {
      initial[c.id] = { best: 0, spicy: 0, weird: 0, leastBest: 0 };
    });
    return initial;
  });
  const [totalUsers, setTotalUsers] = useState(0);

  // OLED Protection settings
  const [layout, setLayout] = useState<"A" | "B">("A");
  const [pixelOffset, setPixelOffset] = useState({ x: 0, y: 0 });
  const [isVictoryMode, setIsVictoryMode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [joinQrUrl, setJoinQrUrl] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Generate Join QR code
  useEffect(() => {
    const generateJoinQr = async () => {
      try {
        const joinUrl = `${window.location.origin}${window.location.pathname}?room=${partyCode}`;
        const url = await QRCode.toDataURL(joinUrl, { margin: 1, scale: 5 });
        setJoinQrUrl(url);
      } catch (err) {
        console.error("Error generating join QR:", err);
      }
    };
    generateJoinQr();
  }, [partyCode]);

  // 2. Subscribe to Firestore votes
  useEffect(() => {
    if (isFirebaseConfigured()) {
      const unsubscribe = subscribeToPartyVotes(partyCode, (updatedVotes, users) => {
        setVotes(updatedVotes);
        setTotalUsers(users);
      });
      return () => unsubscribe();
    }
  }, [partyCode]);

  // 3. Pixel shifting utility (OLED burn-in protection)
  // Shifts layout slightly by 1-2 pixels every 30 seconds
  useEffect(() => {
    const shiftInterval = setInterval(() => {
      const rx = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
      const ry = Math.floor(Math.random() * 3) - 1;
      setPixelOffset({ x: rx, y: ry });
    }, 30000);

    return () => clearInterval(shiftInterval);
  }, []);

  // 4. Layout auto-rotation timer (every 10 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      setLayout((l) => (l === "A" ? "B" : "A"));
    }, 600000); // 10 minutes

    return () => clearInterval(timer);
  }, []);

  // 5. Canvas ambient particle animation backdrop (keeps pixels active)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle class
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4; // Very slow movement
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 3 + 1;
        const colors = [
          "rgba(239, 68, 68, ",  // Red
          "rgba(59, 130, 246, ", // Blue
          "rgba(255, 255, 255, ", // White
          "rgba(245, 158, 11, ", // Amber/Gold
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.alpha = Math.random() * 0.4 + 0.1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around boundaries
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color + this.alpha + ")";
        c.shadowBlur = 10;
        c.shadowColor = this.color + "0.5)";
        c.fill();
        c.restore();
      }
    }

    const particleCount = 60;
    const particlesArray: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particlesArray.push(new Particle());
    }

    const animate = () => {
      ctx.fillStyle = "rgba(9, 9, 11, 0.2)"; // Soft overlay for trails
      ctx.fillRect(0, 0, width, height);

      particlesArray.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // 6. Fireworks effect for victory celebration loop
  useEffect(() => {
    if (!isVictoryMode) return;

    const interval = setInterval(() => {
      // Throw confetti from left side
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: ["#ef4444", "#ffffff", "#3b82f6", "#f59e0b"],
      });
      // Throw confetti from right side
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: ["#ef4444", "#ffffff", "#3b82f6", "#f59e0b"],
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isVictoryMode]);

  // Merge scan results from guests (for local offline mode)
  const handleOfflineMerge = (scannedRoom: string, scannedUser: string, scannedVotes: VoteData) => {
    if (scannedRoom.trim().toUpperCase() !== partyCode.trim().toUpperCase()) {
      alert("Error: Scanned QR code is from a different room!");
      return;
    }

    setVotes((prev) => {
      const merged = { ...prev };
      
      // We will simulate merging by replacing or combining
      // For local offline tally, we simply track this scanned guest
      // We can increment a temporary store or update totals
      // To keep it simple, we store guest votes in local state
      // Let's create an offline registry in state if needed, or update totals directly
      // Since guest vote counts are cumulative, we can just replace their record
      // Let's assume we sum all guests we scan. We can track guest data in a local map!
      return merged;
    });

    // To implement offline tallying, we can store scanned users in localStorage
    const localStoreKey = `offline_room_${partyCode}_data`;
    const savedData = localStorage.getItem(localStoreKey);
    let allGuestVotes: { [username: string]: VoteData } = {};
    if (savedData) {
      try {
        allGuestVotes = JSON.parse(savedData);
      } catch {}
    }
    
    // Add or overwrite this guest's votes
    allGuestVotes[scannedUser] = scannedVotes;
    localStorage.setItem(localStoreKey, JSON.stringify(allGuestVotes));

    // Recompute totals
    recomputeOfflineTotals(allGuestVotes);
  };

  const recomputeOfflineTotals = (allGuestVotes: { [username: string]: VoteData }) => {
    const totals: AggregatedVotes = {};
    CHIPS.forEach((c) => {
      totals[c.id] = { best: 0, spicy: 0, weird: 0, leastBest: 0 };
    });

    const usernames = Object.keys(allGuestVotes);
    usernames.forEach((user) => {
      const userVotes = allGuestVotes[user];
      Object.keys(userVotes).forEach((chipId) => {
        if (totals[chipId]) {
          totals[chipId].best += userVotes[chipId].best || 0;
          totals[chipId].spicy += userVotes[chipId].spicy || 0;
          totals[chipId].weird += userVotes[chipId].weird || 0;
          totals[chipId].leastBest += userVotes[chipId].leastBest || 0;
        }
      });
    });

    setVotes(totals);
    setTotalUsers(usernames.length);
  };

  // Trigger loading offline votes on mount
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      const localStoreKey = `offline_room_${partyCode}_data`;
      const savedData = localStorage.getItem(localStoreKey);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          recomputeOfflineTotals(parsed);
        } catch {}
      }
    }
  }, [partyCode]);

  // Aggregate results calculations
  const getSortedChipsForCategory = (category: "best" | "spicy" | "weird" | "leastBest") => {
    return [...CHIPS]
      .map((chip) => ({
        chip,
        count: votes[chip.id]?.[category] || 0,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getMaxVoteCountForCategory = (category: "best" | "spicy" | "weird" | "leastBest") => {
    let max = 0;
    CHIPS.forEach((chip) => {
      const count = votes[chip.id]?.[category] || 0;
      if (count > max) max = count;
    });
    return max === 0 ? 1 : max;
  };



  // Render layouts
  const renderLayoutA = () => {
    // Showdown Arena: vertical bars grouped by award
    const categories: Array<{ id: "best" | "spicy" | "weird" | "leastBest"; label: string; icon: string; bg: string }> = [
      { id: "best", label: "Grand Champion (Best Overall)", icon: "👑", bg: "bg-yellow-500" },
      { id: "spicy", label: "Spiciest Challenger", icon: "🔥", bg: "bg-red-500" },
      { id: "weird", label: "Weirdest Wonder (Unique)", icon: "🌀", bg: "bg-purple-500" },
      { id: "leastBest", label: "Least Best (Disaster)", icon: "📉", bg: "bg-zinc-600" },
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-7xl mx-auto z-10 px-4">
        {categories.map((cat) => {
          const sorted = getSortedChipsForCategory(cat.id).slice(0, 4); // show top 4 chips in each category
          const maxVotes = getMaxVoteCountForCategory(cat.id);
          
          return (
            <Card key={cat.id} className="bg-zinc-950/80 border-zinc-800/80 backdrop-blur shadow-2xl relative overflow-hidden">
              <CardHeader className="pb-2 border-b border-zinc-900 bg-zinc-900/30">
                <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <span>{cat.icon}</span> {cat.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {sorted.every(item => item.count === 0) ? (
                  <div className="h-36 flex items-center justify-center text-xs text-zinc-600 font-bold uppercase tracking-wider">
                    Waiting for votes...
                  </div>
                ) : (
                  sorted.map((item, index) => {
                    const percentage = (item.count / maxVotes) * 100;
                    return (
                      <div key={item.chip.id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="flex items-center gap-1.5 text-zinc-100">
                            <span className="text-[10px] text-zinc-500">#{index + 1}</span>
                            <span>{item.chip.emoji}</span>
                            <span>{item.chip.name}</span>
                          </span>
                          <span className="text-zinc-400">{item.count} votes</span>
                        </div>
                        <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-zinc-800">
                          <div 
                            className={`h-full ${cat.bg} transition-all duration-1000 ease-out`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderLayoutB = () => {
    // Grid Combat: all 9 chips sorted by total Best votes, displaying their award metrics
    const sortedChips = [...CHIPS].sort((a, b) => {
      const aBest = votes[a.id]?.best || 0;
      const bBest = votes[b.id]?.best || 0;
      return bBest - aBest;
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto z-10 px-4">
        {sortedChips.map((chip, rank) => {
          const cVotes = votes[chip.id] || { best: 0, spicy: 0, weird: 0, leastBest: 0 };
          return (
            <Card key={chip.id} className="bg-zinc-950/80 border-zinc-800/80 backdrop-blur shadow-xl relative overflow-hidden flex flex-col justify-between border-t-2 border-t-zinc-800">
              <CardHeader className="pb-2 border-b border-zinc-900 bg-zinc-900/30">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px] font-black uppercase">
                    Rank #{rank + 1}
                  </Badge>
                  <span className="text-2xl">{chip.emoji}</span>
                </div>
                <CardTitle className="font-extrabold text-sm text-zinc-100 mt-1 leading-tight">{chip.name}</CardTitle>
                <CardDescription className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{chip.brand}</CardDescription>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1.5 text-[10px] font-bold">
                  {/* Best Overall Meter */}
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400">👑 BEST OVERALL</span>
                    <span>{cVotes.best}</span>
                  </div>
                  <Progress value={cVotes.best * 5} className="h-1.5 bg-zinc-900" />
                  
                  {/* Spicy Meter */}
                  <div className="flex justify-between items-center">
                    <span className="text-red-400">🔥 SPICIEST</span>
                    <span>{cVotes.spicy}</span>
                  </div>
                  <Progress value={cVotes.spicy * 5} className="h-1.5 bg-zinc-900" />

                  {/* Weird Meter */}
                  <div className="flex justify-between items-center">
                    <span className="text-purple-400">🌀 WEIRDEST</span>
                    <span>{cVotes.weird}</span>
                  </div>
                  <Progress value={cVotes.weird * 5} className="h-1.5 bg-zinc-900" />

                  {/* Worst Meter */}
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">📉 LEAST BEST</span>
                    <span>{cVotes.leastBest}</span>
                  </div>
                  <Progress value={cVotes.leastBest * 5} className="h-1.5 bg-zinc-900" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderVictoryMode = () => {
    // Large theatrical display of the winners in each category
    const bestWinner = getSortedChipsForCategory("best")[0];
    const spicyWinner = getSortedChipsForCategory("spicy")[0];
    const weirdWinner = getSortedChipsForCategory("weird")[0];
    const worstWinner = getSortedChipsForCategory("leastBest")[0];

    const podiums = [
      { label: "Spiciest Challenger", item: spicyWinner, icon: "🔥", color: "text-red-400 border-red-500/30 bg-red-950/20" },
      { label: "Grand Champion (Best)", item: bestWinner, icon: "🏆", color: "text-yellow-400 border-yellow-500/40 bg-yellow-950/30 scale-105 shadow-yellow-500/10 shadow-2xl" },
      { label: "Weirdest Wonder", item: weirdWinner, icon: "🌀", color: "text-purple-400 border-purple-500/30 bg-purple-950/20" },
    ];

    return (
      <div className="flex flex-col items-center justify-center flex-grow w-full max-w-5xl mx-auto z-10 px-4 py-8">
        <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-950/20 animate-pulse font-black px-4 py-1.5 text-sm uppercase tracking-widest mb-2">
          🏆 Crunch Showdown Victory Podium 🏆
        </Badge>
        <h2 className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8">The People Have Spoken</h2>

        {/* Podium Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-end mt-4">
          {/* We display in order: 2nd place (Spicy), 1st place (Best), 3rd place (Weird) */}
          {[podiums[0], podiums[1], podiums[2]].map((pod, i) => {
            const hasVotes = pod.item && pod.item.count > 0;
            return (
              <div 
                key={i} 
                className={`flex flex-col items-center p-6 border rounded-2xl backdrop-blur-md relative ${pod.color} transition-all duration-500`}
              >
                <div className="text-5xl mb-4 bg-zinc-900/80 p-4 rounded-full border border-zinc-800 shadow-lg select-none">
                  {hasVotes ? pod.item.chip.emoji : "❓"}
                </div>
                <h3 className="text-zinc-400 font-extrabold text-[11px] uppercase tracking-wider mb-1">{pod.label}</h3>
                <h4 className="text-zinc-100 font-black text-xl text-center leading-tight">
                  {hasVotes ? pod.item.chip.name : "No votes cast"}
                </h4>
                {hasVotes && (
                  <p className="text-sm font-bold text-zinc-300 mt-2 bg-zinc-900/60 px-3 py-1 rounded-full border border-zinc-800">
                    {pod.item.count} votes
                  </p>
                )}
                {pod.label.includes("Champion") && hasVotes && (
                  <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-3 -left-3 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        {/* Disaster award styled in a special card below */}
        {worstWinner && worstWinner.count > 0 && (
          <Card className="mt-12 bg-zinc-950/80 border-zinc-900/80 max-w-md w-full border-t-2 border-t-zinc-600">
            <CardHeader className="py-3 text-center border-b border-zinc-900">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-center gap-1.5">
                📉 The "Least Best" Disaster Award
              </CardTitle>
            </CardHeader>
            <CardContent className="py-4 text-center">
              <span className="text-3xl bg-zinc-900 p-2 rounded-full border border-zinc-800 select-none inline-block mb-2">
                {worstWinner.chip.emoji}
              </span>
              <h4 className="font-extrabold text-sm text-zinc-300">{worstWinner.chip.name}</h4>
              <p className="text-xs text-zinc-500 mt-1 font-bold">{worstWinner.count} total disaster votes</p>
            </CardContent>
          </Card>
        )}

        <Button 
          onClick={() => setIsVictoryMode(false)}
          className="mt-12 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 px-6 py-4 uppercase font-bold text-xs"
        >
          Return to Leaderboard
        </Button>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col justify-between relative overflow-hidden select-none"
      style={{
        paddingLeft: `${pixelOffset.x}px`,
        paddingTop: `${pixelOffset.y}px`,
      }}
    >
      {/* Background Canvas for slow ambient pixel movement (OLED TV Saver) */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Leaderboard Header */}
      <header className="flex justify-between items-center z-10 py-4 px-6 border-b border-zinc-900 bg-zinc-950/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onLeave} className="text-zinc-400 hover:text-zinc-50 h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xs uppercase font-extrabold tracking-widest text-zinc-500">Live Showdown Tally</h1>
            <h2 className="text-lg font-black uppercase text-zinc-100 flex items-center gap-1.5">
              <span>{partyCode}</span>
              <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[10px] font-black py-0.5">
                {totalUsers} Crunchers
              </Badge>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* Toggle Layout manually */}
          {!isVictoryMode && (
            <Button
              onClick={() => {
                setLayout((l) => (l === "A" ? "B" : "A"));
              }}
              variant="outline"
              size="icon"
              className="h-8 w-8 border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100"
              title="Switch Layout"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Camera QR scan for offline tallies */}
          <Button
            onClick={() => setShowScanner(true)}
            variant="outline"
            className="h-8 border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-100 text-xs font-bold uppercase tracking-wider gap-1.5 px-3"
          >
            <Camera className="w-3.5 h-3.5" /> Scan QR Votes
          </Button>

          {/* Victory Podium mode */}
          <Button
            onClick={() => {
              setIsVictoryMode(!isVictoryMode);
              if (!isVictoryMode) {
                // fire initial confetti burst
                confetti({
                  particleCount: 150,
                  spread: 80,
                  origin: { y: 0.6 },
                  colors: ["#ef4444", "#ffffff", "#3b82f6", "#f59e0b"],
                });
              }
            }}
            className={`${
              isVictoryMode 
                ? "bg-amber-600 hover:bg-amber-500 text-zinc-950" 
                : "bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 text-white"
            } h-8 text-xs font-extrabold uppercase tracking-wider gap-1.5 px-4 shadow-lg`}
          >
            <Trophy className="w-3.5 h-3.5" /> {isVictoryMode ? "Live Standings" : "End & Crown Winners!"}
          </Button>
        </div>
      </header>

      {/* Main Leaderboard Display */}
      <main className="flex-grow flex items-center justify-center py-8 z-10">
        {isVictoryMode ? (
          renderVictoryMode()
        ) : layout === "A" ? (
          renderLayoutA()
        ) : (
          renderLayoutB()
        )}
      </main>

      {/* TV View Footer with join QR code */}
      <footer className="z-10 bg-zinc-950/95 border-t border-zinc-900 p-4 flex justify-between items-center px-8">
        <div className="flex flex-col">
          <p className="text-xs uppercase font-extrabold tracking-widest text-zinc-500">Scan to vote in this room</p>
          <p className="text-[10px] text-zinc-600 leading-relaxed max-w-sm">
            Everyone gets unlimited votes. Grab a plate, taste the contenders, and cast your votes to crown the ultimate champion!
          </p>
        </div>

        {/* QR Code container */}
        <div className="flex items-center gap-3 bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800">
          <div className="text-right">
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-pulse">Live Lobby Join</p>
            <p className="font-extrabold text-sm uppercase tracking-wider text-zinc-300 mt-0.5">Code: {partyCode}</p>
          </div>
          {joinQrUrl ? (
            <img src={joinQrUrl} alt="Join Room QR Code" className="w-14 h-14 rounded-lg bg-white p-0.5 border border-zinc-800" />
          ) : (
            <div className="w-14 h-14 bg-zinc-800 animate-pulse rounded-lg"></div>
          )}
        </div>
      </footer>

      {/* Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold uppercase tracking-tight text-center">Scan Guest QR Votes</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs text-center">
              Scan a guest's screen containing their vote tally. This will add or merge their votes locally into this host dashboard.
            </DialogDescription>
          </DialogHeader>
          
          {showScanner && (
            <TallyScanner
              onScanComplete={(room, user, guestVotes) => {
                handleOfflineMerge(room, user, guestVotes);
                setShowScanner(false);
              }}
              onClose={() => setShowScanner(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
