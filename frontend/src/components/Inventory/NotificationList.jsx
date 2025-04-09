import React, { useState } from 'react';
import {
  Box, Typography, Paper, IconButton, TablePagination, Tooltip
} from '@mui/material';
import {
  DeleteOutline, ErrorOutline, InfoOutlined, CheckCircleOutline
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../utils/axiosInstance';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 16,
  boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.08)',
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    background: 'linear-gradient(90deg, #5564EE, #7986FF)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  }
}));

const getIcon = (type) => {
  switch (type) {
    case 'STOCK_ALERT':
      return <ErrorOutline color="warning" sx={{ mr: 1 }} />;
    case 'TRANSFER_APPROVAL':
      return <InfoOutlined color="info" sx={{ mr: 1 }} />;
    case 'SYSTEM':
    default:
      return <CheckCircleOutline color="success" sx={{ mr: 1 }} />;
  }
};

const NotificationList = ({ notifications, setNotifications, setSnackbar }) => {
  const [page, setPage] = useState(0);
  const [deleted, setDeleted] = useState([]);
  const rowsPerPage = 5;

  const handleArchive = async (id) => {
    try {
      await axios.patch(`/v1/notifications/${id}/archive/`);
      setDeleted(prev => [...prev, id]);

      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        setDeleted(prev => prev.filter(d => d !== id));
      }, 300);
    } catch (err) {
      console.error('Failed to archive:', err);
      setSnackbar({
        open: true,
        message: 'Failed to archive notification',
        severity: 'error'
      });
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const paginated = notifications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <StyledPaper>
      {notifications.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography color="text.secondary">No new notifications</Typography>
        </Box>
      ) : (
        <Box>
          <AnimatePresence>
            {paginated.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 1, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Paper
                  sx={{
                    p: 3,
                    mb: 2,
                    borderLeft: '5px solid #5564EE',
                    borderRadius: 2,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'box-shadow 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" mb={1}>
                    {getIcon(n.notification_type)}
                    <Typography fontWeight={600} fontSize="1rem">{n.title}</Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
                    {n.message}
                  </Typography>

                  <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.disabled">
                      {dayjs(n.created_at).fromNow()}
                    </Typography>

                    <Tooltip title="Archive notification">
                      <IconButton
                        onClick={() => handleArchive(n.id)}
                        size="small"
                        sx={{
                          width: 28,
                          height: 28,
                          p: 0,
                          '&:hover': { color: 'error.main' }
                        }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </motion.div>
            ))}
          </AnimatePresence>

          <TablePagination
            component="div"
            count={notifications.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[5]}
          />
        </Box>
      )}
    </StyledPaper>
  );
};

export default NotificationList;





