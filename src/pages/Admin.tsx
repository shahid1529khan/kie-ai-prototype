import React, { useEffect, useState } from "react";
import { useApi } from "../lib/api";
import { formatCost } from "../lib/utils";
import { Users, CreditCard, ImageIcon, Activity } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";

export default function Admin() {
  const { user } = useAuth();
  const { fetchWithToken } = useApi();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorString, setErrorString] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    
    const loadStats = async () => {
      try {
        const data = await fetchWithToken("/api/admin/stats");
        setStats(data);
      } catch (err: any) {
        setErrorString(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [fetchWithToken, user]);

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard/image" />;
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"></div></div>;
  if (errorString) return <div className="p-8 text-red-500">Error: {errorString}</div>;
  if (!stats) return null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-zinc-400">Platform overview and user analytics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Total Generations", value: stats.totalGenerations, icon: ImageIcon },
          { label: "Total Spend (USD)", value: formatCost(stats.totalSpend), icon: CreditCard },
          { label: "Active Users", value: stats.activeUsers, icon: Users },
          { label: "Generations Today", value: stats.generationsToday || 0, icon: Activity },
        ].map((stat, i) => (
          <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border-dark)] rounded-lg p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-zinc-400">{stat.label}</p>
              <stat.icon className="w-5 h-5 text-zinc-600" />
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border-dark)] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--color-border-dark)]">
          <h2 className="text-lg font-bold text-white">User Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-900 border-b border-[var(--color-border-dark)] text-xs uppercase font-semibold text-zinc-300">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-right">Images</th>
                <th className="px-6 py-4 text-right">Videos</th>
                <th className="px-6 py-4 text-right">Total Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-[var(--color-border-dark)]">
              {stats.userBreakdown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">No active users found.</td>
                </tr>
              )}
              {stats.userBreakdown.map((u: any, i: number) => (
                <tr key={u.id} className={i % 2 === 0 ? "bg-[var(--color-surface)]" : "bg-zinc-900/40"}>
                  <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4 text-right">{u.imagesGenerated}</td>
                  <td className="px-6 py-4 text-right">{u.videosGenerated}</td>
                  <td className="px-6 py-4 text-right font-medium text-[var(--color-accent)]">{formatCost(u.totalSpend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
