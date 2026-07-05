import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "./ui/button";
import { X, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import type { VoteData } from "../services/firebase";

interface TallyScannerProps {
  onScanComplete: (room: string, user: string, votes: VoteData) => void;
  onClose: () => void;
}

export const TallyScanner: React.FC<TallyScannerProps> = ({ onScanComplete, onClose }) => {
  const [scanError, setScanError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    const targetElementId = "offline-qr-reader-viewport";

    const startScanner = () => {
      try {
        scanner = new Html5QrcodeScanner(
          targetElementId,
          {
            fps: 15,
            qrbox: { width: 220, height: 220 },
            aspectRatio: 1.0,
          },
          /* verbose= */ false
        );

        const onScanSuccess = (decodedText: string) => {
          try {
            const parsed = JSON.parse(decodedText);
            
            // Validate format
            if (parsed && parsed.r && parsed.u && parsed.v) {
              playBeepSound();
              setSuccessMsg(`Successfully scanned votes for "${parsed.u}"!`);
              
              setTimeout(() => {
                onScanComplete(parsed.r, parsed.u, parsed.v);
              }, 1200);
            } else {
              setScanError("Scanned QR code is not a valid votes payload.");
            }
          } catch (err) {
            setScanError("Failed to read scanned QR code data. Make sure it is a Crunch Showdown QR.");
          }
        };

        const onScanFailure = (_error: string) => {
          // Quietly ignore scan errors
        };

        scanner.render(onScanSuccess, onScanFailure);
      } catch (e: any) {
        console.error("Failed to render scanner:", e);
        setScanError("Failed to initialize scanner view: " + (e?.message || String(e)));
      }
    };

    // Request camera permission explicitly first
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          // Release camera stream immediately so scanner can request it cleanly
          stream.getTracks().forEach((track) => track.stop());
          setPermissionState("granted");
          startScanner();
        })
        .catch((err) => {
          console.error("Camera permission denied:", err);
          setPermissionState("denied");
          setScanError("Camera access denied. Tap the lock icon in the browser URL bar to allow camera access.");
        });
    } else {
      setPermissionState("denied");
      setScanError("Camera device is not supported or accessible in this browser.");
    }

    return () => {
      if (scanner) {
        scanner.clear().catch((err) => {
          console.error("Error clearing QR scanner:", err);
        });
      }
    };
  }, [onScanComplete]);

  // Synthesize a cashier-like success beep using the browser Web Audio API!
  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.value = 1000; // Frequency in Hz (high-pitched beep)
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Low volume
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15); // Beep duration 0.15s
    } catch (e) {
      console.warn("Web Audio API not supported or user gesture required:", e);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-2 relative bg-zinc-900 text-zinc-100 rounded-xl">
      {permissionState === "prompt" && (
        <div className="p-3 bg-blue-950/20 border border-blue-900/30 text-blue-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 w-full animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Requesting camera permission...</span>
        </div>
      )}

      {/* Scanner Viewport */}
      <div 
        id="offline-qr-reader-viewport" 
        className={`w-full max-w-[320px] aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-inner relative ${permissionState !== "granted" ? "hidden" : ""}`}
      >
        {/* Simple overlay grid target layout */}
        <div className="absolute inset-0 border-[2px] border-dashed border-red-500/20 pointer-events-none rounded-xl"></div>
      </div>

      {scanError && (
        <div className="p-3 bg-red-950/30 border border-red-800/40 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1.5 w-full">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{scanError}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1.5 w-full justify-center animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <Button
        onClick={onClose}
        variant="secondary"
        className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-wider text-xs h-10 gap-1.5"
      >
        <X className="w-3.5 h-3.5" /> Close Scanner
      </Button>
    </div>
  );
};
