import React from 'react';
import {
  Box, TextField, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';

const MovementFilters = ({ type, onTypeChange, branch, onBranchChange, fromDate, toDate, onDateChange }) => {
  return (
    <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Movement Type</InputLabel>
        <Select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          label="Movement Type"
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="ADD">ADD</MenuItem>
          <MenuItem value="OUTBOUND">Outbound</MenuItem>
          <MenuItem value="TRANSFER">Transfer</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Branch</InputLabel>
        <Select
          value={branch}
          onChange={(e) => onBranchChange(e.target.value)}
          label="Branch"
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="MAIN">Main</MenuItem>
          <MenuItem value="SATELLITE">Satellite</MenuItem>
          <MenuItem value="STORE">Store</MenuItem>
        </Select>
      </FormControl>

      <TextField
        size="small"
        label="From"
        type="date"
        InputLabelProps={{ shrink: true }}
        value={fromDate}
        onChange={(e) => onDateChange('from', e.target.value)}
      />

      <TextField
        size="small"
        label="To"
        type="date"
        InputLabelProps={{ shrink: true }}
        value={toDate}
        onChange={(e) => onDateChange('to', e.target.value)}
      />
    </Box>
  );
};

export default MovementFilters;
