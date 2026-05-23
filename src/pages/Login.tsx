import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useApi } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Login failed");
      
      login(data.token, data.user);
      navigate("/dashboard/image");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="max-w-md w-full bg-[var(--color-surface)] border border-[var(--color-border-dark)] rounded-[8px] p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center">
            <LogIn className="text-[var(--color-accent)] w-6 h-6" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">Welcome back</h2>
        <p className="text-zinc-400 text-center mb-8">Sign in to continue to Kie.ai Prototyping</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-[6px] p-3 mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Email address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-[var(--color-border-dark)] rounded-[8px] px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-[var(--color-border-dark)] rounded-[8px] px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[var(--color-accent)] hover:bg-[#0e9f6e] text-white font-medium py-2.5 rounded-[6px] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        
        <p className="mt-6 text-center text-zinc-400 text-sm">
          Don't have an account? <Link to="/register" className="text-[var(--color-accent)] hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
