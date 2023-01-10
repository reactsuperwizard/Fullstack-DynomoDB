import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  Breadcrumbs,
  Button,
  Grid,
  Link,
  Typography,
  SvgIcon,
  makeStyles
} from '@material-ui/core';
import ShareIcon from '@material-ui/icons/Share';

import NavigateNextIcon from '@material-ui/icons/NavigateNext';

const useStyles = makeStyles(theme => ({
  root: {},
  action: {
    marginBottom: theme.spacing(1),
    '& + &': {
      marginLeft: theme.spacing(1)
    }
  },
  packageTitle: {
    marginTop: 10
  }
}));

const Header = ({ className, eventIns, openShareDlg, ...rest }) => {
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
            to="/app/events"
            component={RouterLink}
          >
            Events
          </Link>
          <Typography variant="body1" color="textPrimary">
            View Event
          </Typography>
        </Breadcrumbs>
        <Typography variant="h3" color="textPrimary">
          {eventIns.name + (eventIns.deletedAt ? ' CANCELED' : '')}
        </Typography>
        {eventIns.isPackage && (
          <Typography
            variant="h4"
            color="textPrimary"
            className={classes.packageTitle}
          >
            Package: {eventIns.packageName}
          </Typography>
        )}
      </Grid>
      <Grid item>
        <Button
          color="secondary"
          variant="contained"
          onClick={openShareDlg}
          className={classes.action}
          disabled={eventIns.deletedAt ?  true : false }
          startIcon={
            <SvgIcon fontSize="small">
              <ShareIcon />
            </SvgIcon>
          }
        >
          Share
        </Button>
      </Grid>
    </Grid>
  );
};

Header.propTypes = {
  className: PropTypes.string
};

export default Header;
