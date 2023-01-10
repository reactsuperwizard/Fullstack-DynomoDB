import React from 'react';
import { Button, makeStyles, CircularProgress } from '@material-ui/core';

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

const SubmitButton = ({ text, isSubmitting }) => {
  const classes = useStyles();
  return (
    <div className={classes.relativeWrapper}>
      <Button
        color="secondary"
        disabled={isSubmitting}
        type="submit"
        variant="contained"
      >
        {text}
      </Button>
      {isSubmitting && (
        <CircularProgress size={24} className={classes.buttonProgress} />
      )}
    </div>
  );
};

export default SubmitButton;
