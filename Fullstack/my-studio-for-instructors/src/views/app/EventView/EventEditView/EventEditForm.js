import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import moment from 'moment';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import {
  Box,
  Card,
  CardContent,
  FormHelperText,
  Grid,
  Paper,
  TextField,
  Typography,
  makeStyles,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  CardHeader,
  Divider
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';

import QuillEditor from 'src/components/QuillEditor';
import SubmitButton from 'src/components/general/SubmitButton';
import GoogleAutoPlaceInput from 'src/components/GoogleAutoPlaceInput';

import { useDispatch, useSelector } from 'src/store';
import { getClasss } from 'src/slices/class';
import { updateEvent } from 'src/slices/event';
import useAuth from 'src/hooks/useAuth';
import AccessTimeIcon from '@material-ui/icons/AccessTime';

import { eventEditSchema, getInitialValue } from './FormMeta';
import { KeyboardDatePicker, KeyboardTimePicker } from '@material-ui/pickers';

const useStyles = makeStyles(() => ({
  root: {},
  editor: {
    '& .ql-editor': {
      height: 200
    }
  },
  buttonProgress: {
    position: 'absolute',
    top: '40%',
    left: '41%'
  },
  relativeWrapper: {
    position: 'relative'
  },
  DayBtnGroup: { textAlign: 'center', marginLeft: 80, marginRight: 80 },
  mt20: {
    marginTop: 20
  }
}));

const EventEditForm = ({ className, eventIns, ...rest }) => {
  const classes = useStyles();
  const history = useHistory();
  const [eventDuration, setEventDuration] = useState('1 hour');
  const [eventEndsNextDay, setEventEndsNextDay] = useState(false);

  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [days, setDays] = useState([
    false,
    false,
    false,
    false,
    false,
    false,
    false
  ]);

  const { classs } = useSelector(state => state.classes);

  useEffect(() => {
    onChangeDays(new Date().getDay());
    dispatch(getClasss(user));
    console.log('event detail in EditView', eventIns);
  }, []);

  useEffect(() => {
    const start_time = moment(eventIns.from).format('HH:mm');
    const end_time = moment(eventIns.to).format('HH:mm');
    updateEventDuration(moment(start_time, 'HH:mm'), moment(end_time, 'HH:mm'));
  }, [eventIns]);

  const {
    errors,
    handleBlur,
    handleChange,
    handleSubmit,
    isSubmitting,
    setFieldValue,
    touched,
    setErrors,
    values
  } = useFormik({
    initialValues: getInitialValue(eventIns),
    validationSchema: eventEditSchema,
    onSubmit: async (values, { setErrors, setStatus, setSubmitting }) => {
      try {
        if (eventIns.isPackage && values.packageName == '') {
          setErrors({ packageName: 'Package Name is a required field' });
          return;
        }
        if (values[values.type] == '') {
          setErrors({ [values.type]: values.type + ' is a required field.' });
          return;
        }

        const from_timestamp = moment
          .tz(
            values.event_date + ' ' + values.start_time.split(' ')[1],
            user.timezone.split(' ')[0]
          )
          .utc()
          .format('YYYY-MM-DD HH:mm');
        const to_timestamp = moment
          .tz(
            moment(values.event_date)
              .add(eventEndsNextDay ? 1 : 0, 'days')
              .format('YYYY-MM-DD') +
              ' ' +
              values.end_time.split(' ')[1],
            user.timezone.split(' ')[0]
          )
          .utc()
          .format('YYYY-MM-DD HH:mm');

        await dispatch(
          updateEvent({
            ...eventIns,
            ...values,
            from_timestamp,
            to_timestamp,
            userId: user.id,
            timezone: user.timezone
          })
        );

        setStatus({ success: true });
        setSubmitting(false);
        enqueueSnackbar('Event Updated', {
          variant: 'success'
        });

        history.push('/app/events');
      } catch (err) {
        console.error(err);
        setStatus({ success: false });
        setErrors({ submit: err.message });
        setSubmitting(false);
      }
    }
  });

  const onChangeDays = day => {
    const _days = [...days];
    _days[day] = !_days[day];
    setDays(_days);
  };

  const onChangeStartTime = time => {
    if (!time || !time.isValid()) {
      setErrors({ start_time: 'Invalid Time Format' });
      return;
    }

    const endM = moment(values.end_time);
    const startM = moment(values.start_time);
    const dm = time.diff(startM, 'minutes');
    const newEndM = endM.add(dm, 'minutes');
    setFieldValue('end_time', newEndM.format('YYYY-MM-DD HH:mm'));
    updateEventDuration(time, newEndM);
    setFieldValue('start_time', time.format('YYYY-MM-DD HH:mm'));
  };

  const onChangeEndTime = time => {
    const startM = moment(values.start_time);
    updateEventDuration(startM, time);
    setFieldValue('end_time', time.format('YYYY-MM-DD HH:mm'));
  };

  const updateEventDuration = (startTime, endTime) => {
    const isNextDay = moment.duration(endTime.diff(startTime)) <= 0;
    setEventEndsNextDay(isNextDay);
    let duration = isNextDay
      ? moment.duration(endTime.add(1, 'days').diff(startTime))
      : (duration = moment.duration(endTime.diff(startTime)));

    const durationHours =
      duration.get('days') == 1
        ? '24 hours'
        : duration.get('hours') == 0
        ? ''
        : duration.get('hours') == 1
        ? '1 hour'
        : duration.get('hours') + ' hours';
    const durationMins =
      duration.get('minutes') == 0
        ? ''
        : duration.get('hours') > 0
        ? ' ' + duration.get('minutes') + ' minutes'
        : duration.get('minutes') + ' minutes';
    setEventDuration(durationHours + '' + durationMins);
  };

  const onSwitchAllDay = e => {
    if (e.target.checked) {
      setFieldValue('start_time', moment().format('YYYY-MM-DD') + ' 00:00');
      setFieldValue('end_time', moment().format('YYYY-MM-DD') + ' 00:00');
      setEventEndsNextDay(true);
    } else {
      setFieldValue(
        'start_time',
        moment(eventIns.from).format('YYYY-MM-DD HH:mm')
      );
      setFieldValue('end_time', moment(eventIns.to).format('YYYY-MM-DD HH:mm'));

      updateEventDuration(moment(eventIns.from), moment(eventIns.to));
    }
    handleChange(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx(classes.root, className)}
      {...rest}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} lg={12}>
          <Card>
            {eventIns.isPackage && (
              <>
                <CardHeader title="Package Details" />
                <Divider />
                <CardContent style={{ paddingTop: 0, paddingBottom: 30 }}>
                  <TextField
                    error={
                      Boolean(touched.packageName && errors.packageName) ||
                      Boolean(touched.packageName && values.packageName == '')
                    }
                    helperText={
                      (touched.packageName && errors.packageName) ||
                      (touched.packageName &&
                        values.packageName == '' &&
                        'Package Name is a required field')
                    }
                    fullWidth
                    label="Package Name"
                    name="packageName"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.packageName}
                    fullWidth
                    variant="outlined"
                    className={classes.mt20}
                  />
                  <Autocomplete
                    id="combo-box-demo"
                    options={classs}
                    getOptionLabel={option =>
                      typeof option === 'string' ? option : option.name
                    }
                    onChange={(e, v) => {
                      setFieldValue('classId', v ? v.id : '');
                    }}
                    fullWidth
                    value={classs.find(v => v.id === values.classId) || null}
                    renderInput={params => (
                      <TextField
                        {...params}
                        label="Class Name"
                        error={Boolean(touched.classId && errors.classId)}
                        helperText={touched.classId && errors.classId}
                        variant="outlined"
                        name="classId"
                      />
                    )}
                    className={classes.mt20}
                  />
                </CardContent>
                <CardContent style={{ paddingTop: 0, paddingBottom: 30 }}>
                  <Grid container spacing={4}>
                    <Grid item md={6} xs={12}>
                      <TextField
                        error={Boolean(touched.price && errors.price)}
                        fullWidth
                        helperText={touched.price && errors.price}
                        label="Package Price"
                        name="price"
                        type="number"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.price}
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              ({user.currency})
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <TextField
                        error={Boolean(
                          touched.availableSpaces && errors.availableSpaces
                        )}
                        fullWidth
                        helperText={
                          touched.availableSpaces && errors.availableSpaces
                        }
                        type="number"
                        label="Package Available Spaces"
                        name="availableSpaces"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.availableSpaces}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </>
            )}
            <Divider />
            <CardHeader title="Event Details" />
            <Divider />
            <CardContent style={{ paddingTop: 0 }}>
              {!eventIns.isPackage && (
                <Autocomplete
                  id="combo-box-demo"
                  options={classs}
                  getOptionLabel={option =>
                    typeof option === 'string' ? option : option.name
                  }
                  onChange={(e, v) => {
                    setFieldValue('classId', v ? v.id : '');
                  }}
                  fullWidth
                  value={classs.find(v => v.id === values.classId) || null}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Class Name"
                      error={Boolean(touched.classId && errors.classId)}
                      helperText={touched.classId && errors.classId}
                      variant="outlined"
                      name="classId"
                    />
                  )}
                  className={classes.mt20}
                />
              )}
              <TextField
                error={Boolean(touched.name && errors.name)}
                helperText={touched.name && errors.name}
                label="Event Name"
                name="name"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.name}
                fullWidth
                variant="outlined"
                className={classes.mt20}
              />
              <Box mt={3} mb={0}>
                <Grid container spacing={4}>
                  <Grid item md={6} xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.all_day}
                          onChange={onSwitchAllDay}
                          name="all_day"
                          color="primary"
                        />
                      }
                      label="All day"
                    />
                  </Grid>
                </Grid>
              </Box>
              <Box mt={0} mb={1}>
                <Grid container spacing={4}>
                  <Grid item md={6} xs={12}>
                    <KeyboardDatePicker
                      fullWidth
                      inputVariant="outlined"
                      label="Event Date"
                      name="event_date"
                      InputLabelProps={{
                        shrink: true
                      }}
                      format="MM/DD/YYYY"
                      margin="normal"
                      error={Boolean(errors.event_date)}
                      helperText={errors.event_date}
                      value={values.event_date}
                      onChange={date =>
                        setFieldValue('event_date', date.format('YYYY-MM-DD'))
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
              {values.all_day === false && (
                <Box mt={3} mb={1}>
                  <Grid container spacing={4}>
                    <Grid item md={6} xs={12}>
                      <KeyboardTimePicker
                        fullWidth
                        name="start_time"
                        label="Start time"
                        mask="__:__ _M"
                        inputVariant="outlined"
                        InputLabelProps={{
                          shrink: true
                        }}
                        value={values.start_time}
                        onChange={onChangeStartTime}
                        keyboardIcon={<AccessTimeIcon />}
                      />
                      {/* <TextField
                        id="time"
                        label="Start time"
                        type="time"
                        fullWidth
                        name="start_time"
                        onChange={onChangeStartTime}
                        value={values.start_time}
                        className={classes.textField}
                        variant="outlined"
                        InputLabelProps={{
                          shrink: true
                        }}
                        inputProps={{
                          step: 300 // 5 min
                        }}
                      /> */}
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <KeyboardTimePicker
                        fullWidth
                        name="end_time"
                        mask="__:__ _M"
                        label={
                          eventEndsNextDay
                            ? 'End time (' + eventDuration + ') +1 day'
                            : 'End time (' + eventDuration + ')'
                        }
                        inputVariant="outlined"
                        InputLabelProps={{
                          shrink: true
                        }}
                        keyboardIcon={<AccessTimeIcon />}
                        error={Boolean(errors.end_time)}
                        helperText={errors.end_time}
                        value={values.end_time}
                        onChange={onChangeEndTime}
                      />
                      {/* <TextField
                        id="time"
                        label={
                          eventEndsNextDay
                            ? 'End time (' + eventDuration + ') +1 day'
                            : 'End time (' + eventDuration + ')'
                        }
                        type="time"
                        fullWidth
                        name="end_time"
                        onChange={onChangeEndTime}
                        value={values.end_time}
                        className={classes.textField}
                        error={Boolean(errors.end_time)}
                        helperText={errors.end_time}
                        variant="outlined"
                        InputLabelProps={{
                          shrink: true
                        }}
                        inputProps={{
                          step: 300 // 5 min,
                        }}
                      /> */}
                    </Grid>
                  </Grid>
                </Box>
              )}
              <Box mt={3} mb={1}>
                <Grid container spacing={4}>
                  <Grid item md={6} xs={12}>
                    <TextField
                      fullWidth
                      label="Event type"
                      name="type"
                      disabled
                      variant="outlined"
                      value={
                        (eventIns.location && 'In-person') ||
                        (eventIns.zoomData && 'Zoom') ||
                        (eventIns.other && 'Other')
                      }
                    />
                  </Grid>
                  <Grid item md={6} xs={12}>
                    {eventIns.location && (
                      <GoogleAutoPlaceInput
                        onChange={addr => {
                          setFieldValue('place_id', addr ? addr.place_id : '');
                          setFieldValue(
                            'location',
                            addr ? addr.description : ''
                          );
                        }}
                        error={Boolean(errors.location)}
                        helperText={errors.location}
                        defaultValue={eventIns.location}
                      />
                    )}
                    {eventIns.zoomData && (
                      <TextField
                        fullWidth
                        label="Zoom Link"
                        disabled
                        variant="outlined"
                        value={
                          eventIns.zoomData.start_url.split('?')[0] || ' - - - '
                        }
                      />
                    )}
                    {eventIns.other && (
                      <TextField
                        error={Boolean(touched.other && errors.other)}
                        helperText={touched.other && errors.other}
                        fullWidth
                        label="Other"
                        name="other"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.other}
                        variant="outlined"
                      />
                    )}
                  </Grid>
                </Grid>
              </Box>
              {!eventIns.isPackage && (
                <Box mt={3} mb={1}>
                  <Grid container spacing={4}>
                    <Grid item md={6} xs={12}>
                      <TextField
                        error={Boolean(touched.price && errors.price)}
                        fullWidth
                        helperText={touched.price && errors.price}
                        label="Price"
                        name="price"
                        type="number"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.price}
                        variant="outlined"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              ({user.currency})
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <TextField
                        error={Boolean(
                          touched.availableSpaces && errors.availableSpaces
                        )}
                        fullWidth
                        helperText={
                          touched.availableSpaces && errors.availableSpaces
                        }
                        type="number"
                        label="Available Spaces"
                        name="availableSpaces"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.availableSpaces}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
              <Box mt={3} mb={1}>
                <Typography variant="subtitle2" color="textSecondary">
                  Notes
                </Typography>
              </Box>
              <Paper variant="outlined">
                <QuillEditor
                  className={classes.editor}
                  value={values.notes}
                  onChange={value => setFieldValue('notes', value)}
                />
              </Paper>
              {touched.notes && errors.notes && (
                <Box mt={2}>
                  <FormHelperText error>{errors.notes}</FormHelperText>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {errors.submit && (
        <Box mt={3}>
          <FormHelperText error>{errors.submit}</FormHelperText>
        </Box>
      )}
      <Box mt={2} display="flex" justifyContent="flex-start">
        <SubmitButton text="Save Event" isSubmitting={isSubmitting} />
      </Box>
    </form>
  );
};

EventEditForm.propTypes = {
  className: PropTypes.string
};

export default EventEditForm;
