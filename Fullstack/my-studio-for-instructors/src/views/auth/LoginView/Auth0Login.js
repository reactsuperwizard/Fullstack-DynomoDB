import React, { useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  FormHelperText,
  makeStyles,
  CircularProgress
} from '@material-ui/core';

import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';

const useStyles = makeStyles(() => ({
  root: {},
  buttonProgress: {
    position: 'absolute',
    top: '15%',
    left: '41%'
  },
  relativeWrapper: {
    position: 'relative'
  }
}));

const Auth0Login = ({ className, ...rest }) => {
  const classes = useStyles();
  const { loginWithPopup } = useAuth();
  const [error, setError] = useState(null);
  const isMountedRef = useIsMountedRef();

  const [submiting, setSubmiting] = useState(false);

  const handleLogin = async () => {
    try {
      setSubmiting(true);
      await loginWithPopup();
    } catch (err) {
      console.error(err);
      setSubmiting(false);
      if (isMountedRef.current) {
        setError(err.message);
      }
    }
  };

  console.log('submiting :>> ', submiting);
  return (
    <div className={clsx(classes.root, className)} {...rest}>
      {error && (
        <Box my={3}>
            <FormHelperText error>{error.includes("popup") ? "Please disable your popup blocker" : error }</FormHelperText>
        </Box>
      )}
      <Box display="flex" justifyContent="center">
        <div className={classes.relativeWrapper}>
          <Button
            color="secondary"
            disabled={submiting}
            variant="contained"
            onClick={handleLogin}
          >
            Log in to passtree.net
          </Button>
          {submiting && (
            <CircularProgress size={24} className={classes.buttonProgress} />
          )}
        </div>
      </Box>
    </div>
  );
};

Auth0Login.propTypes = {
  className: PropTypes.string
};

export default Auth0Login;
