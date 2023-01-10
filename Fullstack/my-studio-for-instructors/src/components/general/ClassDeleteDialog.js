import React from 'react';
import axios from 'src/utils/axiosApiGateway';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@material-ui/core';
import { useSnackbar } from 'notistack';
import { useHistory } from 'react-router-dom';

const ClassDeleteDialog = ({ classIns, openFlag, close, shouldRoute }) => {
  const { enqueueSnackbar } = useSnackbar();
  const history = useHistory();

  const handleConfirm = async () => {
    try {
      close();
      const response = await axios.post('/delete_class', {
        id: classIns.id
      });
      console.log('response :>> ', response);
      if (!response.data.status) {
        enqueueSnackbar(response.data.message, {
          variant: 'error'
        });
        return;
      }

      if (shouldRoute) {
        history.push('/app/classes');
      } else {
        history.go(0);
      }

      enqueueSnackbar(`Class ${classIns.name} deleted`, {
        variant: 'success'
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog
      open={openFlag}
      onClose={close}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{'Delete Confirmation'}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          You are about to delete {classIns.name}.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} color="primary">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="primary" autoFocus>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ClassDeleteDialog;
