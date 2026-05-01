// hooks/useApi.js - Hook genérico para llamadas API con estado
import { useState, useEffect, useCallback } from 'react';

export const useApi = (fetchFn, deps = []) => {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { execute(); }, [execute]);

  return { data, loading, error, refetch: execute };
};

// hooks/useCurrency.js - Formateador de moneda colombiana
export const useCurrency = () => {
  const format = (value) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
      .format(value || 0);
  return { format };
};

// hooks/useDebounce.js
import { useState as _useState, useEffect as _useEffect } from 'react';
export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = _useState(value);
  _useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};
