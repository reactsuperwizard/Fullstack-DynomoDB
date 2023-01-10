import React, { useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import * as Yup from 'yup';
import { Formik } from 'formik';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormHelperText,
  Grid,
  TextField,
  makeStyles
} from '@material-ui/core';
import useAuth from 'src/hooks/useAuth';
import GoogleAutoPlaceInput from 'src/components/GoogleAutoPlaceInput';
import SubmitButton from 'src/components/general/SubmitButton';
import Validators from 'src/utils/validators';

const useStyles = makeStyles(() => ({
  root: {},
  editor: {
    '& .ql-editor': {
      height: 200
    }
  }
}));

const GeneralSettings = ({ className, user, ...rest }) => {
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();
  const { updateUser } = useAuth();
  const [address, setAddress] = useState({
    description: user.address,
    place_id: user.googlePlaceId
  });

  return (
    <Formik
      enableReinitialize
      initialValues={{
        id: user.id,
        avatar: user.avatar || '',
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        certificates: user.certificates || '',
        phone: user.phone || '',
        businessName: user.businessName || '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        name: Yup.string()
          .max(255)
          .matches(/^[a-zA-Z]{1,}(?: [a-zA-Z]+){1,2}$/, 'Must include a first name and a last name')
          .required('Name is required'),
        email: Yup.string()
          .email('Must be a valid email')
          .max(255)
          .required('Email is required'),
        bio: Yup.string().max(2500),
        certificates: Yup.string().max(255),
        phone: Yup.string().matches(
          Validators.phone,
          'Phone number is not valid'
        ),
        businessName: Yup.string().max(255)
      })}
      onSubmit={async (
        values,
        { resetForm, setErrors, setStatus, setSubmitting }
      ) => {
        try {
          // NOTE: Make API request
          await updateUser({
            ...values,
            address: address.description,
            googlePlaceId: address.place_id
          });
          // resetForm();
          setStatus({ success: true });
          setSubmitting(false);
          enqueueSnackbar('Profile updated', {
            variant: 'success'
          });
        } catch (err) {
          console.error(err);
          resetForm();
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
            <CardContent>
              <Grid container spacing={4}>
                <Grid item md={6} xs={12}>
                  <TextField
                    error={Boolean(touched.name && errors.name)}
                    fullWidth
                    helperText={touched.name && errors.name}
                    label="Name"
                    name="name"
                    onBlur={handleBlur}
                    onChange={props => {
                      console.info('handleChange', props);
                      handleChange(props);
                    }}
                    value={values.name}
                    variant="outlined"
                    required
                  />
                </Grid>
                <Grid item md={6} xs={12}>
                  <TextField
                    error={Boolean(touched.email && errors.email)}
                    fullWidth
                    label="Email Address"
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    required
                    type="email"
                    value={values.email}
                    variant="outlined"
                    disabled
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={12}
                  container
                  direction="column"
                  spacing={1}
                >
                  <TextField
                    error={Boolean(touched.bio && errors.bio)}
                    fullWidth
                    label="Introduction and Bio"
                    name="bio"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    type="email"
                    value={values.bio}
                    variant="outlined"
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid item md={6} xs={12}>
                  <TextField
                    error={Boolean(touched.businessName && errors.businessName)}
                    fullWidth
                    helperText={touched.businessName && errors.businessName}
                    label="Business Name"
                    name="businessName"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.businessName}
                    variant="outlined"
                  />
                </Grid>
                <Grid item md={6} xs={12}>
                  <TextField
                    error={Boolean(touched.certificates && errors.certificates)}
                    fullWidth
                    label="Certificates"
                    name="certificates"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.certificates}
                    variant="outlined"
                    helperText={
                      touched.certificates && errors.certificates
                        ? errors.certificates
                        : 'List all your professional fitness certificates'
                    }
                  />
                </Grid>
                <Grid item md={6} xs={12}>
                  <TextField
                    error={Boolean(touched.phone && errors.phone)}
                    fullWidth
                    helperText={touched.phone && errors.phone}
                    label="Phone Number"
                    name="phone"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    value={values.phone}
                    variant="outlined"
                  />
                </Grid>
                <Grid item md={6} xs={12}>
                  <GoogleAutoPlaceInput
                    onChange={setAddress}
                    defaultValue={user.address}
                  />
                </Grid>
              </Grid>
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
  );
};

GeneralSettings.propTypes = {
  className: PropTypes.string,
  user: PropTypes.object.isRequired
};

export default GeneralSettings;
