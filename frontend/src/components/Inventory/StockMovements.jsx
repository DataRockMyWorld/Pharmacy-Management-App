import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Typography, Box, TablePagination
} from '@mui/material';
import { Add, Remove, TransferWithinAStation } from '@mui/icons-material';
import { Paper } from '@mui/material';
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

const StockMovements = ({ movements }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const handleChangePage = (event, newPage) => setPage(newPage);
  const paginated = movements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <StyledPaper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Quantity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{dayjs(m.date).format('MMM D, h:mm A')}</TableCell>
                <TableCell>{m.product.name}</TableCell>
                <TableCell>
                  <Chip
                    label={m.movement_type}
                    color={
                      m.movement_type === 'ADD' ? 'success' :
                      m.movement_type === 'REMOVE' ? 'error' : 'primary'
                    }
                    size="small"
                    icon={
                      m.movement_type === 'ADD' ? <Add fontSize="small" /> :
                      m.movement_type === 'REMOVE' ? <Remove fontSize="small" /> :
                      <TransferWithinAStation fontSize="small" />
                    }
                  />
                </TableCell>
                <TableCell align="right">{m.quantity}</TableCell>
                <TableCell>{m.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={movements.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5]}
        />
      </TableContainer>
    </StyledPaper>
  );
};

export default StockMovements;
