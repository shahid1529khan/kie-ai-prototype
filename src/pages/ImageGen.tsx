import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../lib/api";
import { PollingStatus, GenerationResult } from "../components/GenerationComponents";
import { ImageIcon } from "lucide-react";

export default function ImageGen() {
  const { fetchWithToken } = useApi();
  const navigate = useNavigate();
  
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [status, setStatus] = useState<"idle" | "pending" | "processing" | "completed" | "failed">("idle");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);

  const startTimer = () => {
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return interval;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setStatus("pending");
    setErrorMsg("");
    setResultUrl(null);
    let currentTimer = startTimer();

    try {
      const data = await fetchWithToken("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, image_size: aspectRatio })
      });
      
      setTaskId(data.taskId);
      setGenerationId(data.generationId);
      setStatus("processing");
      
      // Start polling
      let maxPolls = 15;
      let polls = 0;
      
      const pollInterval = setInterval(async () => {
        polls++;
        if (polls > maxPolls) {
          clearInterval(pollInterval);
          clearInterval(currentTimer);
          setStatus("failed");
          setErrorMsg("Generation is taking longer than expected. Check your history in a few minutes.");
          return;
        }

        try {
          const pollData = await fetchWithToken(`/api/task/${data.taskId}?generationId=${data.generationId}`);
          if (pollData.status === "completed") {
            clearInterval(pollInterval);
            clearInterval(currentTimer);
            setResultUrl(pollData.resultUrl);
            setStatus("completed");
          } else if (pollData.status === "failed") {
            clearInterval(pollInterval);
            clearInterval(currentTimer);
            setStatus("failed");
            setErrorMsg(pollData.error || "Generation failed.");
          }
        } catch (err: any) {
             clearInterval(pollInterval);
             clearInterval(currentTimer);
             setStatus("failed");
             setErrorMsg(err.message || "Polling failed.");
        }
      }, 4000);
      
    } catch (err: any) {
      clearInterval(currentTimer);
      setStatus("failed");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full h-full">
      <div className="w-full md:w-[400px] border-r border-[var(--color-border-dark)] p-8 flex flex-col gap-6 bg-[var(--color-background)] shrink-0 overflow-y-auto">
        <form onSubmit={handleGenerate} className="flex flex-col gap-6 h-full">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-widest">Prompt</label>
            <textarea
              required
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border-dark)] rounded-lg p-4 text-sm text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
              placeholder="Describe your vision... e.g. 'A futuristic metropolis under a violet sun...'"
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-widest">Settings</label>
              <span className="text-[10px] text-[#52525b]">Nano Banana v1.2</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["1:1", "16:9", "9:16"].map((ratio) => {
                const labels: any = { "1:1": "1:1 Square", "16:9": "16:9 Cinema", "9:16": "9:16 Portrait" };
                return (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 text-[10px] border rounded transition-colors ${
                      aspectRatio === ratio
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold"
                        : "border-[var(--color-border-dark)] bg-[var(--color-surface)] text-[#a1a1aa] hover:bg-white/5"
                    }`}
                  >
                    {labels[ratio]}
                  </button>
                )
              })}
            </div>
          </div>
          
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs font-medium rounded-lg p-4 mt-2">
              {errorMsg}
            </div>
          )}

          <div className="mt-auto pt-8">
            <button
              type="submit"
              disabled={status === "pending" || status === "processing"}
              className="w-full py-4 bg-[var(--color-accent)] text-black font-bold rounded-lg hover:bg-[#059669] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {status === "pending" || status === "processing" ? "Generating..." : "Generate Image"}
            </button>
          </div>
        </form>
      </div>
      
      <div className="flex-1 bg-[#111111] p-12 flex flex-col items-center justify-center relative overflow-y-auto">
         {status === "idle" && !resultUrl && (
           <div className="border border-dashed border-[var(--color-border-dark)] rounded-xl w-full max-w-lg aspect-square flex flex-col items-center justify-center text-[#52525b] p-8 bg-[#141414]/50">
             <ImageIcon className="w-12 h-12 mb-4 opacity-50 text-[var(--color-accent)]" />
             <p className="text-sm font-medium">Your generated image will appear here.</p>
           </div>
         )}
         
         {(status === "pending" || status === "processing") && (
           <PollingStatus status={status} type="image" elapsedSeconds={elapsed} />
         )}
         
         {(status === "completed" || status === "failed") && resultUrl && (
           <div className="w-full max-w-lg flex flex-col items-center">
             <GenerationResult 
                url={resultUrl} 
                type="image" 
                onAnimate={(imgUrl) => navigate(`/dashboard/video?imageUrl=${encodeURIComponent(imgUrl)}`)} 
             />
             <div className="mt-8 flex justify-center gap-8 w-full">
               <div className="flex flex-col items-center">
                  <span className="text-[10px] text-[#52525b] uppercase font-bold tracking-widest mb-1">Estimated Cost</span>
                  <span className="text-lg font-mono text-white">$0.02 <span className="text-[10px] text-[#a1a1aa]">(4 Credits)</span></span>
               </div>
               <div className="w-px h-8 bg-[#262626]"></div>
               <div className="flex flex-col items-center">
                  <span className="text-[10px] text-[#52525b] uppercase font-bold tracking-widest mb-1">Task Status</span>
                  <span className="text-lg font-mono text-[var(--color-accent)] capitalize">{status}</span>
               </div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}
