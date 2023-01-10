import React from 'react';
import { Box, TextField } from '@material-ui/core';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import SubmitButton from 'src/components/general/SubmitButton';
import useAuth from 'src/hooks/useAuth';

import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormHelperText
} from '@material-ui/core';

const VerificationDialog = ({ open }) => {
  const { verifyAccount } = useAuth();
  const {
    errors,
    handleBlur,
    handleChange,
    handleSubmit,
    isSubmitting,
    touched,
    values
  } = useFormik({
    initialValues: {
      verification_code: '',
      submit: null
    },
    validationSchema: Yup.object().shape({
      verification_code: Yup.string()
        .max(8)
        .matches(/^[0-9]+$/, 'Must be only digits')
        .required('Verification code is required')
    }),
    onSubmit: async (values, { setErrors }) => {
      const result = await verifyAccount(values.verification_code);
      if (!result)
        setErrors({
          verification_code:
            'Verification code you entered is invalid. Please try again'
        });
    }
  });

  return (
    <Dialog
      open={open}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Email Verification</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Congratulations! Your passtree.net account has been created
          successfully.
          <br />
          <br />A verification code has been sent to your email address. Please
          check your inbox and paste the verification code below.
        </DialogContentText>

        <form onSubmit={handleSubmit}>
          <Box
            mt={4}
            mb={4}
            display="flex"
            alignItems="center"
            justify="center"
            flexDirection="column"
          >
            <TextField
              error={Boolean(
                touched.verification_code && errors.verification_code
              )}
              helperText={touched.verification_code && errors.verification_code}
              label="Verification Code"
              name="verification_code"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.name}
              variant="outlined"
            />
            {errors.submit && (
              <Box mt={3} bgColor="background.paper">
                <FormHelperText error>{errors.submit}</FormHelperText>
              </Box>
            )}
            <Box mt={2}>
              <SubmitButton text="Submit" isSubmitting={isSubmitting} />
            </Box>
          </Box>
        </form>

        <DialogContentText>
          Reach out to{' '}
          <a href="mailto:support@passtree.net">support@passtree.net</a> if you
          do receive a verification email within a few minutes.
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationDialog;
