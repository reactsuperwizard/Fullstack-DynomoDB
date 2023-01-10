import { createSlice } from '@reduxjs/toolkit';
import axios from 'src/utils/axiosApiGateway';
import moment from 'moment';

const initialState = {
  events: [],
  isLoading: false,
  loaded: false,
  payouts: [],
  metaData: {}
};

const slice = createSlice({
  name: 'financial',
  initialState,
  reducers: {
    getEvents(state, action) {
      const { events } = action.payload;
      state.events = events;
      state.isLoading = false;
      state.loaded = true;
    },
    startLoading(state) {
      state.isLoading = true;
      state.loaded = false;
      state.payouts = [];
      state.events = [];
      state.metaData = {};
    },
    getPayouts(state, action) {
      const { payouts } = action.payload;
      state.payouts = payouts;
      state.isLoading = false;
      state.loaded = true;
    },
    getMetaData(state, action) {
      state.isLoading = false;
      state.loaded = true;
      const { metaData } = action.payload;
      state.metaData = metaData;
    }
  }
});

export const reducer = slice.reducer;

export const getEventsIncome = (
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

  response.data.message.forEach(e => {
    const from = moment
      .utc(e.from)
      .tz(user.timezone ? user.timezone.split(' ')[0] : moment.tz.guess())
      .format('YYYY-MM-DD HH:mm');
    const to = moment
      .utc(e.to)
      .tz(user.timezone ? user.timezone.split(' ')[0] : moment.tz.guess())
      .format('YYYY-MM-DD HH:mm');
    events.push({ ...e, from, to });
  });

  let len = events.length;
  let output = [];
  let discoveredSeries = [];

  for (let i = 0; i < len; i++) {
    if (discoveredSeries.indexOf(events[i].packageId) != -1) {
      const index = output.findIndex(o => o.packageId == events[i].packageId);
      if (moment(output[index].from).isAfter(events[i].from))
        output[index].from = events[i].from;
      if (moment(output[index].to).isBefore(events[i].from))
        output[index].to = events[i].to;
      continue;
    }
    if (events[i].packageId != null) {
      discoveredSeries.push(events[i].packageId);
    }
    output.push(events[i]);
  }
  events = output;
  console.log('events for financial page:>> ', events);
  dispatch(slice.actions.getEvents({ events }));
};

export const getPayouts = userId => async dispatch => {
  dispatch(slice.actions.startLoading());
  const response = await axios.post('/get_payouts', { userId });

  dispatch(slice.actions.getPayouts({ payouts: response.data.body }));
};

export const getMetaData = user => async dispatch => {
  dispatch(slice.actions.startLoading());
  const response = await axios.post('/get_financial_data', { user });
  dispatch(slice.actions.getMetaData({ metaData: response.data.body }));
};

export default slice;
