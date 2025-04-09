import React from 'react';
import {
  Box, TextField, MenuItem, FormControl, InputLabel, Select
} from '@mui/material';

const RequestFilters = ({
  requester,
  branch,
  fromDate,
  toDate,
  onRequesterChange,
  onBranchChange,
  onDateChange,
  branchOptions = []
}) => {
  return (
    <Box display="flex" flexWrap="wrap" gap={2} mb={2} alignItems="center">
      <TextField
        size="small"
        label="Requested By"
        value={requester}
        onChange={(e) => onRequesterChange(e.target.value)}
      />

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Branch</InputLabel>
        <Select
          value={branch}
          label="Branch"
          onChange={(e) => onBranchChange(e.target.value)}
        >
          <MenuItem value="ALL">All</MenuItem>
          {branchOptions.map(b => (
            <MenuItem key={b.id} value={b.name}>{b.name}</MenuItem>
          ))}
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

export default RequestFilters;
