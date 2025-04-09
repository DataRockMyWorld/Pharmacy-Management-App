import React, { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip,
  Tooltip, TablePagination
} from '@mui/material';
import dayjs from 'dayjs';

const statusColor = (qty, threshold) => {
  if (qty === 0) return { label: 'OUT OF STOCK', color: 'error' };
  if (qty <= threshold) return { label: 'LOW STOCK', color: 'warning' };
  return { label: 'IN STOCK', color: 'success' };
};

const InventoryTab = ({ inventory }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const handleChangePage = (_, newPage) => setPage(newPage);

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Current Warehouse Inventory</Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f3f4f6' }}>
              <TableCell>Product</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Threshold</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventory.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(item => {
              const status = statusColor(item.quantity, item.threshold_quantity);
              return (
                <TableRow key={item.id} hover>
                  <TableCell>{item.product?.name}</TableCell>
                  <TableCell>{item.batch_number || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={dayjs(item.expiration_date).format('MMM D, YYYY')}
                      color={dayjs(item.expiration_date).isBefore(dayjs()) ? 'error' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{item.threshold_quantity}</TableCell>
                  <TableCell>
                    <Chip size="small" label={status.label} color={status.color} sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={dayjs(item.updated_at).format('MMM D, YYYY h:mm A')}>
                      <span>{dayjs(item.updated_at).fromNow()}</span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={inventory.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[]}
      />
    </Paper>
  );
};

export default InventoryTab;
