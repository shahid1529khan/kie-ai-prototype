import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../lib/auth-context";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Registration failed");
      
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
            <UserPlus className="text-[var(--color-accent)] w-6 h-6" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">Create an account</h2>
        <p className="text-zinc-400 text-center mb-8">Start generating images and videos with kie.ai</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded-[6px] p-3 mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
           <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Full name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-[var(--color-border-dark)] rounded-[8px] px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-colors"
              placeholder="Jane Doe"
            />
          </div>
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
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        
        <p className="mt-6 text-center text-zinc-400 text-sm">
          Already have an account? <Link to="/login" className="text-[var(--color-accent)] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
