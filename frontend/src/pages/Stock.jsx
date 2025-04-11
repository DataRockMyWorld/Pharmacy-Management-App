// pages/Inventory.jsx
import React, { useEffect, useState } from 'react';
import {
  Box, CircularProgress, Tabs, Tab, Button, Stack, Dialog, DialogTitle, DialogContent,
  IconButton, Typography, DialogActions, Tooltip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import InventoryTable from '../components/Inventory/InventoryTable';
import StockMovements from '../components/Inventory/StockMovements';
import NotificationList from '../components/Inventory/NotificationList';
import TransferDialog from '../components/Inventory/TransferDialog';
import IncomingTransfers from '../components/Inventory/IncomingTransfers';
import SnackbarAlert from '../components/Inventory/SnackbarAlert';
import axios from '../utils/axiosInstance';
import { createNotification } from '../services/notifications';
import {
  TransferWithinAStation, LocalShipping, Close,
  Inventory as InventoryIcon, History as HistoryIcon, Notifications as NotificationsIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [transferForm, setTransferForm] = useState({ product: '', quantity: '', details: '' });
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(() => parseInt(localStorage.getItem('activeTab')) || 0);
  const [branchFilter, setBranchFilter] = useState('warehouse');

  const isCEO = currentUser?.role === 'CEO';
  const isViewOnlyMode = isCEO && branchFilter !== 'warehouse';

  const ViewOnlyBanner = ({ tabName }) => (
    <Box
      sx={{
        mb: 2,
        p: 2,
        bgcolor: '#FFF7E6',
        border: '1px solid #FFCC80',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      {tabName === 'Inventory' && <InventoryIcon sx={{ color: '#FF9800' }} />}
      {tabName === 'Movement History' && <HistoryIcon sx={{ color: '#FF9800' }} />}
      {tabName === 'Notifications' && <NotificationsIcon sx={{ color: '#FF9800' }} />}
      <Typography color="text.primary" fontWeight={500}>
        Viewing <strong>{branches.find(b => b.id === branchFilter)?.name || 'Branch'}</strong> {tabName.toLowerCase()} in read-only mode.
      </Typography>
    </Box>
  );

  useEffect(() => {
    fetchData(); 
    fetchBranches(); 
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await axios.get('/v1/user/me/');
      setCurrentUser(res.data);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (inventory.length > 0) checkLowStock();
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
      setStockMovements(movementsRes.data);
      setTransfers(transfersRes.data);
      setNotifications(notificationsRes.data.filter(n => n.notification_type !== 'TRANSFER_APPROVAL'));
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to fetch data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get('v1/sites/');
      setBranches(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('v1/products/');
      setProducts(res.data);
    } catch (e) { console.error(e); }
  };

  const checkLowStock = () => {
    inventory.forEach(item => {
      if (item.quantity <= item.threshold_quantity && item.quantity > 0) {
        createNotification({
          recipient: currentUser.id,
          notification_type: 'STOCK_ALERT',
          title: 'Low Stock Alert',
          message: `${item.product.name} is running low (${item.quantity} remaining)`,
          related_branch: item.branch.id,
          related_object_id: item.id
        });
      }
    });
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    localStorage.setItem('activeTab', newValue);
  };

  const handleMarkReceived = async (id) => {
    setSelectedTransferId(id);
    setConfirmDialogOpen(true);
  };

  const confirmReceive = async () => {
    try {
      await axios.post(`v1/warehouse/receive-transfer/${selectedTransferId}/`);
      setSnackbar({ open: true, message: 'Stock marked as received!', severity: 'success' });
      setConfirmDialogOpen(false);
      setSelectedTransferId(null);
      fetchData();
    } catch (err) {
      setSnackbar({ open: true, message: 'Error confirming receipt', severity: 'error' });
    }
  };

  const filteredInventory = isCEO && branchFilter !== 'all'
    ? inventory.filter(i => branchFilter === 'warehouse' ? i.branch.is_warehouse : i.branch.id === branchFilter)
    : inventory;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <InventoryIcon sx={{ fontSize: 36, color: '#5564EE' }} />
          <Typography variant="h5" fontWeight={700}>Inventory Management</Typography>
        </Stack>
        <Stack direction="row" spacing={2}>
          {isCEO && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Branch View</InputLabel>
              <Select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                label="Branch View"
              >
                <MenuItem value="warehouse">Warehouse</MenuItem>
                <MenuItem value="all">All Branches</MenuItem>
                {branches.filter(b => !b.is_warehouse).map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {!isCEO || branchFilter === 'warehouse' ? (
            <>
              <Button variant="outlined" startIcon={<TransferWithinAStation />} onClick={() => setTransferDialogOpen(true)}>Request Stock</Button>
              <Button variant="contained" startIcon={<LocalShipping />} onClick={() => setDispatchDialogOpen(true)} sx={{ bgcolor: '#5564EE', '&:hover': { bgcolor: '#3A4AED' } }}>Transfers & Dispatches</Button>
            </>
          ) : null}
        </Stack>
      </Stack>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Inventory" />
        <Tab label="Movement History" />
        <Tab label="Notifications" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
      ) : (
        <>
          {activeTab === 0 && (
            <>
              {isViewOnlyMode && <ViewOnlyBanner tabName="Inventory" />}
              <InventoryTable inventory={filteredInventory} rowsPerPage={5} />
            </>
          )}
          {activeTab === 1 && (
            <>
              {isViewOnlyMode && <ViewOnlyBanner tabName="Movement History" />}
              <StockMovements movements={stockMovements} rowsPerPage={5} />
            </>
          )}
          {activeTab === 2 && (
            <>
              {isViewOnlyMode && <ViewOnlyBanner tabName="Notifications" />}
              <NotificationList
                notifications={notifications}
                setNotifications={setNotifications}
                enableDelete
                enablePagination
                rowsPerPage={5}
              />
            </>
          )}
        </>
      )}

      <TransferDialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        form={transferForm}
        setForm={setTransferForm}
        branches={branches}
        products={products}
        currentUser={currentUser}
        setSnackbar={setSnackbar}
        onSubmit={fetchData}
      />

      <Dialog open={dispatchDialogOpen} onClose={() => setDispatchDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 2 }}>
          <Typography variant="h6" fontWeight={600}>Transfers & Dispatches</Typography>
          <Tooltip title="Close">
            <IconButton onClick={() => setDispatchDialogOpen(false)} size="small" sx={{ width: 28, height: 28, p: 0, '&:hover': { color: 'error.main' } }}>
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent dividers>
          <IncomingTransfers onReceived={handleMarkReceived} setSnackbar={setSnackbar} />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Receipt</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to mark this item as received?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={confirmReceive} color="primary" autoFocus>Confirm</Button>
        </DialogActions>
      </Dialog>

      <SnackbarAlert snackbar={snackbar} setSnackbar={setSnackbar} />
    </Box>
  );
};

export default Inventory;




