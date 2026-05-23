import { supabase } from "./db.js";

const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY;

export async function submitTask(model: string, input: any) {
  const KIE_AI_API_KEY = (process.env.KIE_AI_API_KEY || process.env.KIE_API_KEY)?.trim();
  if (!KIE_AI_API_KEY) throw new Error("KIE_AI_API_KEY is not configured in your AI Studio Secrets.");

  const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KIE_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      callBackUrl: null,
      input,
    }),
  });

  const data = await response.json();
  if (data.code !== 200) {
    let msg = data.msg || "Failed to submit task to kie.ai";
    if (msg.includes("Unauthorized") || msg.includes("Authentication failed")) {
      msg = "Authentication failed. Please verify your KIE_AI_API_KEY in the AI Studio Settings (Secrets).";
    }
    throw new Error(msg);
  }

  return data.data.taskId;
}

export async function pollTask(taskId: string) {
  const KIE_AI_API_KEY = (process.env.KIE_AI_API_KEY || process.env.KIE_API_KEY)?.trim();
  if (!KIE_AI_API_KEY) throw new Error("KIE_AI_API_KEY is not configured in your AI Studio Secrets.");

  const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
    headers: {
      Authorization: `Bearer ${KIE_AI_API_KEY}`,
    },
  });

  const data = await response.json();
  if (data.code && data.code !== 200 && (data.msg?.includes("Unauthorized") || data.msg?.includes("Authentication failed"))) {
      data.msg = "Authentication failed. Please verify your KIE_AI_API_KEY in the AI Studio Settings (Secrets).";
  }
  return data;
}
