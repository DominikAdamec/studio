'use client';

import { useState, useEffect, useCallback } from 'react';

const PRO_STATUS_KEY = 'prompty_pro_status';

export function useProStatus() {
  const [isPro, setIsPro] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const proStatus = localStorage.getItem(PRO_STATUS_KEY);
      setIsPro(proStatus === 'true');
    } catch (error) {
      console.warn('Could not read pro status from localStorage', error);
      setIsPro(false);
    }
    setIsLoaded(true);
  }, []);

  const setProStatus = useCallback((status: boolean) => {
    try {
      localStorage.setItem(PRO_STATUS_KEY, String(status));
      setIsPro(status);
    } catch (error) {
      console.warn('Could not write pro status to localStorage', error);
    }
  }, []);

  return { isPro, setProStatus, isLoaded };
}
