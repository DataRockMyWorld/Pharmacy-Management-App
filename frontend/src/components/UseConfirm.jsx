import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { useState } from 'react';

export const UseConfirm = () => {
  const [open, setOpen] = useState(false);
  const [onConfirm, setOnConfirm] = useState(() => () => {});
  const [message, setMessage] = useState('Are you sure?');

  const ConfirmDialog = () => (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={() => { onConfirm(); setOpen(false); }} color="primary" variant="contained">
          Yes, Proceed
        </Button>
      </DialogActions>
    </Dialog>
  );

  const confirm = (action, text = 'Are you sure?') => {
    setMessage(text);
    setOnConfirm(() => action);
    setOpen(true);
  };

  return { ConfirmDialog, confirm };
};
