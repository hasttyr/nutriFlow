import { useEffect, useEffectEvent, useState, useSyncExternalStore } from 'react';
import { getClusterState, subscribe } from './cluster';

export const useCluster = () => useSyncExternalStore(subscribe, getClusterState);

// Runs an async request whenever `key` changes and exposes { loading, value, error, retry }.
export const useRemote = (key, request) => {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null });
  const requestKey = `${key}#${attempt}`;
  const run = useEffectEvent(request);

  useEffect(() => {
    let cancelled = false;
    run().then(
      (value) => !cancelled && setResult({ key: requestKey, value }),
      (error) => !cancelled && setResult({ key: requestKey, error })
    );
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const current = result.key === requestKey ? result : {};
  return {
    loading: result.key !== requestKey,
    value: current.value,
    error: current.error,
    retry: () => setAttempt((count) => count + 1)
  };
};
