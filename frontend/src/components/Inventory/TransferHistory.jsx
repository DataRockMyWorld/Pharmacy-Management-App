// components/Inventory/TransferHistory.jsx
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Typography
} from '@mui/material';
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

const TransferHistory = ({ transfers }) => {
  return (
    <StyledPaper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>From</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>To</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Quantity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transfers.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{dayjs(t.transfer_date).format('MMM D, h:mm A')}</TableCell>
                <TableCell>{t.product.name}</TableCell>
                <TableCell>{t.from_branch.name}</TableCell>
                <TableCell>{t.to_branch.name}</TableCell>
                <TableCell align="right">{t.quantity}</TableCell>
                <TableCell>
                  <Chip
                    label={t.transfer_status}
                    color={
                      t.transfer_status === 'COMPLETED' ? 'success' :
                      t.transfer_status === 'REJECTED' ? 'error' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledPaper>
  );
};

export default TransferHistory;