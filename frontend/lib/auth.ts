import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, TOKEN_KEY, USER_KEY, addAuthListener, notifyAuthChange, clearApiCache } from "./api";

export type FimUser = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  initials: string;
  verified?: boolean;
  premium?: boolean;
};

export async function getCurrentUser(): Promise<FimUser | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as FimUser) : null;
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string): Promise<FimUser> {
  const data = await apiFetch("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  clearApiCache();  // Invalidate cached token so next request picks up the new one
  notifyAuthChange();
  return data.user;
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  phone?: string
): Promise<FimUser> {
  const data = await apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password, phone }),
  });

  await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
  notifyAuthChange();
  return data.user;
}

export async function resendVerification(email: string): Promise<void> {
  await apiFetch("/api/auth/resend", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyEmail(email: string, code: string): Promise<FimUser> {
  const user = await apiFetch<FimUser>("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });

  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthChange();
  return user;
}

export async function signOut() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
  clearApiCache();  // Clear cached token on logout
  notifyAuthChange();
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch("/api/auth/request-reset", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<FimUser> {
  const user = await apiFetch<FimUser>("/api/auth/reset", {
    method: "POST",
    body: JSON.stringify({ email, code, new_password: newPassword }),
  });

  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthChange();
  return user;
}

export function useAuth() {
  const [user, setUser] = useState<FimUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const storedUser = await getCurrentUser();
      if (active) {
        setUser(storedUser);
        setReady(true);
      }
    }

    loadUser();

    const unsubscribe = addAuthListener(() => {
      loadUser();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { user, ready };
}
