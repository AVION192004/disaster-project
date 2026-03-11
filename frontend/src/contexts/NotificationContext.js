import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

const NotificationContext = createContext({
  notifications: [],
  isConnected: false,
  addNotification: () => {},
  removeNotification: () => {},
  markAsRead: () => {},
  clearAll: () => {}
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {

  const socketRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Add notification
  const addNotification = (notification) => {
    const newNotif = {
      id: Date.now(),
      ...notification,
      read: false
    };

    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const clearAll = () => setNotifications([]);

  useEffect(() => {

    socketRef.current = io("http://localhost:5000", {
      transports: ["websocket"]
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected");
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    });

    socketRef.current.on("new_disaster_report", (data) => {
      addNotification({
        type: "new_report",
        title: "🚨 New Disaster Report",
        message: `${data.name} reported at ${data.location}`,
        severity: data.severity,
        timestamp: data.timestamp
      });
    });

    socketRef.current.on("disaster_status_updated", (data) => {
      addNotification({
        type: "status_update",
        title: "📊 Status Updated",
        message: `Report #${data.report_id} → ${data.new_status}`,
        timestamp: data.timestamp
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };

  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        isConnected,
        addNotification,
        removeNotification,
        markAsRead,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};