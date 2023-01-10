import React, { useMemo } from 'react';
import {
  Box,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Card,
  IconButton
} from '@material-ui/core/';
import moment from 'moment';
import { makeStyles } from '@material-ui/core/styles';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import { useHistory } from 'react-router-dom';
import EventAlerts from './EventAlerts';
import { useSelector } from 'src/store';

const useStyles = makeStyles(theme => ({
  title: {
    color: 'white',
    fontSize: '110%'
  },
  detailTxt: { fontSize: '110%', fontWeight: '200' },
  main: {
    backgroundColor: '#1AAAE3',
    border: '1px solid lightgray',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    height: 'auto'
  },
  header: {
    alignItems: 'flex-start',
    height: 'auto'
  }
}));

const EventSeriesCard = ({ eventIns }) => {
  const classes = useStyles();
  const history = useHistory();
  const { classs } = useSelector(state => state.classes);

  const handleView = () => {
    const clas = classs.find(o => o.id === eventIns.classId);
    history.push('/app/events/view', { event: eventIns, clas });
  };

  const eventTime = useMemo(() => {
    const start_time = moment(eventIns.from).format('HH:mm');
    const end_time = moment(eventIns.to).format('HH:mm');
    const isNextDay =
      moment.duration(
        moment(end_time, 'HH:mm').diff(moment(start_time, 'HH:mm'))
      ) <= 0;
    return (
      moment(eventIns.from).format('hh:mm A') +
      ' - ' +
      moment(eventIns.to).format('hh:mm A') +
      (isNextDay ? ' +1 day' : '')
    );
  }, [eventIns]);

  return (
    <Card className={classes.main}>
      <CardHeader
        className={classes.header}
        titleTypographyProps={{ className: classes.title }}
        action={
          <IconButton onClick={handleView}>
            <Typography style={{ marginRight: 5, color: 'white' }}>
              View
            </Typography>
            <ArrowForwardIcon style={{ color: 'white' }} />
          </IconButton>
        }
        title={eventIns.name + (eventIns.deletedAt ? ' CANCELED' : '')}
        style={{ backgroundColor: eventIns.isPackage ? '#846dcf' : '#1AAAE3' }}
      />
      <EventAlerts eventIns={eventIns} />
      <CardContent style={{ backgroundColor: 'white', flex: 1 }}>
        <Grid container>
          {eventIns.isPackage && (
            <Grid item md={12} xs={12}>
              <Box mt={0} mb={0}>
                <Typography variant="subtitle2" color="textSecondary">
                  Package
                </Typography>
              </Box>
              <Box mt={0} mb={0}>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  className={classes.detailTxt}
                >
                  {eventIns.packageName}
                </Typography>
              </Box>
            </Grid>
          )}
          <Grid item md={6} xs={6}>
            <Box mt={1} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                Event Date
              </Typography>
            </Box>
            <Box mt={0} mb={0}>
              <Typography
                variant="body1"
                color="textSecondary"
                className={classes.detailTxt}
              >
                {moment(eventIns.from).format('YYYY-MM-DD')}
              </Typography>
            </Box>
          </Grid>
          <Grid item md={6} xs={6}>
            <Box mt={1} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                Event Time
              </Typography>
            </Box>
            <Box mt={0} mb={0}>
              <Typography
                variant="body1"
                color="textSecondary"
                className={classes.detailTxt}
              >
                {eventTime}
              </Typography>
            </Box>
          </Grid>
          <Grid container>
            <Grid item md={6} xs={12}>
              <Box mt={2} mb={0}>
                <Typography variant="subtitle2" color="textSecondary">
                  Type
                </Typography>
              </Box>
              <Box mt={0} mb={0}>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  component={'span'}
                  className={classes.detailTxt}
                >
                  {eventIns.location ? 'In-person' : ''}
                  {eventIns.zoomData ? 'Zoom' : ''}
                  {eventIns.other ? 'Other' : ''}
                </Typography>
              </Box>
            </Grid>
            <Grid item md={6} xs={12}>
              <Box mt={2} mb={0}>
                <Typography variant="subtitle2" color="textSecondary">
                  {eventIns.location ? 'Location' : ''}
                  {eventIns.zoomData ? 'Zoom Link' : ''}
                  {eventIns.other ? 'Other' : ''}
                </Typography>
              </Box>
              <Box mt={0} mb={0}>
                <Typography
                  variant="body1"
                  color="textSecondary"
                  component={'span'}
                  className={classes.detailTxt}
                >
                  {eventIns.location ? eventIns.location || ' - - - ' : ''}
                  {eventIns.zoomData ? (
                    <a
                      href={eventIns.zoomData.start_url}
                      target="_blank"
                      style={{ wordBreak: 'break-word' }}
                    >
                      {eventIns.zoomData.start_url.split('?')[0] || ' - - - '}
                    </a>
                  ) : (
                    ''
                  )}
                  {eventIns.other ? eventIns.other || ' - - - ' : ''}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          <Grid item md={6} xs={6}>
            <Box mt={1} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                Price
              </Typography>
            </Box>
            <Box mt={0} mb={0}>
              <Typography
                variant="body1"
                color="textSecondary"
                className={classes.detailTxt}
              >
                {Number(eventIns.price).toLocaleString('en-US', {
                  style: 'currency',
                  currency: eventIns.currency
                }) +
                  ' ' +
                  eventIns.currency}
              </Typography>
            </Box>
          </Grid>
          <Grid item md={6} xs={6}>
            <Box mt={1} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                Available Spaces / Sold
              </Typography>
            </Box>
            <Box mt={0} mb={0}>
              <Typography
                variant="body1"
                color="textSecondary"
                className={classes.detailTxt}
              >
                {eventIns.availableSpaces || '-'} / {eventIns.soldTickets}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default EventSeriesCard;
