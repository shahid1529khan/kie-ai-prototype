import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { createServer as createViteServer } from "vite";
import { supabase, isSupabaseConfigured } from "./server/db.js";
import { signToken, verifyToken } from "./server/auth.js";
import { submitTask, pollTask } from "./server/kieai.js";

// Use memory storage for uploads before forwarding to Kie.ai
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Missing authorization header" });

    const token = authHeader.split(" ")[1];
    const user = verifyToken(token);
    if (!user) return res.status(401).json({ error: "Invalid or expired token" });

    req.user = user;
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin access required" });
    next();
  };


  // --- API Routes ---

  app.post("/api/auth/register", async (req: any, res: any) => {
    try {
      if (!isSupabaseConfigured) {
        return res.status(500).json({ error: "Supabase is not configured. Please add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your AI Studio Secrets (settings menu)." });
      }
      
      const { email, password, name } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });

      const hash = await bcrypt.hash(password, 10);
      const isAdmin = process.env.ADMIN_EMAIL === email;
      const role = isAdmin ? "admin" : "user";

      const { data, error } = await supabase
        .from("users")
        .insert([{ email, password_hash: hash, name, role }])
        .select()
        .single();

      if (error) throw error;
      
      const token = signToken({ id: data.id, email: data.email, role: data.role });
      res.json({ token, user: { id: data.id, email: data.email, name: data.name, role: data.role } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req: any, res: any) => {
    try {
      if (!isSupabaseConfigured) {
        return res.status(500).json({ error: "Supabase is not configured. Please add VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your AI Studio Secrets (settings menu)." });
      }
      
      const { email, password } = req.body;
      const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single();
      
      if (error || !user) return res.status(401).json({ error: "Invalid credentials" });

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

      const token = signToken({ id: user.id, email: user.email, role: user.role });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: any, res: any) => {
    const { data: user } = await supabase.from("users").select("id, email, name, role").eq("id", req.user.id).single();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  });

  // --- Generation Routes ---
  
  app.post("/api/image/generate", authenticate, async (req: any, res: any) => {
    try {
      const { prompt, image_size = "1:1" } = req.body;
      const model = "google/nano-banana";
      
      // Submit to Kie.ai
      const taskId = await submitTask(model, { prompt, output_format: "png", image_size });
      
      // Log to DB
      const { data, error } = await supabase.from("generations").insert([{
        user_id: req.user.id,
        type: "image",
        model,
        prompt,
        task_id: taskId,
        status: "pending",
        credits_used: 4,
        cost_usd: 4 * 0.005
      }]).select().single();

      if (error) throw error;
      res.json({ generationId: data.id, taskId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/video/upload", authenticate, upload.single("file"), async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
      
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("file", blob, req.file.originalname);

      const KIE_AI_API_KEY = (process.env.KIE_AI_API_KEY || process.env.KIE_API_KEY)?.trim();
      if (!KIE_AI_API_KEY) throw new Error("KIE_AI_API_KEY is not configured.");
      const response = await fetch("https://api.kie.ai/api/v1/files/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${KIE_AI_API_KEY}` },
        body: formData as any
      });
      
      const data = await response.json();
      if (data.code !== 200) throw new Error(data.msg || "Upload failed");
      const imageUrl = data.data?.downloadUrl ?? data.data?.url ?? data.data?.fileUrl;
      if (!imageUrl) throw new Error("Upload succeeded but no URL returned by kie.ai");
      res.json({ url: imageUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/video/generate", authenticate, async (req: any, res: any) => {
    try {
      const { prompt, imageUrl, duration = "5" } = req.body;
      const model = "kling/v2-1-pro";
      
      const taskId = await submitTask(model, {
        prompt,
        image_url: imageUrl,
        duration: String(duration),
        negative_prompt: "blur, distort, low quality",
        cfg_scale: 0.5
      });
      
      const credits = duration === "10" ? 100 : 50;

      const { data, error } = await supabase.from("generations").insert([{
        user_id: req.user.id,
        type: "video",
        model,
        prompt,
        source_image_url: imageUrl,
        task_id: taskId,
        status: "pending",
        credits_used: credits,
        cost_usd: credits * 0.005,
        duration_seconds: parseInt(duration, 10)
      }]).select().single();

      if (error) throw error;
      res.json({ generationId: data.id, taskId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/task/:taskId", authenticate, async (req: any, res: any) => {
    try {
      const { taskId } = req.params;
      const { generationId } = req.query;

      const { state, resultUrl, errorMsg } = await pollTask(taskId);

      console.log(`[poll] taskId=${taskId} state=${state} resultUrl=${resultUrl}`);

      if (state === "success") {
        if (generationId && isSupabaseConfigured) {
          await supabase.from("generations").update({
            status: "completed",
            result_url: resultUrl,
            completed_at: new Date().toISOString()
          }).eq("id", generationId as string);
        }
        return res.json({ status: "completed", resultUrl });
      }

      if (state === "fail") {
        if (generationId && isSupabaseConfigured) {
          await supabase.from("generations").update({
            status: "failed",
            error_message: errorMsg
          }).eq("id", generationId as string);
        }
        return res.json({ status: "failed", error: errorMsg || "Generation failed" });
      }

      res.json({ status: "processing" });
    } catch (err: any) {
      console.error("Polling error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/history", authenticate, async (req: any, res: any) => {
    try {
      const { data, error } = await supabase
        .from("generations")
        .select("*")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false })
        .limit(50);
        
      if (error) throw error;
      res.json({ history: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/stats", authenticate, requireAdmin, async (req: any, res: any) => {
    try {
      // Very basic aggregations since we can't use complex raw queries easily via JS without rpc
      const { count: totalGenerations } = await supabase.from("generations").select("*", { count: "exact" });
      
      const { data: allGens } = await supabase.from("generations").select("cost_usd, user_id, type");
      
      let totalSpend = 0;
      const userSpendMap: Record<string, { images: number, videos: number, spend: number }> = {};
      
      if (allGens) {
        allGens.forEach((g) => {
          totalSpend += (g.cost_usd || 0);
          if (!userSpendMap[g.user_id]) userSpendMap[g.user_id] = { images: 0, videos: 0, spend: 0 };
          if (g.type === "image") userSpendMap[g.user_id].images++;
          if (g.type === "video") userSpendMap[g.user_id].videos++;
          userSpendMap[g.user_id].spend += (g.cost_usd || 0);
        });
      }
      
      const activeUsersCount = Object.keys(userSpendMap).length;
      
      const { data: users } = await supabase.from("users").select("id, name, email").in("id", Object.keys(userSpendMap));
      
      const userBreakdown = users?.map(u => ({
        ...u,
        imagesGenerated: userSpendMap[u.id]?.images || 0,
        videosGenerated: userSpendMap[u.id]?.videos || 0,
        totalSpend: userSpendMap[u.id]?.spend || 0
      })).sort((a,b) => b.totalSpend - a.totalSpend) || [];

      res.json({
        totalGenerations: totalGenerations || 0,
        totalSpend,
        activeUsers: activeUsersCount,
        generationsToday: 0, // Simplified for now
        userBreakdown
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Error Middleware ---
  app.use((err: any, req: any, res: any, next: any) => {
    if (req.path.startsWith('/api/')) {
      console.error("API Error middleware caught:", err);
      return res.status(err.status || 500).json({ error: err.message || "An unexpected server error occurred." });
    }
    next(err);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // For Express 4 and React Router SPA fallback
    app.get("*", (req: any, res: any) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
