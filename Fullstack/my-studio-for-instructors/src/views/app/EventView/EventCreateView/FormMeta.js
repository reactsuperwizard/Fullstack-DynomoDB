import * as Yup from 'yup';
import moment from 'moment';

export const eventCreateSchema = Yup.object().shape({
  class_id: Yup.string()
    .max(255)
    .required('Class ID is a required field'),
  zoom_link: Yup.string().max(255),
  location: Yup.string().max(255),
  other: Yup.string().max(255),
  price: Yup.number()
    .min(0)
    .required('Price is a required field'),
  type: Yup.string().max(255),
  is_package: Yup.string().max(255),
  frequency: Yup.string().max(255),
  start_date: Yup.string()
    .max(255)
    .required(),
  start_time: Yup.string()
    .max(255)
    .required(),
  end_time: Yup.string()
    .max(255)
    .required('End time is a required field.'),
  available_spaces: Yup.number()
    .min(1, 'Available spaces must be greater than or equal to 1.')
    .max(100, 'Available spaces must be less than 100.')
    .required('Available spaces is a required field'),
  notes: Yup.string().max(1000)
});

export const getInitialValue = (location, user) => ({
  class_id: location.state ? location.state.classId : '',
  class_name: location.state ? location.state.classsName : '',
  place_id: user.googlePlaceId,
  timezone: user.timezone,
  currency: user.currency,
  zoom_link: '',
  other: '',
  notes: '',
  price: '',
  start_date: moment().format('YYYY-MM-DD'),
  end_date: null,
  start_time:
    moment()
      .add(1, 'hours')
      .format('YYYY-MM-DD HH') + ':00',
  end_time:
    moment()
      .add(2, 'hours')
      .format('YYYY-MM-DD HH') + ':00',
  frequency: 'norepeat',
  available_spaces: '',
  type: 'location',
  location: user.address || '',
  all_day: false,
  is_package: 'is_individual',
  submit: null,
  showZoomAlert: false
});

export const getCntEvents = (start, end, days) => {
  const cnt = moment(end).diff(moment(start), 'days');
  if (!days) return cnt + 1;
  let cntDays = 0;

  for (let ss = moment(start); ss.isBefore(end); ss = ss.add(1, 'days')) {
    if (days[ss.day()] == true) cntDays++;
  }

  return cntDays;
};
