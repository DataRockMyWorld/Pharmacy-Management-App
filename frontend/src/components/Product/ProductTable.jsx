import React, { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  IconButton, Paper, TablePagination, Chip, Tooltip, Typography
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import dayjs from 'dayjs';

const ProductTable = ({ products, onEdit, onDelete }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const paged = products.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper elevation={3} sx={{ borderRadius: 3 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Brand</strong></TableCell>
              <TableCell><strong>Unit Price</strong></TableCell>
              <TableCell><strong>Manufacturer</strong></TableCell>
              <TableCell><strong>Created</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paged.map(p => (
              <TableRow key={p.id}>
                <TableCell>
                  <Typography fontWeight={600}>{p.name}</Typography>
                </TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.brand}</TableCell>
                <TableCell>₵{Number(p.unit_price).toFixed(2)}</TableCell>
                <TableCell>{p.manufacturer}</TableCell>
                <TableCell>
                  <Chip label={dayjs(p.created_at).format('MMM D, YYYY')} size="small" />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => onEdit(p)}><Edit /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => onDelete(p.id)}><Delete /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={products.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPageOptions={[]}
      />
    </Paper>
  );
};

export default ProductTable;
