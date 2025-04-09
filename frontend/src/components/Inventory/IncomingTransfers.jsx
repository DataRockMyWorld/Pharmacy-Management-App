import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, CircularProgress, Snackbar, IconButton, Tooltip
} from '@mui/material';
import { LocalShipping, CheckCircle, Close } from '@mui/icons-material';
import axios from '../../utils/axiosInstance';
import dayjs from 'dayjs';

const IncomingTransfers = ({ onReceived, setSnackbar }) => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('v1/transfers/in-transit/');
      setTransfers(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load transfers', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  return (
    <Box p={1}>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : transfers.length === 0 ? (
        <Typography align="center" color="text.secondary" mt={4}>
          No items currently in transit
        </Typography>
      ) : (
        transfers.map((t) => (
          <Paper
            key={t.id}
            elevation={3}
            sx={{
              p: 3,
              mb: 3,
              borderLeft: '5px solid #5564EE',
              borderRadius: 2,
              boxShadow: '0 3px 8px rgba(0,0,0,0.05)',
              transition: 'box-shadow 0.3s',
              '&:hover': {
                boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
              }
            }}
          >
            <Box display="flex" alignItems="center" mb={1}>
              <LocalShipping color="primary" sx={{ mr: 1 }} />
              <Typography fontWeight={600} fontSize="1rem">
                {t.product_name}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {t.quantity} units from <b>{t.from_branch_name}</b>
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Sent: {dayjs(t.transfer_date).format('MMM D, YYYY')}
            </Typography>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => onReceived(t.id)}
              >
                Mark as Received
              </Button>
            </Box>
          </Paper>
        ))
      )}
    </Box>
  );
};

export default IncomingTransfers;
