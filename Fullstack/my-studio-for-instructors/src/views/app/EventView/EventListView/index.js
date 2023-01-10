import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  makeStyles,
  Container,
  CircularProgress,
  Typography
} from '@material-ui/core';

import { getEvents } from 'src/slices/event';
import { useDispatch, useSelector } from 'src/store';

import Page from 'src/components/Page';
import Header from './Header';
import EventListView from './EventListView';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: 100
  }
}));

const Results = ({ className, staticContext, ...rest }) => {
  const styleClasses = useStyles();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const isMountedRef = useIsMountedRef();
  const { events, isLoading, loaded, visibleEvents, range } = useSelector(
    state => state.events
  );

  const loadingEvents = useCallback(() => {
    try {
      dispatch(getEvents(user));
    } catch (err) {
      console.error(err);
    }
  }, [isMountedRef]);

  useEffect(() => {
    loadingEvents();
  }, [loadingEvents]);

  return (
    <Page className={styleClasses.root} title="Class List">
      <Container maxWidth={false}>
        <Header />
        {visibleEvents && (
          <Box mt={3}>
            <EventListView
              events={events}
              isLoading={isLoading}
              visibleEvents={visibleEvents}
              range={range}
            />
          </Box>
        )}
        {isLoading && (
          <Box display="flex" justifyContent="center" mt={3}>
            <CircularProgress />
          </Box>
        )}
        {loaded && Object.keys(visibleEvents).length == 0 && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Typography variant="caption">
              Press [SCHEDULE EVENT] on the top-right corner to create your
              event.
            </Typography>
          </Box>
        )}
      </Container>
    </Page>
  );
};

export default Results;
