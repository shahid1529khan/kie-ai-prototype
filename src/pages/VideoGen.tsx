import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi } from "../lib/api";
import { PollingStatus, GenerationResult } from "../components/GenerationComponents";
import { Video as VideoIcon, Upload } from "lucide-react";

export default function VideoGen() {
  const { fetchWithToken } = useApi();
  const [searchParams] = useSearchParams();
  
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("5");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const [status, setStatus] = useState<"idle" | "initializing" | "pending" | "processing" | "completed" | "failed">("idle");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const passedImageUrl = searchParams.get("imageUrl");
    if (passedImageUrl) {
      setImageUrl(passedImageUrl);
    }
  }, [searchParams]);

  const startTimer = () => {
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return interval;
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("File too large. Max size is 5MB.");
        return;
      }
      setUploadedFile(file);
      setImageUrl(URL.createObjectURL(file)); // local preview
      setErrorMsg("");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    if (!imageUrl && !uploadedFile) {
      setErrorMsg("You must provide an image to animate.");
      return;
    }
    
    setStatus("initializing");
    setErrorMsg("");
    setResultUrl(null);
    let currentTimer = startTimer();

    try {
      let finalImageUrl = imageUrl;
      
      // Upload file to get a public URL if user provided a file instead of string
      if (uploadedFile) {
        const formData = new FormData();
        formData.append("file", uploadedFile);
        
        const token = localStorage.getItem("token");
        const uploadRes = await fetch("/api/video/upload", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
        
        const uploadText = await uploadRes.text();
        let uploadData;
        try {
          uploadData = JSON.parse(uploadText);
        } catch (e) {
          throw new Error(`Upload endpoint returned non-JSON: ${uploadText.slice(0, 50)}...`);
        }

        if (!uploadRes.ok) throw new Error(uploadData.error || "Could not upload your image.");
        finalImageUrl = uploadData.url;
      }
      
      setStatus("pending");
      
      // Submit video task
      const data = await fetchWithToken("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, imageUrl: finalImageUrl, duration })
      });
      
      setTaskId(data.taskId);
      setGenerationId(data.generationId);
      setStatus("processing");
      
      // Start polling
      let maxPolls = 60; // 4 minutes max
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
          <div>
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-widest block mb-2">Source Image</label>
            <div className="relative border-2 border-dashed border-[var(--color-border-dark)] rounded-[8px] bg-[var(--color-surface)] overflow-hidden transition-colors hover:border-[var(--color-accent)] group">
              {imageUrl ? (
                 <div className="relative w-full aspect-video">
                   <img src={imageUrl} alt="Source" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="text-white text-sm font-medium">Click to replace</span>
                   </div>
                   <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                 </div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-zinc-500">PNG, JPG up to 5MB</p>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              )}
            </div>
            
            <div className="my-3 flex items-center gap-4 text-xs font-medium text-zinc-500">
               <div className="flex-1 border-t border-[var(--color-border-dark)]"></div>
               OR
               <div className="flex-1 border-t border-[var(--color-border-dark)]"></div>
            </div>
            
            <input 
              type="url"
              placeholder="Paste a public image URL..."
              value={!uploadedFile ? imageUrl : ""}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setUploadedFile(null);
              }}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border-dark)] rounded-[8px] px-4 py-2 text-sm text-white focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-widest block mb-2">Motion Prompt</label>
            <textarea
              required
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border-dark)] rounded-lg p-4 text-sm text-white focus:outline-none focus:border-[var(--color-accent)] transition-colors resize-none"
              placeholder="Describe how the image should move..."
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-widest">Duration</label>
              <span className="text-[10px] text-[#52525b]">Kling 2.1 Pro</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "5", label: "5 seconds", cost: "$0.25", credits: "50" },
                { val: "10", label: "10 seconds", cost: "$0.50", credits: "100" }
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDuration(opt.val)}
                  className={`py-3 px-3 rounded text-left transition-colors flex flex-col border ${
                    duration === opt.val
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold"
                      : "border-[var(--color-border-dark)] bg-[var(--color-surface)] text-[#a1a1aa] hover:bg-white/5"
                  }`}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs opacity-70 mt-1">{opt.credits} cr / {opt.cost}</span>
                </button>
              ))}
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
              disabled={status !== "idle" && status !== "completed" && status !== "failed"}
              className="w-full py-4 bg-[var(--color-accent)] text-black font-bold rounded-lg hover:bg-[#059669] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {status !== "idle" && status !== "completed" && status !== "failed" ? "Processing..." : "Generate Video"}
            </button>
          </div>
        </form>
      </div>
      
      <div className="flex-1 bg-[#111111] p-12 flex flex-col items-center justify-center relative overflow-y-auto">
         {status === "idle" && !resultUrl && (
           <div className="border border-dashed border-[var(--color-border-dark)] rounded-xl w-full max-w-lg aspect-square flex flex-col items-center justify-center text-[#52525b] p-8 bg-[#141414]/50">
             <VideoIcon className="w-12 h-12 mb-4 opacity-50 text-[var(--color-accent)]" />
             <p className="text-sm font-medium text-center">Your generated video will appear here.</p>
           </div>
         )}
         
         {(status !== "idle" && status !== "completed" && status !== "failed") && (
           <PollingStatus status={status as any} type="video" elapsedSeconds={elapsed} />
         )}
         
         {(status === "completed" || status === "failed") && resultUrl && (
           <div className="w-full max-w-lg flex flex-col items-center">
             <GenerationResult 
                url={resultUrl} 
                type="video" 
             />
             <div className="mt-8 flex justify-center gap-8 w-full">
               <div className="flex flex-col items-center">
                  <span className="text-[10px] text-[#52525b] uppercase font-bold tracking-widest mb-1">Estimated Cost</span>
                  <span className="text-lg font-mono text-white">{duration === "5" ? "$0.25" : "$0.50"} <span className="text-[10px] text-[#a1a1aa]">({duration === "5" ? "50" : "100"} Credits)</span></span>
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
