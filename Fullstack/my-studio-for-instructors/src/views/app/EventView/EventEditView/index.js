import React from 'react';
import { Container, makeStyles } from '@material-ui/core';
import Page from 'src/components/Page';
import Header from './Header';
import EventEditForm from './EventEditForm';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: 100
  }
}));

const EventEditView = ({ ...rest }) => {
  const classes = useStyles();

  return (
    <Page className={classes.root} title="Event Create">
      <Container maxWidth="lg">
        <Header name={rest.location.state.event.name} />
        <EventEditForm eventIns={rest.location.state.event} />
      </Container>
    </Page>
  );
};

export default EventEditView;
