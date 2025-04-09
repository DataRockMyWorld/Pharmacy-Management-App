import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, Divider, Chip
} from '@mui/material';
import dayjs from 'dayjs';

const StatusChip = ({ label }) => {
  const status = label || 'PENDING';

  const color =
    status === 'APPROVED' ? 'success' :
    status === 'REJECTED' ? 'error' :
    status === 'IN_TRANSIT' ? 'info' : 'warning';

  return (
    <Chip
      label={status}
      color={color}
      variant="outlined"
      sx={{ fontWeight: 600 }}
      size="small"
    />
  );
};

const RequestDetailsDialog = ({
  open, onClose, request,
  onApprove, onReject,
  rejectionReason, setRejectionReason
}) => {
  if (!request) return null;

  const status = request.status || request.transfer_status || 'PENDING';
  const isPending = status === 'PENDING';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Transfer Request Details</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6">{request.metadata?.product_name || 'Product'} Transfer</Typography>
            <Divider />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <StatusChip label={status} />
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">Date</Typography>
            <Typography>{dayjs(request.created_at).format('MMM D, YYYY h:mm A')}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">Requested By</Typography>
            <Typography>{request.metadata?.requested_by || 'Unknown'}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">Branch</Typography>
            <Typography>{request.metadata?.branch_name || '—'}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle2" color="text.secondary">Quantity</Typography>
            <Typography>{request.metadata?.quantity || 0}</Typography>
          </Grid>

          {status === 'REJECTED' && request.metadata?.rejection_reason && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="error">Rejection Reason</Typography>
              <Typography color="error">{request.metadata.rejection_reason}</Typography>
            </Grid>
          )}

          {isPending && (
            <Grid item xs={12}>
              <TextField
                label="Rejection Reason (optional)"
                fullWidth
                multiline
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        {isPending ? (
          <>
            <Button color="error" onClick={onReject}>Reject</Button>
            <Button onClick={() => onApprove(false)}>Approve</Button>
            <Button variant="contained" onClick={() => onApprove(true)}>Approve & Dispatch</Button>
          </>
        ) : (
          <Typography variant="body2" sx={{ mx: 2 }} color="text.secondary">
            This request has already been <b>{status.toLowerCase()}</b>.
          </Typography>
        )}
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            minWidth: 80,
            '&:hover': { fontWeight: 'bold', opacity: 0.9 }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestDetailsDialog;


