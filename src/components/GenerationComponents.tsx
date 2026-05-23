import React from "react";
import { Loader2 } from "lucide-react";

export function PollingStatus({ status, type, elapsedSeconds }: { status: "pending" | "processing" | "initializing"; type: "image" | "video"; elapsedSeconds: number }) {
  
  const getMessage = () => {
    if (type === "video") {
      if (status === "initializing") return "Uploading image...";
      if (status === "pending") return "Submitting to Kling...";
      if (elapsedSeconds > 45) return "Finalising...";
      return "Generating video (this takes 1-3 minutes)...";
    } else {
      if (status === "pending") return "Submitting to Nano Banana...";
      if (elapsedSeconds > 10) return "Almost done...";
      return "Generating your image...";
    }
  };

  const expectedDuration = type === "video" ? 120 : 15;
  const progressPercent = Math.min((elapsedSeconds / expectedDuration) * 100, 95); // hold at 95%

  return (
    <div className="border border-[var(--color-border-dark)] bg-[var(--color-surface)] rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px]">
      <Loader2 className="w-8 h-8 text-[var(--color-accent)] animate-spin mb-4" />
      <p className="text-zinc-300 font-medium mb-1">{getMessage()}</p>
      <p className="text-zinc-500 text-sm mb-6">Elapsed: {elapsedSeconds}s</p>
      
      <div className="w-full max-w-xs bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-[var(--color-accent)] h-full transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export function GenerationResult({ 
  url, 
  type, 
  onAnimate 
}: { 
  url: string; 
  type: "image" | "video";
  onAnimate?: (url: string) => void;
}) {
  return (
    <div className="w-full max-w-lg aspect-square rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-dark)] shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 justify-between z-10 pointer-events-none">
         <a 
          href={url} 
          target="_blank" 
          rel="noreferrer"
          className="bg-white text-black px-4 py-2 rounded-md text-xs font-bold pointer-events-auto transition-transform hover:scale-105"
        >
          Download {type === "image" ? "PNG" : "MP4"}
        </a>
        {type === "image" && onAnimate && (
          <button 
            onClick={() => onAnimate(url)}
            className="bg-[var(--color-accent)] text-black px-4 py-2 rounded-md text-xs font-bold pointer-events-auto transition-transform hover:scale-105"
          >
            Animate to Video
          </button>
        )}
      </div>
      <div className="w-full h-full flex items-center justify-center bg-[var(--color-background)]">
        {type === "image" ? (
          <img src={url} alt="Generated" className="w-full h-full object-contain" />
        ) : (
          <video src={url} controls className="w-full h-full object-contain" autoPlay loop playsInline />
        )}
      </div>
    </div>
  );
}
