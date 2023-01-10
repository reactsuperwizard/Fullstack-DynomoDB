import moment from 'moment';

export const getEventDates = (start, data) => {
  const isNextDay =
    moment.duration(
      moment(data.end_time, 'HH:mm').diff(moment(data.start_time, 'HH:mm'))
    ) <= 0;
  const timezone = data.timezone.split(' ')[0];
  const timeStr = data.all_day
    ? 'All day'
    : moment(data.start_time, 'HH:mm').format('hh:mm A') +
      ' - ' +
      moment(data.end_time, 'HH:mm').format('hh:mm A') +
      (isNextDay ? ' +1 day' : '') +
      ' (' +
      timezone +
      ')';

  const event_name =
    data.class_name + ' ' + start.format('dddd MMMM D') + ' - ' + timeStr;

  return [
    moment
      .tz(start.format('YYYY-MM-DD') + ' ' + data.start_time, timezone)
      .utc()
      .format('YYYY-MM-DD HH:mm'),
    moment
      .tz(start.format('YYYY-MM-DD') + ' ' + data.end_time, timezone)
      .utc()
      .add(isNextDay ? 1 : 0, 'days')
      .format('YYYY-MM-DD HH:mm'),
    event_name
  ];
};

export const getEventsFromRange = (events, range) => {
  const e = {};
  for (let i = range.start.index; i <= range.end.index; i++) {
    if (!events[i]) break;
    const day = moment(events[i].from).day();
    if (e[day]) e[day].push(events[i]);
    else e[day] = [events[i]];
  }
  return e;
};

export const getCurrentRange = events => {
  const range = {
    start: {
      index: events.length,
      date:
        moment()
          .startOf('week')
          .format('YYYY-MM-DD') + ' 00:00'
    },
    end: {
      date:
        moment()
          .endOf('week')
          .format('YYYY-MM-DD') + ' 23:59',
      index: events.length
    }
  };

  let i = 0;
  for (i = 0; i < events.length; i++) {
    if (moment(events[i].from).isAfter(moment(range.start.date))) {
      range.start.index = i;
      break;
    }
  }

  for (; i < events.length; i++) {
    if (moment(events[i].from).isAfter(moment(range.end.date))) {
      range.end.index = i - 1;
      break;
    }
  }

  return range;
};

export const getNextRange = (events, prev_range) => {
  console.log('prev_range :>> ', prev_range);
  const range = {
    start: {
      index: events.length,
      date:
        moment(prev_range.start.date)
          .add(7, 'days')
          .format('YYYY-MM-DD') + ' 00:00'
    },
    end: {
      date:
        moment(prev_range.end.date)
          .add(7, 'days')
          .format('YYYY-MM-DD') + ' 23:59',
      index: events.length
    }
  };

  let i = 0;
  for (; i < events.length; i++) {
    if (moment(events[i].from).isAfter(moment(range.start.date))) {
      range.start.index = i;
      break;
    }
  }

  for (; i < events.length; i++) {
    if (moment(events[i].from).isAfter(moment(range.end.date))) {
      range.end.index = i - 1;
      break;
    }
  }

  return range;
};

export const getPrevRange = (events, prev_range) => {
  const range = {
    start: {
      index: 0,
      date:
        moment(prev_range.start.date)
          .add(-7, 'days')
          .format('YYYY-MM-DD') + ' 00:00'
    },
    end: {
      date:
        moment(prev_range.end.date)
          .add(-7, 'days')
          .format('YYYY-MM-DD') + ' 23:59',
      index: -1
    }
  };

  let i = events.length - 1;
  for (; i >= 0; i--) {
    if (moment(range.end.date).isAfter(moment(events[i].from))) {
      range.end.index = i;
      break;
    }
  }

  for (; i >= 0; i--) {
    if (moment(range.start.date).isAfter(moment(events[i].from))) {
      range.start.index = i + 1;
      break;
    }
  }

  return range;
};

export const getSeriesEvents = (events, event) => {
  return events.filter(
    e => e.seriesId == event.seriesId && e.eventId !== event.eventId
  );
};
