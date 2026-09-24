export const getApiBaseUrl = (): string => {
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  // If explicitly set and non-empty, use it
  if (envUrl !== undefined && envUrl !== "") {
    return envUrl;
  }
  // By default in browser, return empty string so Vite proxy forwards /api to backend
  return "";
};

export const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  // Attach stored JWT/session token if present
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("reys_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // If body is not FormData, default to application/json
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (networkErr: any) {
    throw new ApiError(
      0,
      "Server bilan aloqa o'rnatilmadi (Internet yoki server o'chiq bo'lishi mumkin)",
      networkErr
    );
  }

  if (!response.ok) {
    let errorDetail = response.statusText;
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData?.detail) {
        errorDetail = errorData.detail;
      }
    } catch {
      // not json
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  // Handle 204 or empty response
  if (response.status === 204) {
    return null as any;
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text() as any;
}
