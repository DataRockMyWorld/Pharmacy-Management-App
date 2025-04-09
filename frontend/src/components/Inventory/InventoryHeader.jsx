// components/Inventory/InventoryHeader.jsx
import React from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';
import { Inventory as InventoryIcon, TransferWithinAStation } from '@mui/icons-material';
import { motion } from 'framer-motion';

const InventoryHeader = ({ onRequestClick }) => {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
      <Box display="flex" alignItems="center">
        <Avatar sx={{ bgcolor: '#5564EE', mr: 2 }}>
          <InventoryIcon />
        </Avatar>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Inventory Management
        </Typography>
      </Box>
      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<TransferWithinAStation />}
          onClick={onRequestClick}
          sx={{
            backgroundColor: '#5564EE',
            '&:hover': {
              backgroundColor: '#3A4AED',
            }
          }}
        >
          Request New Stock
        </Button>
      </motion.div>
    </Box>
  );
};

export default InventoryHeader;
