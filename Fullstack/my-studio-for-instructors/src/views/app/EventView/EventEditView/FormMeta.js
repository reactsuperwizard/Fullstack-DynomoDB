import * as Yup from 'yup';
import moment from 'moment';

export const eventEditSchema = Yup.object().shape({
  classId: Yup.string()
    .max(255)
    .required('Class ID is a required field'),
  price: Yup.number()
    .min(0)
    .required('Price is a required field'),
  type: Yup.string().max(255),
  event_date: Yup.string()
    .max(255)
    .required(),
  name: Yup.string()
    .max(255)
    .required(),
  start_time: Yup.string()
    .max(255)
    .required(),
  end_time: Yup.string()
    .max(255)
    .required(),
  packageName: Yup.string().max(255),
  availableSpaces: Yup.number()
    .min(1, 'Available spaces must be greater than or equal to 1.')
    .max(100, 'Available spaces must be less than 100.')
    .required('Available Spaces is a required field'),
  notes: Yup.string().max(1000)
});

export const getInitialValue = eventIns => ({
  classId: eventIns.classId,
  packageName: eventIns.isPackage ? eventIns.packageName : '',
  currency: eventIns.currency,
  zoomData: eventIns.zoomData,
  other: eventIns.other,
  notes: eventIns.notes,
  name: eventIns.name,
  price: eventIns.price,
  event_date: moment(eventIns.from).format('YYYY-MM-DD'),
  start_time: moment(eventIns.from).format('YYYY-MM-DD HH:mm'),
  end_time: moment(eventIns.to).format('YYYY-MM-DD HH:mm'),
  availableSpaces: eventIns.availableSpaces,
  type:
    (eventIns.location && 'location') ||
    (eventIns.zoomData && 'zoom') ||
    (eventIns.other && 'other'),
  location: eventIns.location,
  place_id: eventIns.place_id,
  all_day:
    moment(eventIns.from).format('HH:mm') == '12:00' &&
    moment(eventIns.to).format('HH:mm') == '23:59',
  submit: null
});
