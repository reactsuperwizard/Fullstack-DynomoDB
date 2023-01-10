import React, { useMemo } from 'react';
import {
  Grid,
  Box,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  makeStyles
} from '@material-ui/core/';
import moment from 'moment';
import EventAlerts from 'src/components/general/EventAlerts';

const useStyles = makeStyles(theme => ({
  quillView: {
    '& pre': {
      whiteSpace: 'inherit'
    },
    '& p': {
      '& span': {
        color: theme.palette.text.secondary + ' !important'
      }
    }
  },
  detailTxt: { fontSize: '110%', fontWeight: '200' }
}));

const EventDetailView = ({ eventIns, seriesEvents }) => {
  const classes = useStyles();

  const eventTime = useMemo(() => {
    const start_time = moment(eventIns.from).format('HH:mm');
    const end_time = moment(eventIns.to).format('HH:mm');
    const isNextDay =
      moment.duration(
        moment(end_time, 'HH:mm').diff(moment(start_time, 'HH:mm'))
      ) <= 0;
    console.log('detail view :>> ', isNextDay);
    return (
      moment(eventIns.from).format('hh:mm A') +
      ' - ' +
      moment(eventIns.to).format('hh:mm A') +
      (isNextDay ? ' +1 day' : '')
    );
  }, [eventIns]);

  return (
    <>
      <Divider />
      <EventAlerts eventIns={eventIns} />
      <CardContent>
        <Box mt={0} mb={0}>
          <Typography variant="subtitle2" color="textSecondary">
            Event Date
          </Typography>
        </Box>
        <Box mt={0} mb={0} pl={2} pr={2}>
          <Typography
            variant="body1"
            color="textSecondary"
            className={classes.detailTxt}
          >
            {moment(eventIns.from).format('dddd MMM D, yyyy')}
          </Typography>
        </Box>

        <Box mt={2} mb={0}>
          <Typography variant="subtitle2" color="textSecondary">
            Event Time
          </Typography>
        </Box>
        <Box mt={0} mb={0} pl={2} pr={2}>
          <Typography
            variant="body1"
            color="textSecondary"
            className={classes.detailTxt}
          >
            {eventTime}
          </Typography>
        </Box>

        <Grid container>
          <Grid item md={6} xs={12}>
            <Box mt={2} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                Type
              </Typography>
            </Box>
            <Box mt={0} mb={0} pl={2} pr={2}>
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
            <Box mt={0} mb={0} pl={2} pr={2}>
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

        <Box mt={2} mb={0}>
          <Typography variant="subtitle2" color="textSecondary">
            Notes
          </Typography>
        </Box>
        <Box mt={0} mb={0} pl={2} pr={2}>
          <Typography
            variant="body1"
            color="textSecondary"
            component={'span'}
            className={classes.detailTxt}
          >
            <div
              className={classes.quillView}
              dangerouslySetInnerHTML={{
                __html: eventIns.notes || '- - -'
              }}
            ></div>
          </Typography>
        </Box>
      </CardContent>
      <Divider />
      <CardHeader
        title={eventIns.isPackage ? 'Package Details' : 'Financials'}
      />
      <Divider />
      <CardContent>
        {eventIns.isPackage && (
          <>
            <Box mt={0} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                Number of Events
              </Typography>
            </Box>
            <Box mt={0} mb={2} pl={2} pr={2}>
              <Typography
                variant="body1"
                color="textSecondary"
                className={classes.detailTxt}
              >
                {seriesEvents.length + 1}
              </Typography>
            </Box>
          </>
        )}
        <Box mt={0} mb={0}>
          <Typography variant="subtitle2" color="textSecondary">
            Price
          </Typography>
        </Box>
        <Box mt={0} mb={0} pl={2} pr={2}>
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

        <Box mt={2} mb={0}>
          <Typography variant="subtitle2" color="textSecondary">
            Available Spaces
          </Typography>
        </Box>
        <Box mt={0} mb={0} pl={2} pr={2}>
          <Typography
            variant="body1"
            color="textSecondary"
            className={classes.detailTxt}
          >
            {eventIns.availableSpaces || '- - -'}
          </Typography>
        </Box>

        <Box mt={2} mb={0}>
          <Typography variant="subtitle2" color="textSecondary">
            Sold Tickets
          </Typography>
        </Box>
        <Box mt={0} mb={0} pl={2} pr={2}>
          <Typography
            variant="body1"
            color="textSecondary"
            component={'span'}
            className={classes.detailTxt}
          >
            {eventIns.soldTickets}
          </Typography>
        </Box>
      </CardContent>
    </>
  );
};

export default EventDetailView;
