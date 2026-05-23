import { useAuth } from "./auth-context";

export function useApi() {
  const { token } = useAuth();

  const fetchWithToken = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...(options.headers as any)
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
        let errorMsg = "An error occurred";
        try {
            const text = await response.text();
            try {
              const data = JSON.parse(text);
              if (data.error) errorMsg = data.error;
            } catch (e) {
              errorMsg = `Server returned ${response.status}: ${text.slice(0, 50)}`;
            }
        } catch(e) {}
        throw new Error(errorMsg);
    }
    
    // Attempt to parse JSON safely for ok responses too
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        throw new Error(`Invalid JSON from server API: ${text.slice(0, 50)}...`);
    }
  };

  return { fetchWithToken };
}
