import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export default function Landing() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard/image" />;

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight">
          Generate. <span className="text-[var(--color-accent)]">Animate.</span> Create.
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
          The ultimate platform for AI fluid image and video generation using the powerful Nano Banana and Kling 2.1 Pro models.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link 
            to="/register" 
            className="w-full sm:w-auto px-8 py-3.5 rounded-[6px] bg-[var(--color-accent)] hover:bg-[#0e9f6e] text-white font-semibold transition-colors text-lg"
          >
            Get started
          </Link>
          <Link 
            to="/login" 
            className="w-full sm:w-auto px-8 py-3.5 rounded-[6px] bg-zinc-800 hover:bg-zinc-700 text-white font-semibold transition-colors text-lg"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
