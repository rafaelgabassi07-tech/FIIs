const set = <T>(key: string, data: T, ttlMinutes: number): void => {
    try {
        const now = new Date();
        const item = {
            data: data,
            expiry: now.getTime() + ttlMinutes * 60 * 1000,
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        console.error(`Error saving to cache for key "${key}":`, error);
    }
};

const get = <T>(key: string): T | null => {
    try {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) {
            return null;
        }
        const item = JSON.parse(itemStr);
        const now = new Date();
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return item.data as T;
    } catch (error) {
        console.error(`Error reading from cache for key "${key}":`, error);
        // If parsing fails, remove the corrupted item
        localStorage.removeItem(key);
        return null;
    }
};

const cacheService = {
    set,
    get,
};

export default cacheService;
