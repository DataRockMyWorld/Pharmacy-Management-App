import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, TablePagination, Paper, Tooltip, Typography, Stack, Chip
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const BranchTable = ({ branches, onEdit, onDelete }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;
  const currentPage = branches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper elevation={3} sx={{ borderRadius: 3 }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Region</strong></TableCell>
              <TableCell><strong>City</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPage.map(b => (
              <TableRow key={b.id}>
                <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontWeight={600}>{b.name}</Typography>
                        {b.is_warehouse && (
                            <Chip label="Warehouse" size="small" color="primary" variant="outlined" />
                        )}
                    </Stack>
                </TableCell>

                <TableCell>{b.region}</TableCell>
                <TableCell>{b.city}</TableCell>
                <TableCell>{b.phone_number}</TableCell>
                <TableCell>{b.email}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton onClick={() => onEdit(b)}><Edit /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton onClick={() => onDelete(b.id)}><Delete /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={branches.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPageOptions={[]}
      />
    </Paper>
  );
};

export default BranchTable;
