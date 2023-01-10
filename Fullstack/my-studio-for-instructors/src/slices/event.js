import { createSlice } from '@reduxjs/toolkit';
import _ from 'lodash';
import moment from 'moment';
import axios from 'src/utils/axiosApiGateway';
import {
  getEventDates,
  getEventsFromRange,
  getCurrentRange,
  getNextRange,
  getPrevRange,
  getSeriesEvents
} from 'src/utils/eventUtils';

const initialState = {
  events: [],
  isLoading: false,
  visibleEvents: {},
  loaded: false,
  range: null,
  seriesEvents: [],
  comingEvents: [],
  cntTodayEvents: 0
};

const slice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    getEvents(state, action) {
      const { events, visibleEvents, range, cntTodayEvents } = action.payload;
      state.events = events;
      state.visibleEvents = visibleEvents;
      state.range = range;
      state.cntTodayEvents = cntTodayEvents;
      state.isLoading = false;
      state.loaded = true;
    },
    deleteEvent(state, action) {
      const { id } = action.payload;
      state.events = _.reject(state.events, { eventID: id });
    },
    createdEvents(state) {
      state.isLoading = false;
    },
    startLoading(state) {
      state.visibleEvents = {};
      state.comingEvents = [];
      state.isLoading = true;
      state.loaded = false;
      state.cntTodayEvents = 0;
    },
    getCurrentEvents(state) {
      const range = getCurrentRange(state.events);
      const visibleEvents = getEventsFromRange(state.events, range);
      state.range = range;
      state.visibleEvents = visibleEvents;
      console.log('current ev', visibleEvents);
    },
    getNextEvents(state) {
      const range = getNextRange(state.events, state.range);
      const visibleEvents = getEventsFromRange(state.events, range);
      state.range = range;
      state.visibleEvents = visibleEvents;
      console.log('next ev', visibleEvents);
    },
    getPrevEvents(state) {
      const range = getPrevRange(state.events, state.range);
      const visibleEvents = getEventsFromRange(state.events, range);
      state.range = range;
      state.visibleEvents = visibleEvents;
      console.log('prev ev', visibleEvents);
    },
    getSeries(state, action) {
      const { event } = action.payload;
      state.seriesEvents = getSeriesEvents(state.events, event);
    },
    getComingEvents(state, action) {
      const { events } = action.payload;
      state.comingEvents = events;
      state.isLoading = false;
      state.loaded = true;
    }
  }
});

export const reducer = slice.reducer;

export const getEvents = (
  user,
  fromTime = null,
  orderby = 'from_timestamp'
) => async dispatch => {
  dispatch(slice.actions.startLoading());
  const response = await axios.post('/get_events', {
    ...user,
    fromTime,
    orderby
  });

  let events = [];

  console.log('user.timezone :>> ', user.timezone);

  const today = moment().format('YYYY-MM-DD');

  let cntTodayEvents = 0;
  response.data.message.forEach(e => {
    if (moment.unix(e.createdAt).format('YYYY-MM-DD') == today) {
      cntTodayEvents++;
    }

    const from = moment
      .utc(e.from)
      .tz(
        Boolean(user.timezone) ? user.timezone.split(' ')[0] : moment.tz.guess()
      )
      .format('YYYY-MM-DD HH:mm');
    const to = moment
      .utc(e.to)
      .tz(
        Boolean(user.timezone) ? user.timezone.split(' ')[0] : moment.tz.guess()
      )
      .format('YYYY-MM-DD HH:mm');
    events.push({ ...e, from, to });
  });

  const range = getCurrentRange(events);
  const visibleEvents = getEventsFromRange(events, range);

  dispatch(
    slice.actions.getEvents({ events, visibleEvents, range, cntTodayEvents })
  );
};

export const getCurrent = () => async dispatch => {
  dispatch(slice.actions.getCurrentEvents());
};

export const getNext = () => async dispatch => {
  dispatch(slice.actions.getNextEvents());
};

export const getPrev = () => async dispatch => {
  dispatch(slice.actions.getPrevEvents());
};

export const deleteEvent = (event, userId) => async dispatch => {
  await axios.post('/delete_event', {
    id: event.eventId,
    packageId: event.packageId,
    userId
  });

  dispatch(slice.actions.deleteEvent({ id: event.eventID }));
};

export const updateEvent = event => async dispatch => {
  console.log('updaing event api call', event);
  // dispatch(slice.actions.updateClass(response.data));
  const result = await axios.post('/update_event', event);
  console.log('update result: ', result);
};

export const getSeries = event => async dispatch => {
  dispatch(slice.actions.getSeries({ event }));
};

export const getComingEvents = user => async dispatch => {
  dispatch(slice.actions.startLoading()); //'/get_events', { ...user, fromTime: null }
  const response = await axios.post('/get_events', {
    ...user,
    fromTime: moment.utc().format('YYYY-MM-DD HH:mm'),
    orderby: 'from_timestamp',
    limit: 10
  });

  let events = [];
  response.data.message.forEach(e => {
    const from = moment
      .utc(e.from)
      .tz(user.timezone.split(' ')[0])
      .format('YYYY-MM-DD HH:mm');
    const to = moment
      .utc(e.to)
      .tz(user.timezone.split(' ')[0])
      .format('YYYY-MM-DD HH:mm');
    events.push({ ...e, from, to });
  });

  dispatch(slice.actions.getComingEvents({ events }));
};

export const createEvents = data => async dispatch => {
  dispatch(slice.actions.startLoading());

  const { frequency, days } = data;

  let end = moment(data.end_date);
  let start = moment(data.start_date);
  let dates = [];

  data.is_package = data.is_package === 'is_package';
  if (data.is_package) {
    if (data.end_date !== data.start_date) {
      data.package_name =
        data.class_name +
        ' ' +
        start.format('MMMM D, YYYY') +
        ' - ' +
        end.format('MMMM D, YYYY');
    } else {
      data.package_name = data.class_name + ' ' + start.format('MMMM D, YYYY');
    }
  } else {
    data.package_name = null;
  }

  if (frequency !== 'norepeat') {
    if (
      (frequency === 'weekly' && days[start.day()]) ||
      frequency === 'daily'
    ) {
      dates.push(getEventDates(start, data));
    }

    while (end.date() != start.date()) {
      start.add(1, 'day');
      if (frequency === 'weekly' && days[start.day()] === false) continue;
      dates.push(getEventDates(start, data));
    }
  } else {
    dates.push(getEventDates(start, data));
  }

  data.dates = dates;

  console.log('uploading event data...', data);
  const response = await axios.post('/create_event', data);
  console.log('response from createEvent', response);
  // If the response is OK, let's create chatroom on firebase.

  dispatch(slice.actions.createdEvents());
};

export default slice;
