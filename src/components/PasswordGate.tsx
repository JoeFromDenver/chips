import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Shield, Sparkles } from "lucide-react";

interface PasswordGateProps {
  onAuthenticated: (username: string) => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError("Please choose a username for the voting leaderboard.");
      return;
    }
    
    if (password.trim().toLowerCase() !== "syrup") {
      setError("Incorrect party password! Hint: Check with the host.");
      return;
    }

    // Save to localStorage
    localStorage.setItem("crunch_showdown_auth_pwd", "syrup");
    localStorage.setItem("crunch_showdown_auth_username", username.trim());
    
    onAuthenticated(username.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-50 px-4 relative overflow-hidden select-none">
      {/* Patriotic background glow elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse duration-4000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse duration-4000 delay-2000"></div>
      
      {/* Custom fireworks particle backdrop simulation using pure CSS */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>

      <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800 backdrop-blur-md relative z-10 overflow-hidden shadow-2xl shadow-red-950/20">
        {/* Glow accent lines */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-zinc-200 to-blue-500"></div>
        
        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-zinc-800/80 border border-zinc-700 animate-bounce duration-3000 relative">
              <Shield className="w-8 h-8 text-red-500 animate-pulse" />
              <Sparkles className="w-4 h-4 text-blue-400 absolute -top-1 -right-1 animate-spin duration-5000" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter bg-gradient-to-r from-red-500 via-zinc-100 to-blue-500 bg-clip-text text-transparent uppercase">
            Crunch Showdown
          </CardTitle>
          <CardDescription className="text-zinc-400 text-sm mt-1">
            July 4th Heated Chip Rivalry
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Choose Username
              </label>
              <Input
                type="text"
                placeholder="e.g. SnackMaster7"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                maxLength={18}
                className="bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-red-500 focus:ring-red-500 transition"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Party Password
              </label>
              <Input
                type="password"
                placeholder="Enter password to enter party"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500 transition"
              />
            </div>

            {error && (
              <div className="p-3 rounded bg-red-950/40 border border-red-800/50 text-red-400 text-xs font-semibold text-center animate-shake">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-500 hover:to-blue-500 font-bold uppercase tracking-wider py-6 mt-2 relative overflow-hidden group shadow-lg"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Gain Access <Sparkles className="w-4 h-4 animate-pulse" />
              </span>
              <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="justify-center border-t border-zinc-800/50 py-4 bg-zinc-950/20 text-center">
          <p className="text-[10px] text-zinc-500">
            Keep out unauthorized crunchers. 🇺🇸 Est. 2026
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};
