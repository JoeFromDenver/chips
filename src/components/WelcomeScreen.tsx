import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Settings, Play, Database, Tv, User, RefreshCw } from "lucide-react";
import { isFirebaseConfigured, initializeFirebase, clearFirebaseConfig, getActiveFirebaseConfig, type FirebaseConfig } from "../services/firebase";

interface WelcomeScreenProps {
  username: string;
  onJoinRoom: (partyCode: string, isHost: boolean) => void;
  onLogout: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ username, onJoinRoom, onLogout }) => {
  const [partyCode, setPartyCode] = useState("");
  const [dbConfigured, setDbConfigured] = useState(isFirebaseConfigured());
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState("");

  // Firebase Config state for settings form
  const [apiKey, setApiKey] = useState("");
  const [authDomain, setAuthDomain] = useState("");
  const [projectId, setProjectId] = useState("");
  const [storageBucket, setStorageBucket] = useState("");
  const [messagingSenderId, setMessagingSenderId] = useState("");
  const [appId, setAppId] = useState("");

  useEffect(() => {
    const active = getActiveFirebaseConfig();
    if (active) {
      setApiKey(active.apiKey || "");
      setAuthDomain(active.authDomain || "");
      setProjectId(active.projectId || "");
      setStorageBucket(active.storageBucket || "");
      setMessagingSenderId(active.messagingSenderId || "");
      setAppId(active.appId || "");
    }
  }, []);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    const db = initializeFirebase(config);
    if (db) {
      setDbConfigured(true);
      setShowSettings(false);
      setError("");
      // Force page reload to ensure Firebase state is clean
      window.location.reload();
    } else {
      setError("Failed to initialize Firebase with those keys. Check formatting.");
    }
  };

  const handleClearConfig = () => {
    clearFirebaseConfig();
    setDbConfigured(false);
    setApiKey("");
    setAuthDomain("");
    setProjectId("");
    setStorageBucket("");
    setMessagingSenderId("");
    setAppId("");
    window.location.reload();
  };

  const handleGenerateRoom = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const words = ["CRUNCH", "SPICY", "RIVAL", "KETTLE", "BBQ", "GOLD", "CHIP"];
    const randWord = words[Math.floor(Math.random() * words.length)];
    const generated = `${randWord}-${randomSuffix}`;
    setPartyCode(generated);
  };

  const handleAction = (isHost: boolean) => {
    const code = partyCode.trim().toUpperCase();
    if (!code) {
      setError("Please enter or generate a Party Room Code first!");
      return;
    }
    onJoinRoom(code, isHost);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col justify-between p-4 relative overflow-hidden select-none">
      {/* Glow elements */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-red-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Header bar */}
      <header className="flex justify-between items-center z-10 max-w-4xl mx-auto w-full border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-red-500/50 text-red-400 gap-1 px-3 py-1 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
            JULY 4TH
          </Badge>
          {dbConfigured ? (
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 gap-1 px-2 py-0.5 text-[10px]">
              <Database className="w-3 h-3" /> Sync Active
            </Badge>
          ) : (
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 gap-1 px-2 py-0.5 text-[10px]">
              <Database className="w-3 h-3" /> Local Mode
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger render={
              <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900">
                <Settings className="w-4 h-4" />
              </Button>
            } />
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Database Settings</DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs">
                  Configure a custom Firebase project to synchronize votes in real-time. If unconfigured, the app falls back to Local / QR Code scanning.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSaveConfig} className="space-y-3 mt-2 text-sm">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">API Key</label>
                  <Input
                    type="password"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1">Project ID</label>
                    <Input
                      type="text"
                      placeholder="my-party-app"
                      value={projectId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProjectId(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1">Auth Domain</label>
                    <Input
                      type="text"
                      placeholder="my-party-app.firebaseapp.com"
                      value={authDomain}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuthDomain(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1">Storage Bucket</label>
                    <Input
                      type="text"
                      placeholder="my-party-app.appspot.com"
                      value={storageBucket}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStorageBucket(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-400 block mb-1">Messaging Sender ID</label>
                    <Input
                      type="text"
                      placeholder="8492049102"
                      value={messagingSenderId}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessagingSenderId(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">App ID</label>
                  <Input
                    type="text"
                    placeholder="1:84920:web:93849f2b"
                    value={appId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAppId(e.target.value)}
                    className="bg-zinc-950 border-zinc-800 text-xs"
                  />
                </div>

                <DialogFooter className="pt-4 flex sm:justify-between gap-2">
                  {dbConfigured && (
                    <Button type="button" variant="destructive" onClick={handleClearConfig} className="text-xs uppercase font-bold">
                      Clear Configuration
                    </Button>
                  )}
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-xs uppercase font-bold px-6">
                    Save and Initialize
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" onClick={onLogout} className="text-xs text-zinc-400 hover:text-red-400 hover:bg-red-950/20 px-3 h-8">
            Logout
          </Button>
        </div>
      </header>

      {/* Main card box */}
      <main className="flex-grow flex items-center justify-center py-8 z-10">
        <Card className="w-full max-w-md bg-zinc-900/60 border-zinc-800/80 backdrop-blur-md shadow-2xl relative">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2 text-zinc-500">
              <div className="flex items-center gap-1 bg-zinc-800/50 border border-zinc-700/50 px-3 py-1 rounded-full text-xs font-bold text-zinc-300">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>{username}</span>
              </div>
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
              Enter The Arena
            </CardTitle>
            <CardDescription className="text-zinc-400 text-xs mt-1">
              Join an existing chip showdown or create a new one to host on a TV
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Party Code / Showdown ID
                </label>
                <button
                  onClick={handleGenerateRoom}
                  className="text-[10px] uppercase font-bold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 focus:outline-none"
                >
                  <RefreshCw className="w-3 h-3" /> Generate Code
                </button>
              </div>
              <Input
                type="text"
                placeholder="e.g. SPICY-772 or JULY4TH"
                value={partyCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPartyCode(e.target.value.toUpperCase())}
                maxLength={20}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-700 text-center font-bold tracking-widest text-lg uppercase focus:border-red-500 focus:ring-red-500"
              />
            </div>

            {error && (
              <p className="text-center text-xs font-semibold text-red-400 py-1 bg-red-950/20 rounded border border-red-900/30">
                {error}
              </p>
            )}

            {!dbConfigured && (
              <div className="p-3 rounded-lg bg-yellow-950/20 border border-yellow-900/40 text-yellow-400/90 text-[11px] leading-relaxed flex items-start gap-2">
                <Settings className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold">Notice:</span> Firebase is not configured. The app will sync scores locally via guest QR code scanning (perfectly fine for manual hosting!). Open Database Settings (cog icon) to activate live real-time sync.
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-2.5">
            <Button
              onClick={() => handleAction(false)}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-extrabold uppercase tracking-wider py-6 shadow-lg shadow-red-950/20 flex items-center justify-center gap-2 group"
            >
              <Play className="w-4 h-4 group-hover:scale-125 transition-transform" /> Vote in Showdown
            </Button>
            
            <Button
              onClick={() => handleAction(true)}
              variant="outline"
              className="w-full border-zinc-800 hover:border-zinc-700 bg-zinc-950/50 hover:bg-zinc-950/80 text-zinc-300 hover:text-zinc-50 font-bold uppercase tracking-wider py-6 flex items-center justify-center gap-2"
            >
              <Tv className="w-4 h-4" /> Host Leaderboard (TV Cast)
            </Button>
          </CardFooter>
        </Card>
      </main>

      {/* Footer bar */}
      <footer className="text-center z-10 py-4 border-t border-zinc-900/50 max-w-4xl mx-auto w-full">
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
          Created for the Ultimate July 4th Chips Crunch-Off 🇺🇸
        </p>
      </footer>
    </div>
  );
};
