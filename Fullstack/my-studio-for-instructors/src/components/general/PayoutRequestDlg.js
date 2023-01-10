import React from 'react';
import { Formik } from 'formik';
import * as Yup from 'yup';

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  DialogTitle,
  Grid,
  TextField
} from '@material-ui/core/';
import axios from 'src/utils/axiosApiGateway';
import { useSnackbar } from 'notistack';
const PayoutRequestDlg = ({ openFlag, close, email, name, currency }) => {
  const { enqueueSnackbar } = useSnackbar();
  return (
    <Dialog
      open={openFlag}
      onClose={close}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <Formik
        initialValues={{ message: '', payout_amount: '' }}
        validationSchema={Yup.object().shape({
          message: Yup.string()
            .max(500)
            .required(),
          payout_amount: Yup.number().required()
        })}
        onSubmit={async (values, {}) => {
          const response = await axios.post('/send_payout_request', {
            ...values,
            email,
            name,
            amount:
              Number(values.payout_amount).toLocaleString('en-US', {
                style: 'currency',
                currency: currency
              }) +
              ' ' +
              currency
          });
          console.log('response from server :>> ', response);
          enqueueSnackbar(
            'You have sent the payout request to pastree.net admin.',
            {
              variant: 'success'
            }
          );
          close();
        }}
      >
        {({ errors, handleSubmit, handleChange, touched, values }) => (
          <form onSubmit={handleSubmit}>
            <DialogTitle id="alert-dialog-title">
              Payout Request Form
            </DialogTitle>
            <DialogContent>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Payout amount"
                  name="payout_amount"
                  value={values.payout_amount}
                  onChange={handleChange}
                  error={Boolean(touched.payout_amount && errors.payout_amount)}
                  helperText={touched.payout_amount && errors.payout_amount}
                  type="number"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Box mt={1} width={300}>
                  <TextField
                    fullWidth
                    error={Boolean(touched.message && errors.message)}
                    helperText={touched.message && errors.message}
                    label="Message"
                    name="message"
                    onChange={handleChange}
                    variant="outlined"
                    value={values.message}
                    multiline
                    rows={4}
                  />
                </Box>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={close} color="primary">
                Cancel
              </Button>
              <Button color="primary" autoFocus type="submit">
                Send
              </Button>
            </DialogActions>
          </form>
        )}
      </Formik>
    </Dialog>
  );
};

export default PayoutRequestDlg;
