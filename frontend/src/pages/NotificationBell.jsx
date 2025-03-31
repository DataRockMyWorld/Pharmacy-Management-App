// src/components/NotificationBell.jsx
import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Popover, List, ListItem, ListItemText, Typography, Button, Box, CircularProgress } from '@mui/material';
import { Notifications as NotificationsIcon, Close } from '@mui/icons-material';
import { fetchNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../services/notifications';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const StyledPopover = styled(Popover)(({ theme }) => ({
  '& .MuiPaper-root': {
    width: 350,
    maxHeight: 400,
    padding: theme.spacing(2),
  },
}));

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {user} = useAuth();

  const open = Boolean(anchorEl);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleClick = async (event) => {
    setAnchorEl(event.currentTarget);
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
      fetchUnreadCount();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleViewAllClick = () => {
    handleClose();
    if (notifications.length === 0) {
      // No notifications - navigate based on role
      if (user?.role === 'CEO') {
        navigate('/warehouse');
      } else if (user?.role === 'Admin') {
        navigate('/stock');
      }
      // For other roles, just close the popover
    } else {
      // Has notifications - navigate to notifications page if you have one
      // Or you can keep this empty to just close the popover
    }
  };

  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleClick}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} 
        color="error"
        overlap='circular'
        max={99}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <StyledPopover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Notifications</Typography>
          <Button 
            size="small" 
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              No new notifications
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              onClick={handleViewAllClick}
              sx={{ mt: 1 }}
            >
              {user?.role === 'CEO' ? 'Go to Warehouse' : 
               user?.role === 'Admin' ? 'Go to Inventory' : 'Close'}
            </Button>
          </Box>
        ) : (
          <>
            <List dense>
              {notifications.slice(0, 3).map((notification) => (
                <ListItem 
                  key={notification.id} 
                  sx={{ 
                    bgcolor: notification.is_read ? 'background.default' : 'action.hover',
                    borderLeft: `4px solid ${getNotificationColor(notification.notification_type)}`,
                    mb: 1
                  }}
                >
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" sx={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="textSecondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {notification.time_since} ago
                        </Typography>
                      </>
                    }
                  />
                  {!notification.is_read && (
                    <IconButton 
                      size="small" 
                      onClick={() => handleMarkAsRead(notification.id)}
                      sx={{ ml: 1 }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  )}
                </ListItem>
              ))}
            </List>
            <Button 
              fullWidth 
              onClick={handleViewAllClick}
              sx={{ mt: 1 }}
            >
              View All
            </Button>
          </>
        )}
      </StyledPopover>
    </>
  );
};

const getNotificationColor = (type) => {
  switch(type) {
    case 'TRANSFER_REQUEST':
      return '#5564EE';
    case 'TRANSFER_APPROVAL':
      return '#4CAF50';
    case 'TRANSFER_REJECTION':
      return '#F44336';
    case 'STOCK_ALERT':
      return '#FF9800';
    default:
      return '#9E9E9E';
  }
};

export default NotificationBell;