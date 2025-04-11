import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Button, CircularProgress
} from '@mui/material';
import axios from '../../utils/axiosInstance';

const ProductFormDialog = ({ open, onClose, editProduct, setSnackbar, onSuccess }) => {
  const [form, setForm] = useState({
    name: '', description: '', brand: '', category: '',
    unit_price: '', manufacturer: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editProduct) setForm(editProduct);
    else setForm({ name: '', description: '', brand: '', category: '', unit_price: '', manufacturer: '' });
  }, [editProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.unit_price) {
      setSnackbar({ open: true, message: 'Name, Category and Price are required', severity: 'error' });
      return;
    }
    setLoading(true);
    try {
      if (editProduct) {
        await axios.put(`v1/products/${editProduct.id}/`, form);
        setSnackbar({ open: true, message: 'Product updated', severity: 'success' });
      } else {
        await axios.post(`v1/products/`, form);
        setSnackbar({ open: true, message: 'Product added', severity: 'success' });
      }
      onClose();
      onSuccess();
    } catch {
      setSnackbar({ open: true, message: 'Failed to submit', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editProduct ? 'Edit Product' : 'New Product'}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Name" fullWidth name="name" value={form.name} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Category" fullWidth name="category" value={form.category} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Brand" fullWidth name="brand" value={form.brand} onChange={handleChange} />
          </Grid>
          <Grid item xs={6}>
            <TextField label="Manufacturer" fullWidth name="manufacturer" value={form.manufacturer} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Unit Price" type="number" fullWidth name="unit_price" value={form.unit_price} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Description" multiline rows={3} fullWidth name="description" value={form.description} onChange={handleChange} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : editProduct ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductFormDialog;
