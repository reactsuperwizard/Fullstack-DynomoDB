import React, { useEffect, useCallback } from 'react';
import {
  Box,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  GridList,
  GridListTile,
  Card,
  CircularProgress
} from '@material-ui/core/';

import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector } from 'src/store';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { getComingEvents } from 'src/slices/event';
import useAuth from 'src/hooks/useAuth';
import { getClasss } from 'src/slices/class';

import EventSeriesCard from 'src/components/general/EventSeriesCard';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper
  },
  gridList: {
    flexWrap: 'nowrap',
    transform: 'translateZ(0)'
  },
  gridTile: {
    marginRight: 10,
    marginBottom: 10,
    [theme.breakpoints.down('xs')]: {
      width: '80vw !important'
    },
    [theme.breakpoints.up('sm')]: {
      width: '480px !important'
    },
    height: 'auto'
  }
}));

const EventSeriesView = () => {
  const classes = useStyles();
  const isMountedRef = useIsMountedRef();
  const { isLoading, loaded, comingEvents } = useSelector(
    state => state.events
  );

  const dispatch = useDispatch();
  const { user } = useAuth();

  const loadingEvents = useCallback(() => {
    try {
      dispatch(getComingEvents(user));
    } catch (err) {
      console.error(err);
    }
  }, [isMountedRef]);

  useEffect(() => {
    loadingEvents();
  }, [loadingEvents]);

  useEffect(() => {
    dispatch(getClasss(user));
  }, [getClasss]);

  return (
    <Card>
      <CardHeader title="Upcoming Events" />
      <Divider />
      <CardContent className={classes.root}>
        {loaded && comingEvents.length !== 0 && (
          <GridList className={classes.gridList} cols={2.5} cellHeight="auto">
            {comingEvents.map((e, index) => (
              <GridListTile key={index} className={classes.gridTile}>
                <EventSeriesCard eventIns={e} />
              </GridListTile>
            ))}
          </GridList>
        )}
        {isLoading && (
          <Box display="flex" justifyContent="center" mt={3}>
            <CircularProgress />
          </Box>
        )}
        {loaded && comingEvents.length === 0 && (
          <Typography>There are no upcoming events.</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default EventSeriesView;
