import React from 'react';
import {
  Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Paper, Typography, Chip, IconButton, Tooltip
} from '@mui/material';
import { Edit, Delete, ToggleOn, ToggleOff } from '@mui/icons-material';
import dayjs from 'dayjs';

const UserTable = ({ users, onEdit, onDelete, onToggleActive }) => {
  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Branch</strong></TableCell>
              <TableCell><strong>Last Login</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.first_name} {u.last_name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip label={u.role} color={u.role === 'CEO' ? 'primary' : 'secondary'} size="small" />
                </TableCell>
                <TableCell>{u.branch_name || '—'}</TableCell>
                <TableCell>{u.last_login ? dayjs(u.last_login).format('MMM D, h:mm A') : '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={u.is_active ? 'Active' : 'Inactive'}
                    color={u.is_active ? 'success' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => onEdit(u)}><Edit /></IconButton>
                  </Tooltip>
                  <Tooltip title={u.is_active ? "Deactivate" : "Activate"}>
                    <IconButton onClick={() => onToggleActive(u)}>
                      {u.is_active ? <ToggleOff color="warning" /> : <ToggleOn color="success" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete User">
                    <IconButton onClick={() => onDelete(u)}><Delete color="error" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default UserTable;
