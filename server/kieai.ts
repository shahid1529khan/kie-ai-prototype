const getApiKey = () => {
  const key = (process.env.KIE_AI_API_KEY || process.env.KIE_API_KEY)?.trim();
  if (!key) throw new Error("KIE_AI_API_KEY is not configured.");
  return key;
};

export async function submitTask(model: string, input: any) {
  const key = getApiKey();

  const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model, callBackUrl: null, input }),
  });

  const data = await response.json();

  if (data.code !== 200) {
    let msg = data.msg || "Failed to submit task to kie.ai";
    if (msg.includes("Unauthorized") || msg.includes("Authentication failed")) {
      msg = "Authentication failed. Please verify your KIE_AI_API_KEY.";
    }
    throw new Error(msg);
  }

  return data.data.taskId;
}

export async function pollTask(taskId: string): Promise<{
  state: string;
  resultUrl: string | null;
  errorMsg: string | null;
  raw: any;
}> {
  const key = getApiKey();

  const response = await fetch(
    `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
    { headers: { Authorization: `Bearer ${key}` } }
  );

  const data = await response.json();

  if (data.code !== 200) {
    throw new Error(data.msg || "kie.ai returned a non-200 code from recordInfo");
  }

  const taskData = data.data;

  // CORRECT field is "state" — NOT "status"
  const state: string = (taskData?.state ?? "").toLowerCase();

  let resultUrl: string | null = null;
  if (state === "success") {
    // Result is a STRINGIFIED JSON: '{"resultUrls":["https://..."]}'
    try {
      const parsed = JSON.parse(taskData.resultJson ?? "{}");
      resultUrl = parsed.resultUrls?.[0] ?? null;
    } catch {
      resultUrl = taskData.resultUrl ?? taskData.image_url ?? taskData.video_url ?? null;
    }
  }

  // Failure reason is in "failMsg" — NOT "error"
  const errorMsg: string | null =
    state === "fail"
      ? taskData?.failMsg || taskData?.failCode || "Generation failed"
      : null;

  return { state, resultUrl, errorMsg, raw: data };
}
