// pages/ResetPassword.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, Paper, CircularProgress, Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from '../utils/axiosInstance';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 400,
  width: '100%',
  borderRadius: 16,
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.08)',
  background: theme.palette.background.paper,
  textAlign: 'center'
}));

const ResetPassword = () => {
  const { user_id, reset_code } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.password || !form.confirm_password) {
      return setSnackbar({ open: true, message: 'Please fill all fields', severity: 'error' });
    }

    try {
      setLoading(true);
      await axios.post(`v1/password-reset-confirm/${user_id}/${reset_code}/`, form);
      setSnackbar({
        open: true,
        message: 'Password reset successful. Redirecting...',
        severity: 'success'
      });

      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. Please try again.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      sx={{ bgcolor: '#f4f6fc' }}
    >
      <StyledPaper>
        <Typography variant="h5" fontWeight={700} color="#5564EE" mb={2}>
          Reset Your Password
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Enter your new password below
        </Typography>

        <TextField
          fullWidth
          name="password"
          label="New Password"
          type="password"
          value={form.password}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          name="confirm_password"
          label="Confirm Password"
          type="password"
          value={form.confirm_password}
          onChange={handleChange}
          sx={{ mb: 3 }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            bgcolor: '#5564EE',
            '&:hover': { bgcolor: '#3A4AED' },
            py: 1.5
          }}
        >
          {loading ? <CircularProgress size={24} /> : 'Reset Password'}
        </Button>
      </StyledPaper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default ResetPassword;
