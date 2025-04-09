import React from 'react';
import { Box, TextField, MenuItem, FormControl, InputLabel, Select } from '@mui/material';

const InventoryFilters = ({ search, onSearchChange, stockLevel, onStockLevelChange }) => {
  return (
    <Box display="flex" gap={2} mb={2} alignItems="center">
      <TextField
        label="Search Product"
        variant="outlined"
        size="small"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: 240 }}
      />

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Stock Level</InputLabel>
        <Select
          value={stockLevel}
          onChange={(e) => onStockLevelChange(e.target.value)}
          label="Stock Level"
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="LOW">Low Stock (&lt; 10)</MenuItem>
          <MenuItem value="OUT">Out of Stock</MenuItem>
          <MenuItem value="HIGH">Overstocked (&gt; 100)</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default InventoryFilters;
