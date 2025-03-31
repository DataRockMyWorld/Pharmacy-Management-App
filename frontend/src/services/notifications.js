// src/services/notifications.js
import axiosInstance from '../utils/axiosInstance';

export const fetchNotifications = async () => {
  try {
    const response = await axiosInstance.get('v1/notifications/');
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markAsRead = async (id) => {
  try {
    const response = await axiosInstance.patch(`v1/notifications/${id}/mark-as-read/`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllAsRead = async () => {
  try {
    const response = await axiosInstance.post('v1/notifications/mark-all-as-read/');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const getUnreadCount = async () => {
  try {
    const response = await axiosInstance.get('v1/notifications/unread-count/');
    return response.data.unread_count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

export const createNotification = async (notificationData) => {
  try {
    const response = await axiosInstance.post('v1/notifications/', notificationData);
    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};