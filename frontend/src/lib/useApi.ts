import axios from "axios";
import { useEffect, useState } from "react";
import { API_URL } from "./api";

interface ApiState<T> {
  data: T | null;
  total: number | null;
  loaded: boolean;
}

/** Lädt `path` (relativ zu /api) aus Strapi; `data` ist null, bis die Antwort da ist oder falls sie fehlschlägt (`loaded` ist dann true). */
export const useApi = <T,>(path: string): ApiState<T> => {
  const [result, setResult] = useState<{ path: string; state: ApiState<T> } | null>(null);

  useEffect(() => {
    let active = true;
    axios
      .get(`${API_URL}/api/${path}`)
      .then((res) => {
        if (active) setResult({ path, state: { data: res.data.data, total: res.data.meta?.pagination?.total ?? null, loaded: true } });
      })
      .catch(() => {
        if (active) setResult({ path, state: { data: null, total: null, loaded: true } });
      });
    return () => {
      active = false;
    };
  }, [path]);

  return result && result.path === path ? result.state : { data: null, total: null, loaded: false };
};
