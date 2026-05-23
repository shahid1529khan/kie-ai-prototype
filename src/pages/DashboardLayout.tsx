import React from "react";
import { Link, Outlet, useLocation, Navigate } from "react-router-dom";
import { Image as ImageIcon, Video, History, LogOut, Settings } from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { cn } from "../lib/utils";

export default function DashboardLayout() {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div className="min-h-screen bg-[var(--color-background)]"></div>;
  if (!user) return <Navigate to="/login" replace />;

  const navigation = [
    { name: "Image Generation", href: "/dashboard/image", icon: ImageIcon },
    { name: "Video Generation", href: "/dashboard/video", icon: Video },
    { name: "History", href: "/dashboard/history", icon: History },
  ];

  if (user.role === "admin") {
    navigation.push({ name: "Admin Dashboard", href: "/admin", icon: Settings });
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col md:flex-row font-sans">
      <aside className="w-full md:w-[240px] bg-[var(--color-surface)] border-r border-[var(--color-border-dark)] flex flex-col shrink-0 flex-none pb-4 md:pb-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-[var(--color-accent)] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">KieGen AI</span>
          </div>
          
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "text-[#a1a1aa] hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-[var(--color-border-dark)] md:border-t-0">
          <div className="bg-[var(--color-background)] border border-[var(--color-border-dark)] p-4 rounded-lg mb-4 hidden md:block">
            <p className="text-[10px] uppercase tracking-wider text-[#52525b] font-bold mb-2">Usage Summary</p>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#a1a1aa]">Images</span>
              <span className="text-white">142 / 500</span>
            </div>
            <div className="w-full bg-[#262626] h-1.5 rounded-full">
              <div className="bg-[var(--color-accent)] h-1.5 rounded-full" style={{ width: '28%' }}></div>
            </div>
            <div className="flex justify-between text-xs mt-3 mb-1">
              <span className="text-[#a1a1aa]">Videos</span>
              <span className="text-white">12 / 20</span>
            </div>
            <div className="w-full bg-[#262626] h-1.5 rounded-full">
              <div className="bg-[var(--color-accent)] h-1.5 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-[#a1a1aa] hover:bg-white/5 transition-colors border-t border-[#262626] md:pt-4 md:mt-4"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 overflow-auto bg-[var(--color-background)]">
        <header className="h-16 border-b border-[var(--color-border-dark)] hidden md:flex items-center justify-between px-8 bg-[var(--color-background)] shrink-0">
          <h1 className="text-sm font-semibold text-[#a1a1aa]">
            Dashboard / <span className="text-white capitalize">{location.pathname.split('/').pop()}</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-medium text-white">{user.name}</p>
              <p className="text-[10px] text-[var(--color-accent)]">{user.role === 'admin' ? 'Admin' : 'Pro Tier'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center font-bold text-black text-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
