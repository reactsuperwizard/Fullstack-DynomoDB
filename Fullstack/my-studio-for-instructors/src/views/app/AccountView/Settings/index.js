import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useSnackbar } from 'notistack';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormHelperText,
  Grid,
  TextField,
  makeStyles,
  Button,
  Checkbox,
  Typography,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@material-ui/core';

import Autocomplete from '@material-ui/lab/Autocomplete';
import useAuth from 'src/hooks/useAuth';
import { getTimeZoneOptions } from 'src/utils/timezones';
import SubmitButton from 'src/components/general/SubmitButton';
import OauthPopup from 'react-oauth-popup';

const useStyles = makeStyles(() => ({
  root: {},
  detailTxt: { fontSize: '110%', fontWeight: '200' },
  zoomBtnDiv: {
    width: 'fit-content',
    marginBottom: 20
  },
  notifSection: {
    marginTop: 10
  }
}));

const zoomPlans = { 1: 'Free', 2: 'Pro', 3: 'Business' };
const Settings = ({ className, ...rest }) => {
  const classes = useStyles();
  const {
    updateUserSetting,
    user,
    zoomAccountSetting,
    discntZoomAcnt
  } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [flagDiscntZoom, setFlagDiscntZoom] = useState(false);

  const timezones = React.useMemo(() => {
    return getTimeZoneOptions(true);
  }, []);

  const onCode = async (code, params) => {
    console.log('successful zoom auth code :>> ', code);
    await zoomAccountSetting(
      code,
      window.location.origin + '/app/account/zoom_auth'
    );
  };

  const onClose = () => console.log('closed!');

  const zoomAuthPopupUrl = useMemo(() => {
    const url =
      process.env.REACT_APP_ZOOM_OAUTH_URL +
      '?response_type=code&client_id=' +
      process.env.REACT_APP_ZOOM_OAUTH_CLIENTID +
      '&redirect_uri=' +
      window.location.origin +
      '/app/account/zoom_auth';
    return url;
  });

  const handleDiscntZoomAnt = async () => {
    console.log('disconnecting zoom account');
    await discntZoomAcnt(user.id);
    setFlagDiscntZoom(false);
  };

  return (
    <>
      <Formik
        initialValues={{
          currency: user.currency || '',
          timezone: user.timezone || '',
          submit: null,
          emailSubscription: Boolean(Number(user.emailSubscription))
        }}
        validationSchema={Yup.object().shape({
          currency: Yup.string().oneOf(['USD', 'CAD']),
          timezone: Yup.string().max(255),
          emailSubscription: Yup.bool()
        })}
        onSubmit={async (
          values,
          { resetForm, setErrors, setStatus, setSubmitting }
        ) => {
          try {
            // NOTE: Make API request
            await updateUserSetting(
              values.currency,
              values.timezone,
              values.emailSubscription
            );
            setStatus({ success: true });
            setSubmitting(false);
            enqueueSnackbar('Updated Successfully', {
              variant: 'success'
            });
          } catch (err) {
            console.error(err);
            setStatus({ success: false });
            setErrors({ submit: err.message });
            setSubmitting(false);
          }
        }}
      >
        {({
          errors,
          handleBlur,
          handleChange,
          handleSubmit,
          isSubmitting,
          touched,
          values,
          setFieldValue
        }) => (
          <form onSubmit={handleSubmit}>
            <Card className={clsx(classes.root, className)} {...rest}>
              <CardHeader title={'General Settings'} />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item md={6} xs={12}>
                    <Autocomplete
                      fullWidth
                      options={[
                        { label: 'USD', value: 'usd' },
                        { label: 'CAD', value: 'cad' }
                      ]}
                      getOptionLabel={option => option.label}
                      onChange={(event, newValue) =>
                        setFieldValue('currency', newValue.label)
                      }
                      defaultValue={{ label: user.currency || '' }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label="Currency"
                          name="currency"
                          variant="outlined"
                          onBlur={handleBlur}
                          error={Boolean(touched.currency && errors.currency)}
                          helperText={touched.currency && errors.currency}
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item md={6} xs={12}>
                    <Autocomplete
                      fullWidth
                      options={timezones}
                      disableClearable
                      getOptionLabel={option => option.name}
                      name="timezone"
                      onChange={(event, value) =>
                        setFieldValue('timezone', value.name)
                      }
                      defaultValue={{ name: user.timezone || '' }}
                      renderInput={params => (
                        <TextField
                          fullWidth
                          {...params}
                          label="Timezone"
                          variant="outlined"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
                <FormControlLabel
                  className={classes.notifSection}
                  control={
                    <Checkbox
                      checked={values.emailSubscription}
                      onChange={() =>
                        setFieldValue(
                          'emailSubscription',
                          !values.emailSubscription
                        )
                      }
                      name="notification"
                      color="primary"
                    />
                  }
                  label="Email Notification"
                />
                {errors.submit && (
                  <Box mt={3}>
                    <FormHelperText error>{errors.submit}</FormHelperText>
                  </Box>
                )}
              </CardContent>
              <Divider />
              <Box p={2} display="flex" justifyContent="flex-end">
                <SubmitButton text="Save Changes" isSubmitting={isSubmitting} />
              </Box>
            </Card>
          </form>
        )}
      </Formik>
      <Box mt={2}>
        <Card className={clsx(classes.root, className)} {...rest} mt={1}>
          <CardHeader
            title={'Integration'}
            avatar={
              <Avatar
                style={{ width: '75px', height: '20px' }}
                variant="square"
                src={require('src/assets/img/zoom.png')}
              />
            }
          />
          <Divider />
          <CardContent>
            {!Number(user.zoomPlan) ? (
              <Grid item xs={12}>
                <Box mb={2}>
                  <Typography variant="caption" color="textSecondary">
                    By connecting your passtree.net account with your Zoom
                    account, you are authorizing passtree.net to interact with
                    your Zoom account, create and manage Zoom meetings on your
                    behalf.
                  </Typography>
                </Box>
                <div className={classes.zoomBtnDiv}>
                  <OauthPopup
                    url={zoomAuthPopupUrl}
                    onCode={onCode}
                    onClose={onClose}
                    width={450}
                    height={650}
                    title="passtree.net <> Zoom"
                  >
                    <Button color="secondary" variant="contained">
                      connect your Zoom account
                    </Button>
                  </OauthPopup>
                </div>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <Box mb={2}>
                  <Typography variant="caption" color="textSecondary">
                    If you are on a free Zoom plan, you will be required to
                    manually approve participants. If you are on a paid plan
                    (Pro or Business), passtree.net will register participants
                    who will be allowed to join the meeting. This ensures only
                    paid pass holders can join the meeting and eliminates the
                    need for manual approval.
                  </Typography>
                </Box>

                <Box mt={2} mb={0}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Zoom Plan
                  </Typography>
                </Box>
                <Box mt={0} mb={0} pl={2} pr={2}>
                  <Typography
                    variant="body1"
                    color="textSecondary"
                    className={classes.detailTxt}
                  >
                    {user.zoomPlan ? zoomPlans[user.zoomPlan] : '- - -'}
                  </Typography>
                </Box>
                <Box mt={2} mb={0}>
                  <Button color="secondary" variant="contained">
                    Refresh plan information
                  </Button>
                </Box>
                <Box mt={2} mb={0}>
                  <Button
                    variant="contained"
                    onClick={() => setFlagDiscntZoom(true)}
                  >
                    Disconnect accounts
                  </Button>
                </Box>
              </Grid>
            )}

            {/* not needed for now 

            <Box mt={2} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                Maximum Number of Participants
              </Typography>
            </Box>
            <Box mt={0} mb={0} pl={2} pr={2}>
              <Typography
                variant="body1"
                color="textSecondary"
                className={classes.detailTxt}
              >
                {'100/300/500/1000'}
              </Typography>
            </Box>
            <Box mt={2} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                Maximum Meeting Duration
              </Typography>
            </Box>
            <Box mt={0} mb={0} pl={2} pr={2}>
              <Typography
                variant="body1"
                color="textSecondary"
                className={classes.detailTxt}
              >
                {'40 min/30 hours'}
              </Typography>
            </Box>

            */}
          </CardContent>
        </Card>
      </Box>
      <Dialog
        open={flagDiscntZoom}
        onClose={() => setFlagDiscntZoom(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Press Confirm to disconnect your Zoom Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You would not be able to create events/packages via Zoom.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDiscntZoom(false)} color="primary">
            Close
          </Button>
          <Button onClick={handleDiscntZoomAnt} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

Settings.propTypes = {
  className: PropTypes.string
};

export default Settings;
