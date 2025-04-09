import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Select, MenuItem, InputLabel,
  FormControl, CircularProgress
} from '@mui/material';
import axios from '../../utils/axiosInstance';

const ReceiveStockDialog = ({ open, onClose, onSuccess, products }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: '',
    batch_number: '',
    expiration_date: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.product_id || !formData.quantity) {
      alert('Please select a product and enter quantity');
      return;
    }
  
    if (Number(formData.quantity) <= 0) {
      alert('Quantity must be positive');
      return;
    }
  
    console.log('Submitting:', formData); // Debug log
    
    setSubmitting(true);
    try {
      // Prepare payload with proper null handling
      const payload = {
        product_id: formData.product_id,
        quantity: Number(formData.quantity),
        batch_number: formData.batch_number || undefined,
        expiration_date: formData.expiration_date || null,
        notes: formData.notes || undefined
      };
  
      const response = await axios.post('v1/warehouse/receive/', payload);
      
      // Handle document download if successful
      if (response.data.id) {
        const docId = response.data.id;
        const receiptRes = await axios.get(`v1/warehouse/receiving-document/${docId}/`, {
          responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([receiptRes.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receiving_doc_${docId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
  
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Receive stock failed:', err);
      alert(`Failed to receive stock: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Receive New Stock</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
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
              name="quantity"
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="batch_number"
              label="Batch Number"
              value={formData.batch_number}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="expiration_date"
              label="Expiration Date"
              type="date"
              value={formData.expiration_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="notes"
              label="Notes"
              multiline
              rows={2}
              value={formData.notes}
              onChange={handleChange}
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
          Receive
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiveStockDialog;