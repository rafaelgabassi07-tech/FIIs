
import { useMemo } from 'react';
import { CURRENT_APP_VERSION, LATEST_APP_VERSION_INFO, TRANSACTIONS_STORAGE_KEY, API_KEY_STORAGE_KEY } from '../constants';

export const useUpdateCheck = () => {
    const isUpdateAvailable = useMemo(() => {
        return CURRENT_APP_VERSION < LATEST_APP_VERSION_INFO.version;
    }, []);

    const performUpdate = () => {
        try {
            const keysToKeep = [ TRANSACTIONS_STORAGE_KEY, API_KEY_STORAGE_KEY ];
            
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && !keysToKeep.includes(key)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
        } catch (error) {
            console.error("Could not clear cache for update:", error);
        }
        
        window.location.reload();
    };

    return {
        isUpdateAvailable,
        currentVersion: CURRENT_APP_VERSION,
        latestVersionInfo: LATEST_APP_VERSION_INFO,
        performUpdate,
    };
};
