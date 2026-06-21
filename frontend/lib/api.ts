import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
// @ts-ignore
import { router } from "expo-router";

const getApiUrl = () => {
  // Resolve host IP dynamically during Expo development so real devices can communicate with the backend
  const debuggerHost = Constants.expoConfig?.hostUri;
  const host = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
  return `http://${host}:8000`;
};

export const API_URL = getApiUrl();
export const TOKEN_KEY = "fim.auth.token";
export const USER_KEY = "fim.auth.user";

// Auth change listener system
type Listener = () => void;
const listeners = new Set<Listener>();
export function addAuthListener(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
export function notifyAuthChange() {
  listeners.forEach(l => l());
}

export async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const customUrl = await AsyncStorage.getItem("fim.api.url");
  const baseUrl = customUrl || API_URL;
  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const headers = new Headers(options.headers || {});
  
  headers.set("Bypass-Tunnel-Reminder", "true");
  
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    // 30-second timeout — needed for AI endpoints (Gemini) which can take a few seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    response = await fetch(url, { ...options, headers, signal: controller.signal });
    clearTimeout(timeoutId);
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.error(`Request to ${url} timed out after 30s`);
      throw new Error("Request timed out. Please try again.");
    }
    console.error(`Fetch error on ${url}:`, error);
    throw new Error("Network request failed. Please check your backend connection.");
  }

  if (!response.ok) {
    if (response.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      notifyAuthChange();
      router.replace("/(auth)/auth");
    }
    let errorMsg = "Something went wrong";
    try {
      const data = await response.json();
      errorMsg = data.detail || data.message || errorMsg;
    } catch { /* not JSON */ }
    throw new Error(errorMsg);
  }

  const ct = response.headers.get("content-type");
  if (response.status === 204 || (ct && !ct.includes("application/json"))) {
    return {} as T;
  }

  return response.json();
}
