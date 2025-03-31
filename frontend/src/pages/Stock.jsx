import React, { useState, useEffect } from 'react';
import {createNotification} from '../services/notifications'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  CircularProgress,
  Divider,
  Avatar,
  Badge,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  TransferWithinAStation,
  History,
  Notifications,
  CheckCircle,
  Close,
  Refresh,
  Add,
  Remove,
  Warning
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import axios from '../utils/axiosInstance';
import dayjs from 'dayjs';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.08)',
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    background: 'linear-gradient(90deg, #5564EE, #7986FF)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  }
}));

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [transferForm, setTransferForm] = useState({
    product: '',
    quantity: '',
    to_branch: '',
    details: ''
  });

  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchData();
    fetchBranches();
    fetchProducts();
  }, []);

  useEffect(() => {
    const checkLowStock = () => {
      inventory.forEach(item => {
        if (item.quantity <= item.threshold_quantity && item.quantity > 0) {
          createNotification({
            recipient: currentUser.id, // Make sure you have access to current user
            notification_type: 'STOCK_ALERT',
            title: 'Low Stock Alert',
            message: `${item.product.name} is running low (${item.quantity} remaining)`,
            related_branch: item.branch.id,
            related_object_id: item.id
          });
        }
      });
    };
  
    if (inventory.length > 0) {
      checkLowStock();
    }
  }, [inventory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, movementsRes, transfersRes, notificationsRes] = await Promise.all([
        axios.get('v1/inventory/'),
        axios.get('v1/stock-movement/'),
        axios.get('v1/stock-transfer/'),
        axios.get('v1/notifications/')
      ]);
      
      setInventory(inventoryRes.data);
      console.log(inventoryRes.data);
      setStockMovements(movementsRes.data);
      setTransfers(transfersRes.data);
      setNotifications(notificationsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get('v1/sites/');
      setBranches(response.data.filter(branch => !branch.is_warehouse));
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('v1/products/');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleTransferSubmit = async () => {
    if (!transferForm.product || !transferForm.quantity || !transferForm.to_branch) {
      setSnackbar({
        open: true,
        message: 'Please fill all required fields',
        severity: 'error'
      });
      return;
    }
  
    try {
      setLoading(true);
      const payload = {
        ...transferForm,
        from_branch: 1, // Current user's branch (should be dynamic)
        transfer_status: 'PENDING'
      };
  
      // Send transfer request
      const response = await axios.post('v1/stock-transfer/', payload);
      
      // Get the created transfer data
      const transfer = response.data;
      
      // Find the product name for the notification
      const product = products.find(p => p.id === transferForm.product)?.name || 'product';
      
      // Find the branch name for the notification
      const toBranch = branches.find(b => b.id === transferForm.to_branch)?.name || 'branch';
      
      // 1. Show success snackbar
      setSnackbar({
        open: true,
        message: 'Transfer request sent successfully!',
        severity: 'success'
      });
      
      // 2. Create notification for the warehouse/CEO
      try {
        await axios.post('v1/notifications/', {
          recipient: 1, // Assuming CEO has ID 1 - adjust as needed
          notification_type: 'TRANSFER_REQUEST',
          title: `New Transfer Request from Branch ${payload.from_branch}`,
          message: `Request to transfer ${transferForm.quantity} units of ${product} to ${toBranch}`,
          related_object_id: transfer.id
        });
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // You might want to show a warning here, but don't fail the whole transfer
      }
      
      // 3. Create notification for the requester (optional)
      try {
        await axios.post('v1/notifications/', {
          recipient: currentUser.id, // Assuming you have access to current user
          notification_type: 'TRANSFER_REQUEST',
          title: 'Transfer Request Submitted',
          message: `Your request to transfer ${transferForm.quantity} units of ${product} to ${toBranch} is pending approval`,
          related_object_id: transfer.id
        });
      } catch (userNotificationError) {
        console.error('Failed to create user notification:', userNotificationError);
      }
  
      // Reset form and close dialog
      setTransferDialogOpen(false);
      setTransferForm({
        product: '',
        quantity: '',
        to_branch: '',
        details: ''
      });
      
      // Refresh data
      fetchData();
      
      // If using NotificationContext, refresh notifications
      if (refreshNotifications) {
        refreshNotifications();
      }
    } catch (error) {
      console.error('Error creating transfer:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create transfer',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferChange = (e) => {
    const { name, value } = e.target;
    setTransferForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStockStatus = (quantity, threshold) => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Out of Stock': return 'error';
      case 'Low Stock': return 'warning';
      default: return 'success';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center">
          <Avatar sx={{ bgcolor: '#5564EE', mr: 2 }}>
            <InventoryIcon />
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Inventory Management
          </Typography>
        </Box>
        
        <Box>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<TransferWithinAStation />}
              onClick={() => setTransferDialogOpen(true)}
              sx={{
                backgroundColor: '#5564EE',
                '&:hover': {
                  backgroundColor: '#3A4AED',
                }
              }}
            >
              Request New Stock
            </Button>
          </motion.div>
        </Box>
      </Box>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        sx={{ mb: 3 }}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="Inventory" icon={<InventoryIcon />} />
        <Tab label="Movement History" icon={<History />} />
        <Tab label="Transfers" icon={<TransferWithinAStation />} />
        <Tab 
          label={
            <Badge badgeContent={notifications.length} color="error">
              Notifications
            </Badge>
          } 
          icon={<Notifications />} 
        />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 0 && (
            <StyledPaper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Batch</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Expiration</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventory.map((item) => {
                      const status = getStockStatus(item.quantity, item.threshold_quantity);
                      const isExpired = dayjs(item.expiration_date).isBefore(dayjs(), 'day');
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              {isExpired && (
                                <Tooltip title="Expired">
                                  <Warning color="error" sx={{ mr: 1 }} />
                                </Tooltip>
                              )}
                              <Box>
                                <Typography fontWeight={600}>{item.product.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {item.product.category}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{item.batch_number}</TableCell>
                          <TableCell>
                            <Chip 
                              label={dayjs(item.expiration_date).format('MMM D, YYYY')} 
                              color={isExpired ? 'error' : 'default'} 
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              fontWeight={600} 
                              color={status === 'Out of Stock' ? 'error' : 'inherit'}
                            >
                              {item.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={status} 
                              color={getStatusColor(status)} 
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {dayjs(item.updated_at).format('MMM D, h:mm A')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </StyledPaper>
          )}

          {activeTab === 1 && (
            <StyledPaper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {dayjs(movement.date).format('MMM D, h:mm A')}
                        </TableCell>
                        <TableCell>{movement.product.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={movement.movement_type} 
                            color={
                              movement.movement_type === 'ADD' ? 'success' : 
                              movement.movement_type === 'REMOVE' ? 'error' : 'primary'
                            } 
                            size="small"
                            icon={
                              movement.movement_type === 'ADD' ? <Add fontSize="small" /> :
                              movement.movement_type === 'REMOVE' ? <Remove fontSize="small" /> :
                              <TransferWithinAStation fontSize="small" />
                            }
                          />
                        </TableCell>
                        <TableCell align="right">{movement.quantity}</TableCell>
                        <TableCell>{movement.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </StyledPaper>
          )}

          {activeTab === 2 && (
            <StyledPaper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>To</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          {dayjs(transfer.transfer_date).format('MMM D, h:mm A')}
                        </TableCell>
                        <TableCell>{transfer.product.name}</TableCell>
                        <TableCell>{transfer.from_branch.name}</TableCell>
                        <TableCell>{transfer.to_branch.name}</TableCell>
                        <TableCell align="right">{transfer.quantity}</TableCell>
                        <TableCell>
                          <Chip 
                            label={transfer.transfer_status} 
                            color={
                              transfer.transfer_status === 'COMPLETED' ? 'success' : 
                              transfer.transfer_status === 'REJECTED' ? 'error' : 'default'
                            } 
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </StyledPaper>
          )}

          {activeTab === 3 && (
            <StyledPaper>
              {notifications.length === 0 ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                  <Typography color="text.secondary">No new notifications</Typography>
                </Box>
              ) : (
                <Box>
                  {notifications.map((notification) => (
                    <Paper 
                      key={notification.id} 
                      sx={{ 
                        p: 2, 
                        mb: 2, 
                        borderLeft: `4px solid #5564EE`,
                        bgcolor: 'background.paper'
                      }}
                    >
                      <Box display="flex" justifyContent="space-between">
                        <Typography fontWeight={600}>{notification.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(notification.created_at).fromNow()}
                        </Typography>
                      </Box>
                      <Typography sx={{ mt: 1 }}>{notification.message}</Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </StyledPaper>
          )}
        </>
      )}

      {/* Transfer Dialog */}
      <Dialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ 
          bgcolor: '#5564EE', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box display="flex" alignItems="center">
            <TransferWithinAStation sx={{ mr: 1 }} />
            <Typography variant="h6">New Stock Request</Typography>
          </Box>
          <IconButton onClick={() => setTransferDialogOpen(false)} color="inherit">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  name="product"
                  value={transferForm.product}
                  onChange={handleTransferChange}
                  label="Product"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quantity"
                name="quantity"
                type="number"
                value={transferForm.quantity}
                onChange={handleTransferChange}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>To Branch</InputLabel>
                <Select
                  name="to_branch"
                  value={transferForm.to_branch}
                  onChange={handleTransferChange}
                  label="To Branch"
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Details (Optional)"
                name="details"
                value={transferForm.details}
                onChange={handleTransferChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setTransferDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleTransferSubmit}
              disabled={loading}
              sx={{
                backgroundColor: '#5564EE',
                '&:hover': {
                  backgroundColor: '#3A4AED',
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Request Transfer'}
            </Button>
          </motion.div>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            bgcolor: snackbar.severity === 'success' ? '#5564EE' : 'error.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 2
          }}
        >
          {snackbar.severity === 'success' ? (
            <CheckCircle sx={{ mr: 1 }} />
          ) : (
            <Close sx={{ mr: 1 }} />
          )}
          <Typography>{snackbar.message}</Typography>
        </Paper>
      </Snackbar>
    </Box>
  );
};

export default Inventory;