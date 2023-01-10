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
  Radio,
  makeStyles,
  RadioGroup,
  Checkbox,
  FormControlLabel,
  ButtonGroup,
  Button,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@material-ui/core';

import Autocomplete from '@material-ui/lab/Autocomplete';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import QuillEditor from 'src/components/QuillEditor';
import { useDispatch, useSelector } from 'src/store';

import { getClasss } from 'src/slices/class';
import { createEvents, getEvents } from 'src/slices/event';

import { v4 as uuidv4 } from 'uuid';
import SubmitButton from 'src/components/general/SubmitButton';
import {
  DayBtnGrpData,
  frequency,
  schedule_types,
  EVENT_CNT_LIMIT_ADAY,
  EVENT_CNT_LIMIT_SERIAL
} from 'src/utils/constants';

import useAuth from 'src/hooks/useAuth';
import GoogleAutoPlaceInput from 'src/components/GoogleAutoPlaceInput';
import { useLocation } from 'react-router-dom';
import { eventCreateSchema, getInitialValue, getCntEvents } from './FormMeta';

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
  },
  shareDlgBox: {
    padding: '14px 30px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around'
  },
  shareDlgBtn: {
    textTransform: 'initial'
  }
}));

const EventCreateForm = ({ className, ...rest }) => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const { classs } = useSelector(state => state.classes);
  const { cntTodayEvents } = useSelector(state => state.events);

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

  const [eventDuration, setEventDuration] = useState('1 hour');
  const [cntEvents, setCntEvents] = useState(0);
  const [showLimited, setShowLimited] = useState(false);
  const [eventEndsNextDay, setEventEndsNextDay] = useState(
    moment()
      .add(1, 'hours')
      .format('HH') == '23'
      ? true
      : false
  );

  const {
    errors,
    handleBlur,
    handleChange,
    handleSubmit,
    isSubmitting,
    setFieldValue,
    touched,
    setErrors,
    setValues,
    values
  } = useFormik({
    initialValues: getInitialValue(location, user),
    validationSchema: eventCreateSchema,
    onSubmit: async (values, { setErrors, setStatus, setSubmitting }) => {
      try {
        values.days = days;
        if (values.frequency !== 'norepeat') {
          if (values.end_date == null) {
            setErrors({ end_date: 'End date is a required field.' });
            return;
          }

          if (cntEvents >= EVENT_CNT_LIMIT_SERIAL) {
            enqueueSnackbar('You can only create events up to 25.', {
              variant: 'error'
            });
            return;
          }

          //check the event create limit
          if (cntEvents + cntTodayEvents >= EVENT_CNT_LIMIT_ADAY) {
            enqueueSnackbar(
              'You can only create events up to 100 a day, try it tomorrow.',
              {
                variant: 'error'
              }
            );
            return;
          }
        }

        if (values[values.type] === undefined || values[values.type] === '') {
          setErrors({
            [values.type]:
              values.type.charAt(0).toUpperCase() +
              values.type.slice(1) +
              ' is a required field.'
          });
          return;
        }

        for (const tt of schedule_types) {
          if (values.type != tt.id) {
            values[tt.id] = null;
          }
        }

        const { id, avatar, name, email } = user;

        const event_series_id =
          values.frequency != 'norepeat' ? uuidv4() : null;

        console.log('events create data :>> ', values);

        await dispatch(
          createEvents({
            ...values,
            event_series_id,
            user_id: id,
            start_time: values.start_time.split(' ')[1],
            end_time: values.end_time.split(' ')[1],
            user_avatar: avatar,
            username: name,
            user_email: email,
            event_count: cntEvents
          })
        );

        setStatus({ success: true });
        setSubmitting(false);
        enqueueSnackbar('Event Created', {
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

  useEffect(() => {
    onChangeDays(new Date().getDay());
    dispatch(getClasss(user));
    dispatch(getEvents(user));
  }, []);

  useEffect(() => {
    if (cntTodayEvents >= EVENT_CNT_LIMIT_ADAY - 1) {
      setShowLimited(true);
    }
  }, [cntTodayEvents]);

  const onChangeDays = day => {
    const _days = [...days];
    _days[day] = !_days[day];
    setDays(_days);
    console.log('days :>> ', days);
    setCntEvents(getCntEvents(values.start_date, values.end_date, _days));
  };

  const onChangeStartDate = date => {
    if (!date.isValid()) {
      setErrors({ start_date: 'Invalid date format' });
      return;
    }

    const seletedDate = date.format('YYYY-MM-DD');
    if (moment(values.end_date).isBefore(seletedDate)) {
      setFieldValue('end_date', seletedDate);
    }
    if (values.end_date !== '') {
      setCntEvents(
        getCntEvents(
          seletedDate,
          values.end_date,
          values.frequency == 'weekly' ? days : null
        )
      );
    }
    setFieldValue('start_date', seletedDate);
  };

  const onChangeEndDate = date => {
    if (!date.isValid()) {
      setErrors({ end_date: 'Invalid Date Format' });
      return;
    }

    const seletedDate = date.format('YYYY-MM-DD');
    if (moment(values.start_date).isAfter(seletedDate)) {
      setErrors({ end_date: 'End date should be after Start date.' });
      setFieldValue('end_date', '');
    } else {
      setCntEvents(
        getCntEvents(
          values.start_date,
          seletedDate,
          values.frequency == 'weekly' ? days : null
        )
      );
      setFieldValue('end_date', seletedDate);
    }
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

  const onChangeEventType = e => {
    if (e.target.value == 'zoom_link') {
      if (!Number(user.zoomPlan)) {
        setFieldValue('showZoomAlert', true);
      } else {
        console.log('zoom link selected :>> ');
        setFieldValue('zoom_link', 'unset');
      }
    }
    handleChange(e);
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
      setValues({
        ...values,
        end_time: '00:00',
        start_time: '00:00'
      });
      setEventEndsNextDay(true);
    } else {
      setValues({
        ...values,
        start_time:
          moment()
            .add(1, 'hours')
            .format('HH') + ':00',
        end_time:
          moment()
            .add(2, 'hours')
            .format('HH') + ':00'
      });
      setEventEndsNextDay(false);
    }
    handleChange(e);
  };

  const onChangeFrequency = e => {
    if (e.target.value !== 'norepeat' && values.end_date !== '') {
      setCntEvents(
        getCntEvents(
          values.start_date,
          values.end_date,
          e.target.value == 'weekly' ? days : null
        )
      );
    }
    handleChange(e);
  };

  const onChangeIsPacakge = e => {
    if (e.target.value === 'is_package' && values.frequency === 'norepeat') {
      setFieldValue('frequency', 'daily');
    }
    handleChange(e);
  };

  if (classs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" mt={3}>
        <Typography variant="caption">
          Please create a class first! Select Classes in the main menu.
        </Typography>
      </Box>
    );
  } else {
    return (
      <form
        onSubmit={handleSubmit}
        className={clsx(classes.root, className)}
        {...rest}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} lg={12}>
            <Card>
              <CardContent>
                <RadioGroup
                  row
                  name="is_package"
                  value={values.is_package}
                  onChange={onChangeIsPacakge}
                >
                  <Grid item md={6} xs={12}>
                    <Tooltip
                      title={
                        <React.Fragment>
                          <Typography color="inherit">
                            Individual event(s) can be booked as a single event
                            or a series of repeating events. Either way,
                            customers may purchase tickets to 1 event at a time.
                          </Typography>
                        </React.Fragment>
                      }
                      placement="bottom"
                    >
                      <FormControlLabel
                        value="is_individual"
                        control={<Radio color="primary" />}
                        label="Individual event(s)"
                        labelPlacement="end"
                      />
                    </Tooltip>
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Tooltip
                      title={
                        <React.Fragment>
                          <Typography color="inherit">
                            Packages are collections of events sold as bundle.
                          </Typography>
                        </React.Fragment>
                      }
                      placement="bottom"
                    >
                      <FormControlLabel
                        value="is_package"
                        control={<Radio color="primary" />}
                        label="Package"
                        labelPlacement="end"
                      />
                    </Tooltip>
                  </Grid>
                </RadioGroup>
                <Autocomplete
                  id="combo-box-demo"
                  options={classs}
                  getOptionLabel={option =>
                    typeof option === 'string' ? option : option.name
                  }
                  getOptionSelected={(option, value) => {
                    return typeof value === 'string'
                      ? option.name === value
                      : option.name === value.name;
                  }}
                  onChange={(e, v) => {
                    setFieldValue('class_id', v ? v.id : '');
                    setFieldValue('class_name', v ? v.name : '');
                  }}
                  fullWidth
                  value={values.class_name || null}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Class Name"
                      error={Boolean(touched.class_id && errors.class_id)}
                      helperText={touched.class_id && errors.class_id}
                      variant="outlined"
                      name="class_id"
                    />
                  )}
                  className={classes.mt20}
                />
                <Box mt={3} mb={1}>
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
                        label="ALL-DAY"
                      />
                    </Grid>
                    <Grid item md={6} xs={12}>
                      <TextField
                        fullWidth
                        label="Frequency"
                        name="frequency"
                        onChange={onChangeFrequency}
                        select
                        SelectProps={{ native: true }}
                        value={values.frequency}
                        variant="outlined"
                      >
                        {frequency.map(freq => (
                          <option
                            key={freq.id}
                            value={freq.id}
                            disabled={
                              values.is_package === 'is_package' &&
                              freq.id === 'norepeat'
                                ? true
                                : false
                            }
                          >
                            {freq.name}
                          </option>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                </Box>
                {values.frequency === 'weekly' && (
                  <Box mt={3} mb={1}>
                    <ButtonGroup variant="outlined" color="primary" fullWidth>
                      {DayBtnGrpData.map(item => (
                        <Button
                          variant={days[item.id] ? 'contained' : 'outlined'}
                          key={item.id}
                          onClick={() => onChangeDays(item.id)}
                        >
                          {item.name}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </Box>
                )}
                <Box mt={3} mb={1}>
                  <Grid container spacing={4}>
                    <Grid item md={6} xs={12}>
                      <KeyboardDatePicker
                        fullWidth
                        inputVariant="outlined"
                        label="Start date"
                        name="start_date"
                        InputLabelProps={{
                          shrink: true
                        }}
                        format="MM/DD/YYYY"
                        margin="normal"
                        error={Boolean(errors.start_date)}
                        helperText={errors.start_date}
                        value={values.start_date}
                        onChange={onChangeStartDate}
                      />
                    </Grid>
                    {values.frequency !== 'norepeat' && (
                      <Grid item md={6} xs={12}>
                        <KeyboardDatePicker
                          fullWidth
                          inputVariant="outlined"
                          label={
                            'End Date' +
                            (cntEvents ? ` (${cntEvents} events)` : ``)
                          }
                          name="end_date"
                          InputLabelProps={{
                            shrink: true
                          }}
                          format="MM/DD/YYYY"
                          margin="normal"
                          error={Boolean(errors.end_date)}
                          helperText={errors.end_date}
                          value={values.end_date}
                          onChange={onChangeEndDate}
                        />
                      </Grid>
                    )}
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
                        onChange={onChangeEventType}
                        value={values.type}
                        select
                        SelectProps={{ native: true }}
                        variant="outlined"
                      >
                        {schedule_types.map((tt, index) => (
                          <option key={index} value={tt.id}>
                            {tt.label}
                          </option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item md={6} xs={12}>
                      {values.type === 'location' ? (
                        <GoogleAutoPlaceInput
                          onChange={addr => {
                            setFieldValue(
                              'place_id',
                              addr ? addr.place_id : ''
                            );
                            setFieldValue(
                              'location',
                              addr ? addr.description : ''
                            );
                          }}
                          error={Boolean(errors.location)}
                          helperText={errors.location}
                          defaultValue={user.address}
                        />
                      ) : values.type === 'other' ? (
                        <TextField
                          error={Boolean(touched.other && errors.other)}
                          helperText={touched.other && errors.other}
                          fullWidth
                          label="Other event type"
                          name="other"
                          onBlur={handleBlur}
                          onChange={handleChange}
                          value={values.other}
                          variant="outlined"
                        />
                      ) : values.type === 'zoom_link' ? (
                        <Box mb={2}>
                          <Typography variant="caption" color="textSecondary">
                            If you are on a free Zoom plan, you will be required
                            to manually approve participants. If you are on a
                            paid plan (Pro or Business), passtree.net will
                            register participants who will be allowed to join
                            the meeting. This ensures only paid pass holders can
                            join the meeting and eliminates the need for manual
                            approval.
                          </Typography>
                        </Box>
                      ) : null}
                    </Grid>
                  </Grid>
                </Box>
                <Box mt={3} mb={1}>
                  <Grid container spacing={4}>
                    <Grid item md={6} xs={12}>
                      <TextField
                        error={Boolean(touched.price && errors.price)}
                        fullWidth
                        helperText={touched.price && errors.price}
                        label={
                          values.is_package === 'is_package'
                            ? 'Package Price'
                            : 'Price'
                        }
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
                          touched.available_spaces && errors.available_spaces
                        )}
                        fullWidth
                        helperText={
                          touched.available_spaces && errors.available_spaces
                        }
                        type="number"
                        label="Available Spaces"
                        name="available_spaces"
                        onBlur={handleBlur}
                        onChange={handleChange}
                        value={values.available_spaces}
                        variant="outlined"
                      />
                    </Grid>
                  </Grid>
                </Box>
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
          <SubmitButton text="Add new event" isSubmitting={isSubmitting} />
        </Box>
        <Dialog
          open={values.showZoomAlert}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {'Your passtree.net and Zoom accounts are not connected.'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {
                'Your passtree.net and Zoom accounts have not been connected. Please open Account > Settings and connect your Zoom account.'
              }
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => history.push('/app/account', { tab: 'settings' })}
              color="primary"
              autoFocus
            >
              Open Settings
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={showLimited}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            You are limited to create events today.
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              We enabled you to create less than 100 events a day, try it
              tomorrow.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => history.push('/app/home', { tab: 'settings' })}
              color="primary"
              autoFocus
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </form>
    );
  }
};

EventCreateForm.propTypes = {
  className: PropTypes.string
};

export default EventCreateForm;
