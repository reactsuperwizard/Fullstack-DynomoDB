import React from 'react';
import { Container, makeStyles } from '@material-ui/core';

import Page from 'src/components/Page';
import NotificationContent from './Content';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: 100,
    marginTop: 60
  }
}));

const AllNotification = ({ ...rest }) => {
  const classes = useStyles();

  return (
    <Page className={classes.root} title="Event Create">
      <Container maxWidth="md">
        <NotificationContent content={rest.location.state?.notifications} />
      </Container>
    </Page>
  );
};

export default AllNotification;
