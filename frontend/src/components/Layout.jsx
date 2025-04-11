import React from 'react';
import {
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  TextField,
  IconButton,
  Tooltip,
  styled,
  Button
} from '@mui/material';
import { Link, Outlet } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import StoreIcon from '@mui/icons-material/Store';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { useNavigate } from "react-router-dom";
import logo from '../assets/images/logo.jpg';
import NotificationBell from '../pages/NotificationBell';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../utils/AuthContext';

const drawerWidth = 240;

const StyledListItem = styled(ListItem)(({ theme }) => ({
  color: theme.palette.grey[600],
  padding: theme.spacing(1, 3),
  margin: theme.spacing(0.5, 0),
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s ease',
  '& .MuiListItemIcon-root': {
    color: theme.palette.grey[600],
    minWidth: '40px',
  },
  '&:hover': {
    backgroundColor: '#5564EE',
    color: 'white',
    '& .MuiListItemIcon-root': {
      color: 'white',
    },
  },
  '&.Mui-selected': {
    backgroundColor: '#5564EE',
    color: 'white',
    '& .MuiListItemIcon-root': {
      color: 'white',
    },
  },
  '&.Mui-selected:hover': {
    backgroundColor: '#5564EE',
    color: 'white',
    '& .MuiListItemIcon-root': {
      color: 'white',
    },
  },
}));

const Layout = () => {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Purchase', icon: <ShoppingCartIcon />, path: '/purchase' },
    { text: 'Transaction History', icon: <LocalPharmacyIcon />, path: '/transaction-history' },
    { text: 'Stock', icon: <InventoryIcon />, path: '/stock' },
    { text: 'Customer', icon: <PeopleIcon />, path: '/customer' },
    ...(user?.role === 'CEO' 
      ? [
        { text: 'Warehouse', icon: <WarehouseIcon />, path: '/warehouse' },
        { text: 'Product', icon: <InventoryIcon />, path: '/product' },
        { text: 'Branches', icon: <StoreIcon />, path: '/branches' },
        { text: 'Users', icon: <GroupsIcon />, path: '/users' }
      ]
      : [])
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Sidebar */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#f5f5f5',
            padding: '16px 0',
          },
        }}
        variant="permanent"
        anchor="left"
      >
        <Toolbar />
        <List sx={{ padding: '0 8px' }}>
          {menuItems.map((item) => (
            <StyledListItem 
              button 
              key={item.text} 
              component={Link} 
              to={item.path}
              selected={window.location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  variant: 'body2',
                  fontWeight: 500 
                }} 
              />
            </StyledListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: "white", 
            color: "black",
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            padding: '0 24px'
          }}
        >
          <Toolbar sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '8px 0',
            minHeight: 60,
            paddingY: 0
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              minWidth: '200px'
            }}>
              <Box 
                component="img" 
                src={logo} 
                alt="Logo" 
                sx={{ 
                  height: 70, 
                  marginRight: 2,
                  maxHeight: '100%',
                  objectFit : 'contain'
                }} 
              />
            </Box>

            <Box sx={{ 
              flexGrow: 1, 
              maxWidth: '600px',
              mx: 4
            }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search..."
                size="small"
                sx={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: '#e0e0e0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#5564EE',
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 2,
              minWidth: '200px',
              justifyContent: 'flex-end'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NotificationBell />
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 1
              }}>
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: '#5564EE',
                    fontSize: '0.875rem'
                  }}
                >
                  {user?.full_name?.charAt(0) || 'U'}
                </Avatar>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                    {user?.full_name || 'Unknown User'}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
                    {user?.role || 'Cashier'}
                  </Typography>
                </Box>
              </Box>

              <Tooltip title="Logout">
                <Button
                  variant="contained"
                  onClick={logout}
                  startIcon={<PowerSettingsNewIcon />}
                  sx={{
                    minWidth: 'auto',
                    px: 1.5,
                    py: 1,
                    backgroundColor: 'transparent',
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 0.08)',
                      color: 'error.dark'
                    },
                    boxShadow: 'none',
                    borderRadius: '8px',
                    textTransform: 'none'
                  }}
                />
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        <Toolbar sx={{ minHeight: '80px !important' }} />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;