import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext'; // ✅ Fixed: contexts → context
import { Bell, X } from 'lucide-react';
import './NotificationBell.css';

export default function NotificationBell() {
  const context = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Safety guard — prevents crash if provider hasn't loaded yet
  if (!context) return null;

  const { notifications, isConnected, removeNotification, markAsRead, clearAll } = context;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getSeverityColor = (severity) => {
    const colors = {
      'Critical': '#ef4444',
      'High':     '#f59e0b',
      'Medium':   '#3b82f6',
      'Low':      '#10b981'
    };
    return colors[severity] || '#6b7280';
  };

  return (
    <div className="notification-bell">
      <button
        className="notification-bell__button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount}</span>
        )}
        <span className={`notification-bell__status ${isConnected ? 'connected' : 'disconnected'}`} />
      </button>

      {isOpen && (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button onClick={clearAll} className="notification-bell__clear">
                Clear All
              </button>
            )}
          </div>

          <div className="notification-bell__list">
            {notifications.length === 0 ? (
              <div className="notification-bell__empty">
                <Bell size={40} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notification-bell__item ${notif.read ? 'read' : 'unread'}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="notification-bell__item-content">
                    <div className="notification-bell__item-header">
                      <strong>{notif.title}</strong>
                      {notif.severity && (
                        <span
                          className="notification-bell__severity"
                          style={{ backgroundColor: getSeverityColor(notif.severity) }}
                        >
                          {notif.severity}
                        </span>
                      )}
                    </div>
                    <p>{notif.message}</p>
                    <small>{new Date(notif.timestamp).toLocaleString()}</small>
                  </div>
                  <button
                    className="notification-bell__remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notif.id);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}