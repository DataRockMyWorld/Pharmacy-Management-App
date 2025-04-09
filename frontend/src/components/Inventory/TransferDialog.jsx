import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, FormControl, InputLabel, Select, MenuItem,
  TextField, Button, CircularProgress, IconButton, Typography, Box, Tooltip
} from '@mui/material';
import { Close, TransferWithinAStation } from '@mui/icons-material';
import axios from '../../utils/axiosInstance';

const TransferDialog = ({
  open, onClose, form, setForm,
  branches, products,
  currentUser,
  setSnackbar,
  onSubmit
}) => {
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { product, quantity, details } = form;

    if (!product || !quantity) {
      setSnackbar({ open: true, message: 'Please fill all required fields', severity: 'error' });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        product,
        quantity,
        transfer_status: 'PENDING',
        details
        // ❌ from_branch is handled on the backend
      };

      const res = await axios.post('v1/stock-transfer/', payload);
      const transfer = res.data;

      const productObj = products.find(p => p.id === product);

      // Notify sender
      try {
        await axios.post('v1/notifications/', {
          recipient: currentUser.id,
          notification_type: 'TRANSFER_REQUEST',
          title: `Transfer Request Sent`,
          message: `You requested ${quantity}x ${productObj?.name}`,
          related_object_id: transfer.id
        });
      } catch (e) {
        console.warn('Notification to sender failed:', e);
      }

      setSnackbar({
        open: true,
        message: 'Transfer request sent successfully!',
        severity: 'success'
      });

      onClose();
      setForm({ product: '', quantity: '', to_branch: '', details: '' });
      onSubmit();

    } catch (err) {
      console.error('Transfer failed:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to create transfer',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pr: 2
      }}>
        <Box display="flex" alignItems="center">
          <TransferWithinAStation sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight={600}>New Stock Request</Typography>
        </Box>
        <Tooltip title="Close">
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              width: 28,
              height: 28,
              p: 0,
              '&:hover': { color: 'error.main' }
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Product</InputLabel>
              <Select
                name="product"
                value={form.product}
                onChange={handleChange}
                label="Product"
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="quantity"
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={handleChange}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>

          {/* Optional read-only branch display */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="From Branch"
              value={currentUser?.branch?.name || '—'}
              InputProps={{ readOnly: true }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="details"
              label="Details (optional)"
              multiline
              rows={3}
              value={form.details}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            bgcolor: '#5564EE',
            '&:hover': { bgcolor: '#3A4AED' },
            px: 4
          }}
        >
          {loading ? <CircularProgress size={20} /> : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferDialog;

