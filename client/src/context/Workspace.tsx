import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { api, APIError } from "../lib/api";

import type { Workspace } from "../lib/types";

import { useAuth } from "./Auth";

interface State {
  data: Workspace | null;
  loading: boolean;
  error: string;
  client: string;
  selectClient: (id: string) => void;
  refresh: () => Promise<void>;
}

const Context = createContext<State | null>(null);

export default function WorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [data, setData] = useState<Workspace | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [client, selectClient] = useState("");

  const auth = useAuth();

  const refresh = useCallback(async () => {
    try {
      setData(
        await api<Workspace>(
          "/workspace" +
            (client ? "?client_id=" + encodeURIComponent(client) : ""),
        ),
      );
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load your workspace",
      );
      if (e instanceof APIError && e.status === 401) await auth.refresh();
      throw e;
    } finally {
      setLoading(false);
    }
  }, [client, auth.refresh]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setData(null);

    api<Workspace>(
      "/workspace" + (client ? "?client_id=" + encodeURIComponent(client) : ""),
    )
      .then((value) => {
        if (current) {
          setData(value);
          setError("");
        }
      })

      .catch((e) => {
        if (current) setError(e.message);
        if (e instanceof APIError && e.status === 401) void auth.refresh();
      })

      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
    };
  }, [client, auth.refresh]);

  return (
    <Context.Provider
      value={{ data, loading, error, client, selectClient, refresh }}
    >
      {children}
    </Context.Provider>
  );
}

export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error("WorkspaceProvider required");
  return value;
}
