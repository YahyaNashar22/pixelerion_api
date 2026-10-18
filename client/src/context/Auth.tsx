import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api, APIError, send } from "../lib/api";

import type { User } from "../lib/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const Context = createContext<AuthState | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      setUser(await api<User>("/me"));
      setError("");
    } catch (e) {
      setUser(null);
      if (!(e instanceof APIError && e.status === 401))
        setError(e instanceof Error ? e.message : "Unable to connect");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function login(identifier: string, password: string) {
    const account = await send<User>("/auth/login", { identifier, password });
    setUser(account);
    return account;
  }

  async function logout() {
    await send("/auth/logout", {});
    setUser(null);
  }

  return (
    <Context.Provider value={{ user, loading, error, refresh, login, logout }}>
      {children}
    </Context.Provider>
  );
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider required");
  return value;
}
