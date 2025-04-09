// components/Inventory/InventoryTabs.jsx
import React from 'react';
import { Tabs, Tab, Badge } from '@mui/material';
import {
  Inventory as InventoryIcon,
  TransferWithinAStation,
  History,
  Notifications
} from '@mui/icons-material';

const InventoryTabs = ({ value, onChange, notifications }) => {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      sx={{ mb: 3 }}
      indicatorColor="primary"
      textColor="primary"
    >
      <Tab label="Inventory" icon={<InventoryIcon />} iconPosition="start" />
      <Tab label="Movement History" icon={<History />} iconPosition="start" />
      <Tab label="Transfers" icon={<TransferWithinAStation />} iconPosition="start" />
      <Tab
        label={
          <Badge badgeContent={notifications.length} color="error">
            Notifications
          </Badge>
        }
        icon={<Notifications />}
        iconPosition="start"
      />
    </Tabs>
  );
};

export default InventoryTabs;