import React, { useEffect, useState } from "react";
import { useApi } from "../lib/api";
import { formatCost, formatDate } from "../lib/utils";
import { ImageIcon, Video } from "lucide-react";

export default function History() {
  const { fetchWithToken } = useApi();
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchWithToken("/api/history");
        setHistory(data.history || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchWithToken]);

  const filteredHistory = history.filter(h => filter === "all" || h.type === filter);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Generation History</h1>
          <p className="text-zinc-400">View and manage your past generations.</p>
        </div>
        
        <div className="flex bg-zinc-900 border border-[var(--color-border-dark)] rounded-[8px] p-1">
          {["all", "image", "video"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-[6px] text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-[var(--color-surface)] text-white shadow-sm border border-[var(--color-border-dark)]"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="border border-dashed border-[var(--color-border-dark)] rounded-lg min-h-[300px] flex flex-col items-center justify-center text-zinc-500 p-8">
           <ImageIcon className="w-12 h-12 mb-4 opacity-30" />
           <p className="text-center font-medium">No generations found.</p>
           <p className="text-sm mt-1 mb-6">Create your first image or video to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item) => (
            <div key={item.id} className="bg-[var(--color-surface)] border border-[var(--color-border-dark)] rounded-lg overflow-hidden flex flex-col">
               <div className="relative aspect-video bg-zinc-950 flex items-center justify-center">
                 {item.status === "completed" && item.result_url ? (
                   item.type === "image" ? (
                     <img src={item.result_url} alt="" className="w-full h-full object-contain" />
                   ) : (
                     <video src={item.result_url} className="w-full h-full object-contain" muted playsInline />
                   )
                 ) : (
                   <div className="text-zinc-600">
                     {item.type === "image" ? <ImageIcon className="w-8 h-8" /> : <Video className="w-8 h-8" />}
                   </div>
                 )}
                 <div className="absolute top-3 right-3 flex gap-2">
                   {item.status === "processing" || item.status === "pending" ? (
                     <span className="bg-amber-500/20 text-amber-500 border border-amber-500/50 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-sm flex items-center gap-1.5 backdrop-blur-md">
                       <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                       Processing
                     </span>
                   ) : item.status === "failed" ? (
                      <span className="bg-red-500/20 text-red-500 border border-red-500/50 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-sm backdrop-blur-md">
                       Failed
                     </span>
                   ) : (
                     <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-sm backdrop-blur-md">
                       Completed
                     </span>
                   )}
                 </div>
               </div>
               
               <div className="p-4 flex flex-col flex-1 bg-[var(--color-background)]">
                 <p className="text-sm text-[#a1a1aa] italic font-serif mb-1 line-clamp-2">"{item.prompt}"</p>
                 <div className="mt-auto pt-4 flex items-center justify-between text-xs text-[#52525b] font-medium font-mono">
                   <span>{item.type === "image" ? "Nano Banana" : "Kling 2.1 Pro"}</span>
                   <span className="flex items-center gap-3">
                     <span>{formatCost(item.cost_usd)}</span>
                     <span>{formatDate(item.created_at)}</span>
                   </span>
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
