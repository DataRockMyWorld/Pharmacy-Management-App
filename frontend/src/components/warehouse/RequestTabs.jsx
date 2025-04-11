import React, { useState } from 'react';
import {
  Box, Paper, Typography, Button, Select, MenuItem, FormControl,
  InputLabel, Tab, Tabs, Badge, Chip, Pagination, Tooltip, Stack
} from '@mui/material';
import { Inbox, Archive, Visibility } from '@mui/icons-material';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

const StatusChip = ({ label }) => (
  <Chip
    label={label}
    color={
      label === 'APPROVED' ? 'success' :
      label === 'REJECTED' ? 'error' :
      label === 'IN_TRANSIT' ? 'info' : 'warning'
    }
    size="small"
    variant="outlined"
    sx={{ fontWeight: 600 }}
  />
);

const RequestTabs = ({
  tab, setTab,
  statusFilter, setStatusFilter,
  requests, processedRequests,
  onViewRequest, onArchiveRequest
}) => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  const tabLabels = [
    { icon: <Inbox />, label: 'Pending Requests', count: requests.length },
    { icon: <Archive />, label: 'Processed Requests', count: processedRequests.length }
  ];

  const filteredProcessed = processedRequests.filter(
    r => statusFilter === 'ALL' || r.status === statusFilter
  );

  const activeData = tab === 0 ? requests : filteredProcessed;
  const pageData = activeData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <Box>
      <Tabs value={tab} onChange={(e, newTab) => { setTab(newTab); setPage(1); }}>
        {tabLabels.map((t, idx) => (
          <Tab
            key={idx}
            label={
              <Badge badgeContent={idx === 0 ? t.count : null} color="error">
                {t.icon} {t.label}
              </Badge>
            }
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        ))}
      </Tabs>

      <Paper sx={{ mt: 3, p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={600}>
            {tabLabels[tab].label}
          </Typography>
          {tab === 1 && (
            <FormControl size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                label="Status"
              >
                <MenuItem value="ALL">All</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        {pageData.map((req, index) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2, mb: 2,
                borderLeft: '4px solid #5864E6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                '&:hover': { boxShadow: 3 }
              }}
            >
              <Box>
                <Typography fontWeight={600}>
                  Request from {req.metadata?.branch_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dayjs(req.created_at).format('MMM D, YYYY h:mm A')}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                {tab === 1 && <StatusChip label={req.status} />}
                <Tooltip title="View request">
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    variant="outlined"
                    sx={{ textTransform: 'none' }}
                    onClick={() => onViewRequest(req)}
                  >
                    View
                  </Button>
                </Tooltip>
                {tab === 1 && (
                  <Tooltip title="Archive this request">
                    <Button
                      size="small"
                      color="secondary"
                      variant="text"
                      onClick={() => onArchiveRequest(req)}
                    >
                      Archive
                    </Button>
                  </Tooltip>
                )}
              </Stack>
            </Paper>
          </motion.div>
        ))}

        {activeData.length === 0 && (
          <Typography color="text.secondary" mt={2}>
            No {tabLabels[tab].label.toLowerCase()} found.
          </Typography>
        )}

        {activeData.length > rowsPerPage && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={Math.ceil(activeData.length / rowsPerPage)}
              page={page}
              onChange={(e, val) => setPage(val)}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default RequestTabs;

