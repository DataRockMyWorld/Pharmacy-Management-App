// components/Shared/SnackbarAlert.jsx
import React from 'react';
import { Snackbar, Paper, Typography } from '@mui/material';
import { CheckCircle, Close } from '@mui/icons-material';

const SnackbarAlert = ({ snackbar, setSnackbar }) => {
  const handleClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 2,
          bgcolor: snackbar.severity === 'success' ? '#5564EE' : 'error.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        {snackbar.severity === 'success' ? (
          <CheckCircle sx={{ mr: 1 }} />
        ) : (
          <Close sx={{ mr: 1 }} />
        )}
        <Typography>{snackbar.message}</Typography>
      </Paper>
    </Snackbar>
  );
};

export default SnackbarAlert;