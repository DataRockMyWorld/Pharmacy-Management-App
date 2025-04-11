import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, Button, CircularProgress
} from '@mui/material';
import axios from '../../utils/axiosInstance';

const BranchFormDialog = ({ open, onClose, editBranch, setSnackbar, onSuccess }) => {
  const [form, setForm] = useState({
    name: '', location: '', city: '', region: '',
    branch_code: '', phone_number: '', email: '', is_warehouse: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editBranch) setForm(editBranch);
    else setForm({ name: '', location: '', city: '', region: '', branch_code: '', phone_number: '', email: '', is_warehouse: false });
  }, [editBranch]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (editBranch) {
        await axios.put(`v1/sites/${editBranch.id}/`, form);
        setSnackbar({ open: true, message: 'Branch updated', severity: 'success' });
      } else {
        await axios.post('v1/sites/', form);
        setSnackbar({ open: true, message: 'Branch created', severity: 'success' });
      }
      onSuccess();
      onClose();
    } catch {
      setSnackbar({ open: true, message: 'Failed to save branch', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editBranch ? 'Edit Branch' : 'New Branch'}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField label="Name" fullWidth name="name" value={form.name} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField label="Location" fullWidth name="location" value={form.location} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField label="City" fullWidth name="city" value={form.city} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField label="Region" fullWidth name="region" value={form.region} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField label="Branch Code" fullWidth name="branch_code" value={form.branch_code} onChange={handleChange} /></Grid>
          <Grid item xs={6}><TextField label="Phone" fullWidth name="phone_number" value={form.phone_number} onChange={handleChange} /></Grid>
          <Grid item xs={12}><TextField label="Email" fullWidth name="email" value={form.email} onChange={handleChange} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} variant="contained">
          {loading ? <CircularProgress size={20} /> : editBranch ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BranchFormDialog;
