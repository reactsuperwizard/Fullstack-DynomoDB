import React, { useEffect } from 'react';
import {
  CardContent,
  CardHeader,
  Divider,
  Typography,
  GridList,
  GridListTile
} from '@material-ui/core/';

import { makeStyles } from '@material-ui/core/styles';
import { useDispatch } from 'src/store';
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
    }
  }
}));

const EventSeriesView = ({ seriesEvents, isPackage }) => {
  const classes = useStyles();
  const { user } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getClasss(user));
  }, [getClasss]);

  return (
    <>
      <CardHeader
        title={
          isPackage ? 'Other Events in This Package' : 'Other events in the Series'
        }
      />
      <Divider />
      {seriesEvents.length !== 0 ? (
        <CardContent className={classes.root}>
          <GridList className={classes.gridList} cols={2.5} cellHeight="auto">
            {seriesEvents.map((e, index) => (
              <GridListTile key={index} className={classes.gridTile}>
                <EventSeriesCard eventIns={e} />
              </GridListTile>
            ))}
          </GridList>
        </CardContent>
      ) : (
        <CardContent>
          <Typography>There are no upcoming events.</Typography>
        </CardContent>
      )}
    </>
  );
};

export default EventSeriesView;
