import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Select, MenuItem, InputLabel,
  FormControl, CircularProgress
} from '@mui/material';
import axios from '../../utils/axiosInstance';

const OutgoingStockDialog = ({ open, onClose, onSuccess, products, sites }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    destination_id: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Math.max(1, value) : value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.product_id || !formData.quantity || !formData.destination_id) {
      alert('Please select a product, enter quantity, and select destination');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        product_id: Number(formData.product_id),
        quantity: Number(formData.quantity),
        destination_id: Number(formData.destination_id),
        notes: formData.notes || ""
      };

      const response = await axios.post('v1/warehouse/dispatch/', payload);

      if (response.data.transfer_id) {
        const doc = await axios.get(`v1/warehouse/dispatch-document/${response.data.transfer_id}/`, {
          responseType: 'blob'
        });

        const url = window.URL.createObjectURL(new Blob([doc.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `waybill_${response.data.transfer_id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      await onSuccess(); // ✅ REFRESH WAREHOUSE + BRANCH DATA
      onClose();
    } catch (err) {
      console.error('Dispatch failed:', {
        status: err.response?.status,
        data: err.response?.data,
        config: err.config
      });

      let errorMessage = 'Failed to dispatch stock';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      alert(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Dispatch Stock</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Product</InputLabel>
              <Select
                name="product_id"
                value={formData.product_id}
                label="Product"
                onChange={handleChange}
              >
                {products.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Destination Branch</InputLabel>
              <Select
                name="destination_id"
                value={formData.destination_id}
                label="Destination"
                onChange={handleChange}
              >
                {sites.map(site => (
                  <MenuItem key={site.id} value={site.id}>{site.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={submitting}
          startIcon={submitting && <CircularProgress size={16} />}
        >
          Dispatch
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OutgoingStockDialog;
