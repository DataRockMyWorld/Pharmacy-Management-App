import React, { useState } from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Tooltip, Typography, TablePagination
} from '@mui/material';
import { Paper } from '@mui/material';
import { Warning } from '@mui/icons-material';
import dayjs from 'dayjs';
import { styled } from '@mui/material/styles';

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

const InventoryTable = ({ inventory }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const handleChangePage = (event, newPage) => setPage(newPage);

  const getStockStatus = (quantity, threshold) => {
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= threshold) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Out of Stock': return 'error';
      case 'Low Stock': return 'warning';
      default: return 'success';
    }
  };

  const paginated = inventory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <StyledPaper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Batch</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Expiration</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Quantity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((item) => {
              const status = getStockStatus(item.quantity, item.threshold_quantity);
              const isExpired = dayjs(item.expiration_date).isBefore(dayjs(), 'day');
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {isExpired && (
                        <Tooltip title="Expired">
                          <Warning color="error" sx={{ mr: 1 }} />
                        </Tooltip>
                      )}
                      <Box>
                        <Typography fontWeight={600}>{item.product.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.product.category}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{item.batch_number}</TableCell>
                  <TableCell>
                    <Chip 
                      label={dayjs(item.expiration_date).format('MMM D, YYYY')} 
                      color={isExpired ? 'error' : 'default'} 
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      fontWeight={600} 
                      color={status === 'Out of Stock' ? 'error' : 'inherit'}
                    >
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={status} 
                      color={getStatusColor(status)} 
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {dayjs(item.updated_at).format('MMM D, h:mm A')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={inventory.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5]}
        />
      </TableContainer>
    </StyledPaper>
  );
};

export default InventoryTable;
