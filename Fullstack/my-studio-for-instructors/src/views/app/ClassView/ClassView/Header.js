import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  Breadcrumbs,
  Button,
  Grid,
  Link,
  Typography,
  makeStyles,
  SvgIcon
} from '@material-ui/core';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import EventNoteIcon from '@material-ui/icons/EventNote';

const useStyles = makeStyles(() => ({
  root: {}
}));

const Header = ({ className, name, schedule, classId, ...rest }) => {
  const classes = useStyles();

  return (
    <Grid
      className={clsx(classes.root, className)}
      container
      justify="space-between"
      spacing={3}
      {...rest}
    >
      <Grid item>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link
            variant="body1"
            color="inherit"
            to="/app/classes"
            component={RouterLink}
          >
            Classes
          </Link>
          <Typography variant="body1" color="textPrimary">
            {name}
          </Typography>
        </Breadcrumbs>
        <Typography variant="h3" color="textPrimary">
          {name}
        </Typography>
      </Grid>
      <Grid item>
        <Button
          color="secondary"
          variant="contained"
          className={classes.action}
          startIcon={
            <SvgIcon fontSize="small">
              <EventNoteIcon />
            </SvgIcon>
          }
          onClick={schedule}
        >
          Schedule Event
        </Button>
      </Grid>
    </Grid>
  );
};

Header.propTypes = {
  className: PropTypes.string
};

export default Header;
