import React from 'react';
import clsx from 'clsx';
import moment from 'moment';
import PropTypes from 'prop-types';
import {
  Button,
  ButtonGroup,
  Grid,
  Typography,
  makeStyles
} from '@material-ui/core';

const useStyles = makeStyles(() => ({
  root: {
    margin: 0
  },
  button: {
    minWidth: '6rem'
  },
  title: {
    display: 'flex',
    justifyContent: 'center'
  },
  mb20: {
    marginBottom: 10
  }
}));

const Toolbar = ({
  className,
  date,
  onNext,
  onPrev,
  onCurrent,
  range,
  isLoading,
  ...rest
}) => {
  const classes = useStyles();

  return (
    <Grid
      className={clsx(classes.root, className)}
      alignItems="center"
      container
      justify="flex-start"
      spacing={3}
      {...rest}
    >
      <Grid item xs={12}>
        <ButtonGroup size="medium" disabled={isLoading}>
          <Button onClick={onPrev} className={classes.button}>
            Previous
          </Button>
          <Button onClick={onCurrent} className={classes.button}>
            Current
          </Button>
          <Button onClick={onNext} className={classes.button}>
            Next
          </Button>
        </ButtonGroup>
      </Grid>
      <Grid
        container
        item
        xs={12}
        className={classes.title}
        direction="column"
        alignItems="center"
      >
        <Typography variant="h3" color="textPrimary" className={classes.mb20}>
          {range
            ? moment(range.start.date).format('MMMM YYYY')
            : moment().format('MMMM YYYY')}
        </Typography>
        <Typography variant="h6" color="textPrimary">
          {range
            ? moment(range.start.date).format('dddd MMM D') +
              ' to ' +
              moment(range.end.date).format('dddd MMM D')
            : moment().format('dddd MMM D') +
              ' to ' +
              moment().format('dddd MMM D')}
        </Typography>
      </Grid>
    </Grid>
  );
};

Toolbar.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  onNext: PropTypes.func,
  onPrev: PropTypes.func,
  onCurrent: PropTypes.func
};

Toolbar.defaultProps = {
  onNext: () => {},
  onPrev: () => {},
  onCurrent: () => {}
};

export default Toolbar;
