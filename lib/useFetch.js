'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from './client';

// Loads `url` (skips when null) and exposes loading / error / reload.
export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    setLoading(true);
    setError(null);
    api(url)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [url, tick]);

  const reload = useCallback(() => setTick((x) => x + 1), []);
  return { data, setData, loading, error, reload };
}
