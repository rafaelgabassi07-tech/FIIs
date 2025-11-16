
import { useState, useEffect, useCallback } from 'react';
import { Notification, Tab } from '../types';
import { usePortfolio } from './usePortfolio';
import { useUpdateCheck } from './useUpdateCheck';
import { fetchDividendCalendar } from '../services/geminiService';
import { NOTIFICATIONS_STORAGE_KEY } from '../constants';

export const useNotifications = (setActiveTab?: (tab: Tab) => void) => {
    const { holdings } = usePortfolio();
    const { isUpdateAvailable, latestVersionInfo } = useUpdateCheck();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const generateNotifications = useCallback(async () => {
        setIsLoading(true);
        const newNotifications: Notification[] = [];
        
        // 1. Check for app update
        if (isUpdateAvailable) {
            newNotifications.push({
                id: `update-${latestVersionInfo.version}`,
                type: 'update',
                message: `Nova versão ${latestVersionInfo.version} disponível! Clique para ver as novidades.`,
                date: new Date().toISOString(),
                isRead: false,
                action: { type: 'navigate', tab: Tab.Menu } // This will be handled in MenuScreen to open the modal
            });
        }
        
        // 2. Check for dividend events
        const tickers = holdings.map(h => h.ticker);
        if (tickers.length > 0) {
            try {
                const dividendEvents = await fetchDividendCalendar(tickers);
                dividendEvents.forEach(event => {
                    const eventDate = new Date(event.date);
                    const formattedDate = eventDate.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
                    newNotifications.push({
                        id: `dividend-${event.ticker}-${event.type}-${event.date}`,
                        type: 'dividend',
                        message: `${event.ticker}: ${event.type} em ${formattedDate}.`,
                        date: event.date,
                        isRead: false,
                        relatedTicker: event.ticker,
                    });
                });
            } catch (error) {
                console.error("Failed to generate dividend notifications:", error);
            }
        }
        
        // 3. Merge with stored notifications to preserve read status
        try {
            const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
            const storedNotifications: Notification[] = stored ? JSON.parse(stored) : [];
            const storedMap = new Map(storedNotifications.map(n => [n.id, n]));

            const mergedNotifications = newNotifications.map(n => {
                const storedNotification = storedMap.get(n.id);
                return storedNotification ? { ...n, isRead: storedNotification.isRead } : n;
            });
            
            // System message for first time users
            if(storedNotifications.length === 0 && mergedNotifications.length === 0){
                 mergedNotifications.push({
                    id: 'welcome-message',
                    type: 'system',
                    message: 'Bem-vindo! Suas notificações sobre dividendos e atualizações aparecerão aqui.',
                    date: new Date().toISOString(),
                    isRead: true,
                 });
            }

            const sorted = mergedNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setNotifications(sorted);
            localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(sorted));
        } catch(e) {
            console.error("Error managing notifications in storage:", e);
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }

    }, [isUpdateAvailable, latestVersionInfo.version, holdings]);
    
    useEffect(() => {
        generateNotifications();
    }, [generateNotifications]);

    const markAllAsRead = useCallback(() => {
        const updated = notifications.map(n => ({ ...n, isRead: true }));
        setNotifications(updated);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    }, [notifications]);

    const handleNotificationClick = useCallback((notification: Notification) => {
        if (notification.action?.type === 'navigate' && setActiveTab) {
            setActiveTab(notification.action.tab);
            // In a more complex app, we might also pass a state to the target screen,
            // for example, to automatically open the update modal in the MenuScreen.
            // For now, navigating to the tab is sufficient as the user can then click the menu item.
        }
        // Mark notification as read on click
        const updated = notifications.map(n => n.id === notification.id ? { ...n, isRead: true } : n);
        setNotifications(updated);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

    }, [notifications, setActiveTab]);
    
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return { notifications, unreadCount, markAllAsRead, isLoading, handleNotificationClick, refresh: generateNotifications };
};