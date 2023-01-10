import React, { useEffect } from 'react';
import { Button, makeStyles } from '@material-ui/core';
const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    justifyContent: 'space-around'
  },
  topLabel: {
    textAlign: 'center',
    marginBottom: 30,
    padding: '0 26px 0 24px'
  },
  topSpan: {
    fontFamily: 'Helvetica'
  },
  closeBtnDiv: {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    textAlign: 'center'
  },
  logoDiv: {
    marginBottom: 0
  }
}));

const ZoomRedirectPage = () => {
  const classes = useStyles();

  const close = () => {
    window.close();
  };

  useEffect(() => {
    window.close();
  }, []);

  return (
    <div className={classes.root}>
      <div className={classes.logoDiv}>
        <img alt="Logo" src="/static/logo.svg" />
      </div>
      <p className={classes.topLabel}>
        <span className={classes.topSpan}>
          Your passtree.net and Zoom accounts have been connected successfully.
          You may now close this window.
        </span>
      </p>
      <div className={classes.closeBtnDiv}>
        <Button variant="contained" color="primary" onClick={close}>
          Close Window
        </Button>
      </div>
    </div>
  );
};

export default ZoomRedirectPage;
