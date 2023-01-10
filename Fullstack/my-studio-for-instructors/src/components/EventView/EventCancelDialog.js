import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@material-ui/core';

const EventCancelDialog = ({ open, close, eventIns, confirm }) => {
  return (
    <Dialog
      open={open}
      onClose={close}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        Press Cancel {eventIns.packageId ? 'Package' : 'Event'} to confirm
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {eventIns.packageId ? eventIns.packageName : eventIns.name}
        </DialogContentText>
        <DialogContentText id="alert-dialog-description">
          {'Ticket holders will receive a credit for future use.'}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} color="primary">
          Close
        </Button>
        <Button onClick={confirm} color="primary" autoFocus>
          Cancel {eventIns.packageId ? 'Package' : 'Event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventCancelDialog;
