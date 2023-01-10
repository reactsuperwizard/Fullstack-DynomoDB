import React from 'react';
import { Container, makeStyles } from '@material-ui/core';
import Page from 'src/components/Page';
import Header from './Header';
import EventCreateForm from './EventCreateForm';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: 100
  }
}));

const EventCreateView = () => {
  const classes = useStyles();

  return (
    <Page className={classes.root} title="Event Create">
      <Container maxWidth="lg">
        <Header />
        <EventCreateForm />
      </Container>
    </Page>
  );
};

export default EventCreateView;
