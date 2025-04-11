import React, { useState, useEffect } from 'react';
import {
  Box, Typography, CircularProgress, Stack, Button, Dialog, DialogTitle, DialogContent,
  IconButton, Tooltip
} from '@mui/material';
import { PersonAdd, Close } from '@mui/icons-material';
import UserTable from '../components/Users/UserTable';
import UserFormDialog from '../components/Users/UserFormDialog';
import axios from '../utils/axiosInstance';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState(null); // null = create mode
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('v1/users/');
      setUsers(res.data);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get('v1/sites/');
      setBranches(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditUser = (user) => {
    setEditUser(user);
    setOpenDialog(true);
  };
  
  const handleToggleActive = async (user) => {
    try {
      await axios.patch(`v1/users/${user.id}/`, { is_active: !user.is_active });
      fetchUsers();
    } catch {
      setSnackbar({ open: true, message: 'Failed to toggle user', severity: 'error' });
    }
  };
  
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.first_name}?`)) return;
    try {
      await axios.delete(`v1/users/${user.id}/`);
      fetchUsers();
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete user', severity: 'error' });
    }
  };
  

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>User Management</Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setOpenDialog(true)}
          sx={{
            textTransform: 'none',
            bgcolor: '#5564EE',
            '&:hover': { bgcolor: '#3A4AED' },
            px: 3,
            width: 200,
            py: 1.5,
          }}
        >
          Add User
        </Button>
      </Stack>

      {loading ? (
        <Box display="flex" justifyContent="center"><CircularProgress /></Box>
      ) : (
        <UserTable
            users={users}
            onEdit={handleEditUser}
            onToggleActive={handleToggleActive}
            onDelete={handleDeleteUser}
        />

      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>Create New User</Typography>
          <Tooltip title="Close">
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent dividers>
          <UserFormDialog
            editUser={editUser}
            branches={branches}
            onSuccess={() => {
              fetchUsers();
              setOpenDialog(false);
              setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
            }}
            setSnackbar={setSnackbar}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Users;
