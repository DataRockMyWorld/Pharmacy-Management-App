// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchNotifications, getUnreadCount } from '../services/notifications';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const refreshNotifications = async () => {
    try {
      const [notifs, count] = await Promise.all([
        fetchNotifications(),
        getUnreadCount()
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  useEffect(() => {
    refreshNotifications();
    
    // Optional: Set up polling for new notifications
    const interval = setInterval(refreshNotifications, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      unreadCount, 
      notifications,
      refreshNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);