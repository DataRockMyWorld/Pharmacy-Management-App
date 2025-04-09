import React, { useState } from 'react';
import {
  Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip,
  TablePagination
} from '@mui/material';
import dayjs from 'dayjs';

const movementColor = (type) => ({
  ADD: 'success', REMOVE: 'error', TRANSFER: 'info'
}[type] || 'default');

const MovementsTab = ({ movements }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 8;
  const handleChangePage = (_, newPage) => setPage(newPage);

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Stock Movement Logs</Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f3f4f6' }}>
              <TableCell>Date</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell>Branch</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movements.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(m => (
              <TableRow key={m.id} hover>
                <TableCell>{dayjs(m.date).format('MMM D, YYYY h:mm A')}</TableCell>
                <TableCell>{m.product?.name}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={m.movement_type}
                    color={movementColor(m.movement_type)}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="right">{m.quantity}</TableCell>
                <TableCell>{m.branch?.name}</TableCell>
                <TableCell>{m.details || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={movements.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[]}
      />
    </Paper>
  );
};

export default MovementsTab;

