import React, { useState, useEffect } from 'react';
import {
  TextField, Grid, FormControl, InputLabel, Select, MenuItem,
  Checkbox, FormControlLabel, Button
} from '@mui/material';
import axios from '../../utils/axiosInstance';

const UserFormDialog = ({ editUser, branches, onSuccess, setSnackbar }) => {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    role: 'Admin',
    branch: '',
    is_staff: true,
    is_superuser: false,
    is_active: true
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editUser) {
      setForm({
        first_name: editUser.first_name || '',
        last_name: editUser.last_name || '',
        email: editUser.email || '',
        phone_number: editUser.phone_number || '',
        role: editUser.role || 'Admin',
        branch: editUser.branch || '',
        is_staff: editUser.is_staff,
        is_superuser: editUser.is_superuser,
        is_active: editUser.is_active
      });
    }
  }, [editUser]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    const payload = { ...form };

    try {
      setLoading(true);
      if (editUser) {
        await axios.patch(`/v1/users/${editUser.id}/`, payload);
      } else {
        await axios.post('/v1/users/', payload);
      }

      onSuccess();
    } catch (e) {
      console.error(e);
      setSnackbar({ open: true, message: 'Failed to save user', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Form Fields (same as before) */}
      <Grid item xs={6}>
        <TextField name="first_name" label="First Name" fullWidth value={form.first_name} onChange={handleChange} />
      </Grid>
      <Grid item xs={6}>
        <TextField name="last_name" label="Last Name" fullWidth value={form.last_name} onChange={handleChange} />
      </Grid>
      <Grid item xs={12}>
        <TextField name="email" label="Email" fullWidth value={form.email} onChange={handleChange} disabled={!!editUser} />
      </Grid>
      <Grid item xs={12}>
        <TextField name="phone_number" label="Phone Number" fullWidth value={form.phone_number} onChange={handleChange} />
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Role</InputLabel>
          <Select name="role" value={form.role} onChange={handleChange}>
            <MenuItem value="CEO">CEO</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel>Branch</InputLabel>
          <Select name="branch" value={form.branch} onChange={handleChange}>
            {branches.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Permissions */}
      <Grid item xs={4}>
        <FormControlLabel control={<Checkbox checked={form.is_active} name="is_active" onChange={handleChange} />} label="Active" />
      </Grid>
      <Grid item xs={4}>
        <FormControlLabel control={<Checkbox checked={form.is_staff} name="is_staff" onChange={handleChange} />} label="Staff" />
      </Grid>
      <Grid item xs={4}>
        <FormControlLabel control={<Checkbox checked={form.is_superuser} name="is_superuser" onChange={handleChange} />} label="Superuser" />
      </Grid>

      <Grid item xs={12}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={loading}
          sx={{ bgcolor: '#5564EE', '&:hover': { bgcolor: '#3A4AED' } }}
        >
          {loading ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
        </Button>
      </Grid>
    </Grid>
  );
};

export default UserFormDialog;