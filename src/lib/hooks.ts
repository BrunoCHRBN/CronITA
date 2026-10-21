import { useEffect, useState, useSyncExternalStore } from "react";

/** Current time, refreshed every `interval` ms while `active`. */
export function useNow(active: boolean, interval = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), interval);
    const onVisible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, interval]);
  return now;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
  );
}

export type Route = "cronometro" | "materias";

function readRoute(): Route {
  return window.location.hash === "#/materias" ? "materias" : "cronometro";
}

/** Minimal hash router so a reload keeps the current screen. */
export function useRoute(): [Route, (r: Route) => void] {
  const route = useSyncExternalStore(
    (cb) => {
      window.addEventListener("hashchange", cb);
      return () => window.removeEventListener("hashchange", cb);
    },
    readRoute,
  );
  const navigate = (r: Route) => {
    window.location.hash = `#/${r}`;
  };
  return [route, navigate];
}
