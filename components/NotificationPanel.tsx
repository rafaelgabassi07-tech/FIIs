
import React from 'react';
import { Notification } from '../types';
import { Bell, Gift, CloudDownload, X, Info } from 'lucide-react';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  unreadCount: number;
  onNotificationClick: (notification: Notification) => void;
}

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    switch (type) {
        case 'dividend': return <Gift className="text-yellow-400" size={20} />;
        case 'update': return <CloudDownload className="text-blue-400" size={20} />;
        case 'system': return <Info className="text-content-200" size={20} />;
        default: return <Bell className="text-content-200" size={20} />;
    }
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose, onMarkAllRead, unreadCount, onNotificationClick }) => {
  
  const renderNotificationItem = (n: Notification) => {
    const content = (
      <div className={`flex items-start gap-3 p-3 w-full text-left ${!n.isRead ? 'bg-brand-primary/10' : ''} ${n.action ? 'hover:bg-base-300' : ''}`}>
        <div className="flex-shrink-0 mt-1">
          <NotificationIcon type={n.type} />
        </div>
        <div>
          <p className="text-sm text-content-100">{n.message}</p>
          <p className="text-xs text-content-200 mt-1">{new Date(n.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
        </div>
      </div>
    );

    if (n.action) {
      return (
        <button key={n.id} onClick={() => onNotificationClick(n)} className="w-full block border-b border-base-300 last:border-b-0 transition-colors">
          {content}
        </button>
      );
    }
    
    return (
      <div key={n.id} className="border-b border-base-300 last:border-b-0">
          {content}
      </div>
    );
  };
  
  return (
    <div className="w-80 max-w-sm bg-base-200 rounded-lg shadow-2xl border border-base-300 z-50 animate-fade-in-up">
      <div className="flex justify-between items-center p-3 border-b border-base-300">
        <h3 className="font-bold text-content-100">Notificações</h3>
        <div className="flex items-center gap-2">
            {unreadCount > 0 && (
                <button onClick={onMarkAllRead} className="text-xs text-brand-primary hover:underline">
                    Marcar todas como lidas
                </button>
            )}
            <button onClick={onClose} className="text-content-200 hover:text-content-100">
                <X size={20} />
            </button>
        </div>
      </div>
      <div className="max-h-[66vh] overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(renderNotificationItem)
        ) : (
          <div className="p-4 text-center text-content-200">
            <p>Nenhuma notificação por enquanto.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;