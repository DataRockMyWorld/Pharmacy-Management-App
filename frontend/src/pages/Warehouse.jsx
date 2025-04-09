import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Snackbar, Typography, Paper, Button, Skeleton } from '@mui/material';
import axios from '../utils/axiosInstance';

import InventoryTab from '../components/warehouse/InventoryTab';
import InventoryFilters from '../components/warehouse/InventoryFilters';
import RequestFilters from '../components/warehouse/RequestFilters';
import MovementsTab from '../components/warehouse/MovementsTab';
import MovementFilters from '../components/warehouse/MovementFilters';
import RequestTabs from '../components/warehouse/RequestTabs';
import RequestDetailsDialog from '../components/warehouse/RequestDetailsDialog';
import ReceiveStockDialog from '../components/warehouse/ReceiveStockDialog';
import OutgoingStockDialog from '../components/warehouse/OutgoingStockDialog';
import { UseConfirm } from '../components/UseConfirm';

const themeColor = ['#22c55e', '#3b82f6', '#f59e0b', '#6b7280'];

const WarehouseDashboard = () => {
  const [tab, setTab] = useState(null);
  const [requests, setRequests] = useState([]);
  const [processedRequests, setProcessedRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [movements, setMovements] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [inventorySearch, setInventorySearch] = useState('');
  const [stockLevelFilter, setStockLevelFilter] = useState('ALL');
  const [movementType, setMovementType] = useState('ALL');
  const [movementBranch, setMovementBranch] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [requesterFilter, setRequesterFilter] = useState('');
  const [requestBranchFilter, setRequestBranchFilter] = useState('ALL');
  const [toDateReq, setToDateReq] = useState('');
  const [fromDateReq, setFromDateReq] = useState('');
  const { ConfirmDialog, confirm } = UseConfirm();

  useEffect(() => {
    const saved = Number(localStorage.getItem('warehouseTab'));
    setTab(isNaN(saved) ? 0 : saved);
  }, []);

  useEffect(() => {
    if (tab !== null) fetchData();
  }, [tab]);

  const handleTabChange = (newTab) => {
    localStorage.setItem('warehouseTab', newTab);
    setTab(newTab);
  };

  const fetchData = async () => {
    try {
      const [inventoryRes, movementRes, allReqRes, branchesRes] = await Promise.all([
        axios.get('v1/inventory/?warehouse=true'),
        axios.get('v1/stock-movement/'),
        axios.get('v1/notifications/?filter=warehouse'),
        axios.get('v1/sites/')
      ]);

      const allNotifications = allReqRes.data;

      const pending = allNotifications
        .filter(n => n.notification_type === 'TRANSFER_REQUEST' && !n.is_read)
        .map(n => ({
          ...n,
          ...n.related_transfer,
          metadata: n.related_transfer?.metadata || {},
        }));

      const processed = allNotifications
        .filter(n => n.notification_type === 'TRANSFER_REQUEST' && n.is_read)
        .map(n => ({
          ...n,
          ...n.related_transfer,
          metadata: n.related_transfer?.metadata || {},
        }));

      const sortedInventory = inventoryRes.data.sort(
        (a, b) => new Date(b.last_updated || b.updated_at) - new Date(a.last_updated || a.updated_at)
      );

      const sortedMovements = movementRes.data.sort(
        (a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at)
      );

      setInventory(sortedInventory);
      setMovements(sortedMovements);
      setRequests(pending);
      setProcessedRequests(
        processed.map(r => ({
          ...r,
          status: r.status || r.transfer_status || r.metadata?.status || 'UNKNOWN'
        }))
      );
      setBranches(branchesRes.data.filter(site => !site.is_warehouse));
    } catch (err) {
      showSnackbar('Failed to fetch warehouse data', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleRequestAction = async (action, requestId, withDispatch = false) => {
    if (!selectedRequest) return;
    try {
      const payload = { action };
      if (action === 'reject') payload.rejection_reason = rejectionReason;

      const response = await axios.post(`v1/stock-transfer/approve/${requestId}/`, payload);
      await axios.patch(`v1/notifications/${selectedRequest.id}/mark-as-read/`);

      const updated = {
        ...selectedRequest,
        status: action === 'approve' ? 'IN_TRANSIT' : 'REJECTED',
        is_read: true,
        metadata: response.data?.transfer?.metadata || selectedRequest.metadata
      };

      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setProcessedRequests(prev => [updated, ...prev]);
      setRejectionReason('');
      setSelectedRequest(null);

      if (action === 'approve' && withDispatch) {
        setDispatchOpen(true);
      }

      showSnackbar(
        action === 'approve'
          ? withDispatch
            ? 'Approved and dispatch initiated'
            : 'Transfer approved — now in transit'
          : 'Transfer request rejected and branch notified',
        action === 'approve' ? 'success' : 'info'
      );

      fetchData();
    } catch (err) {
      showSnackbar(err.response?.data?.error || 'Action failed', 'error');
    }
  };

  const handleDateChange = (field, value) => {
    if (field === 'from') setFromDate(value);
    else setToDate(value);
  };

  const handleRequestDateChange = (field, value) => {
    if (field === 'from') setFromDateReq(value);
    else setToDateReq(value);
  };
  

  if (tab === null) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6" color="text.secondary">Loading dashboard...</Typography>
      </Box>
    );
  }

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesStock =
      stockLevelFilter === 'ALL' ||
      (stockLevelFilter === 'LOW' && item.quantity < 10) ||
      (stockLevelFilter === 'OUT' && item.quantity === 0) ||
      (stockLevelFilter === 'HIGH' && item.quantity > 100);
    return matchesSearch && matchesStock;
  });

  const filteredMovements = movements.filter(m => {
    const matchType = movementType === 'ALL' || m.type === movementType;
    const matchBranch = movementBranch === 'ALL' || m.destination_name === movementBranch || m.source_name === movementBranch;
    const matchFrom = !fromDate || new Date(m.timestamp || m.created_at) >= new Date(fromDate);
    const matchTo = !toDate || new Date(m.timestamp || m.created_at) <= new Date(toDate);
    return matchType && matchBranch && matchFrom && matchTo;
  });

  const filterRequests = (reqList) => reqList.filter(r => {
    const byRequester = requesterFilter === '' || r.metadata?.requested_by?.toLowerCase().includes(requesterFilter.toLowerCase());
    const byBranch = requestBranchFilter === 'ALL' || r.metadata?.branch_name === requestBranchFilter;
    const byFrom = !fromDateReq || new Date(r.created_at) >= new Date(fromDateReq);
    const byTo = !toDateReq || new Date(r.created_at) <= new Date(toDateReq);
    return byRequester && byBranch && byFrom && byTo;
  });
  

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
    <Box p={3} sx={{ bgcolor: '#f7f9fc', minHeight: '100vh' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} sx={{ p: 3, borderRadius: 2, bgcolor: '#fff', boxShadow: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="#5864E6">Warehouse Management</Typography>
          <Typography variant="subtitle2" color="text.secondary">Monitor and manage warehouse inventory and transfers.</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button size="small" variant="outlined" sx={{ borderColor: '#5864E6', color: '#5864E6', textTransform: 'none', '&:hover': { bgcolor: '#5864E6', color: '#fff' } }} onClick={() => setDispatchOpen(true)}>Dispatch Stock</Button>
          <Button size="small" variant="contained" sx={{ bgcolor: '#5864E6', textTransform: 'none', '&:hover': { bgcolor: '#4957c4' } }} onClick={() => setReceiveOpen(true)}>Receive Stock</Button>
        </Box>
      </Box>

      <Box>
      <Box display="flex" gap={2} justifyContent="center" mb={3}>
        {['Inventory', 'Movements', 'Requests', 'History'].map((label, i) => (
          <Paper
            key={label}
            elevation={tab === i ? 6 : 1}
            onClick={() => handleTabChange(i)}
            sx={{
              px: 3, py: 1, cursor: 'pointer',
              bgcolor: tab === i ? themeColor[i] : '#fff',
              color: tab === i ? '#fff' : themeColor[i],
              border: `1px solid ${tab === i ? themeColor[i] : '#d1d5db'}`,
              borderRadius: 3,
              fontSize: 14,
              '&:hover': { bgcolor: '#5864E6', color: '#fff' },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            <Typography variant="button" fontWeight="bold">{label}</Typography>
          </Paper>
        ))}
      </Box>
        {tab === 0 && (
          <>
            <InventoryFilters
              search={inventorySearch}
              onSearchChange={setInventorySearch}
              stockLevel={stockLevelFilter}
              onStockLevelChange={setStockLevelFilter}
            />
            <InventoryTab inventory={filteredInventory} />
          </>
        )}
        {tab === 1 && (
          <>
            <MovementFilters
              type={movementType}
              onTypeChange={setMovementType}
              branch={movementBranch}
              onBranchChange={setMovementBranch}
              fromDate={fromDate}
              toDate={toDate}
              onDateChange={handleDateChange}
            />
            <MovementsTab movements={filteredMovements} />
          </>
        )}
        {tab > 1 && (
          <>
            <RequestFilters
              requesterFilter={requesterFilter}
              requestBranchFilter={requestBranchFilter}
              fromDate={fromDateReq}
              toDate={toDateReq}
              onRequesterChange={setRequesterFilter}
              onBranchChange={setRequestBranchFilter}
              onDateChange={handleRequestDateChange}
              branchOptions={branches}
            />
            <Box maxHeight="70vh" overflow="auto" pr={1}>
              <RequestTabs
                tab={tab - 2}
                setTab={(val) => handleTabChange(val + 2)}
                requests={requests.filter(r => {
                  const byRequester = requesterFilter === '' || r.metadata?.requested_by?.toLowerCase().includes(requesterFilter.toLowerCase());
                  const byBranch = requestBranchFilter === 'ALL' || r.metadata?.branch_name === requestBranchFilter;
                  const byFrom = !fromDateReq || new Date(r.created_at) >= new Date(fromDateReq);
                  const byTo = !toDateReq || new Date(r.created_at) <= new Date(toDateReq);
                  return byRequester && byBranch && byFrom && byTo;
                })}
                processedRequests={processedRequests.filter(r => {
                  const byRequester = requesterFilter === '' || r.metadata?.requested_by?.toLowerCase().includes(requesterFilter.toLowerCase());
                  const byBranch = requestBranchFilter === 'ALL' || r.metadata?.branch_name === requestBranchFilter;
                  const byFrom = !fromDateReq || new Date(r.created_at) >= new Date(fromDateReq);
                  const byTo = !toDateReq || new Date(r.created_at) <= new Date(toDateReq);
                  return byRequester && byBranch && byFrom && byTo;
                })}
                onViewRequest={(req) => setSelectedRequest(req)}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
            </Box>
          </>
        )}
      </Box>
      
      <ReceiveStockDialog
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        onSuccess={() => {
          fetchData();
          showSnackbar('Stock successfully received!', 'success');
        }}
        products={inventory.map(i => i.product)}
      />

      <OutgoingStockDialog
        open={dispatchOpen}
        onClose={() => setDispatchOpen(false)}
        onSuccess={() => {
          fetchData();
          showSnackbar('Stock dispatched successfully!', 'success');
        }}
        products={inventory.map(i => i.product)}
        sites={branches}
      />

      <RequestDetailsDialog
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onApprove={(withDispatch) =>
          confirm(() => handleRequestAction('approve', selectedRequest.related_object_id, withDispatch), 'Are you sure you want to approve this transfer?')
        }
        onReject={() =>
          confirm(() => handleRequestAction('reject', selectedRequest.related_object_id), 'Are you sure you want to reject this request?')
        }
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Paper sx={{ px: 2, py: 1, bgcolor: snackbar.severity === 'error' ? '#dc2626' : '#5864E6', color: '#fff' }}>
          <Typography fontWeight="bold">{snackbar.message}</Typography>
        </Paper>
      </Snackbar>

      <ConfirmDialog />
    </Box>
    </motion.div>
  );
};

export default WarehouseDashboard;