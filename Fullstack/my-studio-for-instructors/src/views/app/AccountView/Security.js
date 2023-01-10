import React, { useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import * as Yup from 'yup';
import useAuth from 'src/hooks/useAuth';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormHelperText,
  Grid,
  TextField,
  makeStyles,
  Dialog,
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle
} from '@material-ui/core';
import wait from 'src/utils/wait';
import { auth0Config } from 'src/config';


const useStyles = makeStyles(() => ({
  root: {}
}));

const Security = ({ className, ...rest }) => {
  const classes = useStyles();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleResetPassword = () => {
    setOpen(true);
  }; 

  const handleConfirm = async () => {
    setOpen(false);
    var options = {
      method: 'POST',
      url: `https://${auth0Config.domain}/dbconnections/change_password`,
      headers: {'content-type': 'application/json'},
      data: {
        client_id: auth0Config.client_id,
        email: user.email,
        connection: auth0Config.db,
      }
    };

    axios.request(options).then(function (response) {
      console.log(response.data);
    }).catch(function (error) {
      console.error(error);
    });

    await logout();
  };

  const handleLogout = async () => {
    await logout();
  };


  return (
    <Card
      className={clsx(classes.root, className)}
      {...rest}
    >
      <CardContent>
        <Grid
          container
          spacing={3}
        >
          <Grid
            item
            md={6}
            xs={12}
          >
            <Button
              color="secondary"
              type="submit"
              variant="contained"
              onClick={() => handleLogout()} 
            >
              Logout
            </Button>
          </Grid>
          {user.id.startsWith('auth0|') &&
            <Grid
              item
              md={6}
              xs={12}
            >
              <Button
                color="secondary"
                type="submit"
                variant="contained"
                onClick={() => handleResetPassword()} 
              >
                Change Password
              </Button>
            </Grid>
          }
        </Grid>
      </CardContent>
     <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Change Password Confirmation"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Press confirm to reset your password and check your inbox for instructions.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirm} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

Security.propTypes = {
  className: PropTypes.string
};

export default Security;
