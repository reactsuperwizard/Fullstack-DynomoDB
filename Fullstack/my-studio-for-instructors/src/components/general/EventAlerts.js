import React, { useMemo } from 'react';
import { CardMedia } from '@material-ui/core/';
import moment from 'moment';
import Alert from '@material-ui/lab/Alert';
import Countdown from 'react-countdown';
import useAuth from 'src/hooks/useAuth';

const EventAlerts = ({ eventIns }) => {
  const { user } = useAuth();
  const now = useMemo(() => {
    const tmp = user.timezone
      ? moment().tz(user.timezone.split(' ')[0])
      : moment();
    console.log('now :>> ', tmp.format('YYYY-MM-DD HH:mm'));
    console.log('test :>> ', eventIns.from.replace(' ', 'T'));
    console.log('isbefore?', moment(eventIns.from).isBefore(tmp));
    console.log('isafter?', moment(eventIns.to).isAfter(tmp));
    return tmp;
  });

  return (
    <CardMedia>
      {eventIns.deletedAt ? (
        <Alert icon={false} severity="error">
          This event has been canceled.
        </Alert>
      ) : (
        <>
          {moment(eventIns.from).isAfter(now) &&
            moment.duration(moment(eventIns.from).diff(now)).asHours() <= 5 && (
              <Alert icon={false} severity="info" style={{ borderRadius: 0 }}>
                Starts in{' '}
                {
                  <Countdown
                    date={eventIns.from.replace(' ', 'T')}
                    daysInHours={true}
                  />
                }
              </Alert>
            )}
          {moment(eventIns.from).isBefore(now) &&
            moment(eventIns.to).isAfter(now) && (
              <Alert
                icon={false}
                severity="warning"
                style={{ borderRadius: 0 }}
              >
                Ends in {<Countdown date={eventIns.to.replace(' ', 'T')} />}
              </Alert>
            )}
          {moment.duration(moment(eventIns.from).diff(now)).asHours() > 5 &&
            moment.duration(moment(eventIns.from).diff(now)).asDays() <= 5 && (
              <Alert
                icon={false}
                severity="success"
                style={{ borderRadius: 0 }}
              >
                Start in{' '}
                {moment.duration(moment(eventIns.from).diff(now)).get('days')}{' '}
                day(s) and{' '}
                {moment.duration(moment(eventIns.from).diff(now)).get('hours')}{' '}
                hours and{' '}
                {moment
                  .duration(moment(eventIns.from).diff(now))
                  .get('minutes')}{' '}
                minutes
              </Alert>
            )}
          {moment(eventIns.to).isBefore(now) && (
            <Alert
              icon={false}
              style={{
                borderRadius: 0,
                background: '#ededed',
                color: '#404040'
              }}
            >
              This event has ended.
            </Alert>
          )}
        </>
      )}
    </CardMedia>
  );
};

export default EventAlerts;
