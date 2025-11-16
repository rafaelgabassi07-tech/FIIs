import { useState, useEffect, useCallback } from 'react';
import { API_KEY_STORAGE_KEY } from '../constants';

export const useSettings = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadKey = useCallback(() => {
      try {
          const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
          if (storedKey) {
              setApiKey(storedKey);
          } else {
              setApiKey(null);
          }
      } catch (error) {
          console.error("Failed to read API key from localStorage", error);
      } finally {
          setIsLoading(false);
      }
    }, []);

    useEffect(() => {
        loadKey();
        
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === API_KEY_STORAGE_KEY) {
                loadKey();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [loadKey]);

    const saveApiKey = useCallback((key: string) => {
        try {
            localStorage.setItem(API_KEY_STORAGE_KEY, key);
            setApiKey(key);
        } catch (error) {
            console.error("Failed to save API key to localStorage", error);
        }
    }, []);
    
    const removeApiKey = useCallback(() => {
        try {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
            setApiKey(null);
        } catch (error) {
            console.error("Failed to remove API key from localStorage", error);
        }
    }, []);

    return { apiKey, saveApiKey, removeApiKey, isLoading };
};
