import { useCallback, useEffect, useState } from "react";

/** Load data on mount (and when deps change). Returns { data, loading, error, reload, setData }. */
export default function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await run();
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
  }, [run]);

  useEffect(() => { reload(); }, [reload]);

  const setData = (updater) =>
    setState((s) => ({ ...s, data: typeof updater === "function" ? updater(s.data) : updater }));

  return { ...state, reload, setData };
}
