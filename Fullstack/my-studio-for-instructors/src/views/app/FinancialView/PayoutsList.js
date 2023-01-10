import React, { useState, useCallback, useEffect } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import PerfectScrollbar from 'react-perfect-scrollbar';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  CircularProgress,
  makeStyles,
  Grid,
  TextField,
  Button
} from '@material-ui/core';
import moment from 'moment';
import { useDispatch, useSelector } from 'src/store';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { getPayouts } from 'src/slices/financial';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import PayoutRequestDlg from 'src/components/general/PayoutRequestDlg';

const applyPagination = (events, page, limit) => {
  return events.slice(page * limit, page * limit + limit);
};

const useStyles = makeStyles(theme => ({
  root: {}
}));

const PayoutsList = ({ className, ...rest }) => {
  const classes = useStyles();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(5);
  const [openContactDlg, setOpenContactDlg] = useState(false);

  const dispatch = useDispatch();

  const { user } = useAuth();
  const isMountedRef = useIsMountedRef();
  const { payouts, isLoading, loaded } = useSelector(state => state.financial);

  const loadingPayouts = useCallback(() => {
    try {
      dispatch(getPayouts(user.id));
    } catch (err) {
      console.error(err);
    }
  }, [isMountedRef]);

  const handleClose = () => {
    setOpenContactDlg(false);
  };

  const handleEmailSend = () => {
    setOpenContactDlg(false);
  };

  useEffect(() => {
    loadingPayouts();
  }, [loadingPayouts]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = event => {
    setLimit(parseInt(event.target.value));
  };

  const paginatedPayouts = applyPagination(payouts, page, limit);

  console.log('payouts :>> ', payouts);

  return (
    <>
      <Box mb={1} mt={1}>
        <Box display="flex">
          <Typography color="inherit" variant="h3">
            Payouts
          </Typography>
          <Box ml={4}>
            <Button
              color="secondary"
              variant="contained"
              onClick={() => setOpenContactDlg(true)}
              className={classes.action}
            >
              Request an offschedule payout
            </Button>
          </Box>
        </Box>
        <Box mb={2} mt={2}>
          <Typography variant="caption" color="textSecondary">
            Payouts are made at the end of each calendar month. A passtree.net
            represetntive will reach out to set up your payouts.
          </Typography>
        </Box>
      </Box>
      <Card className={clsx(classes.root, className)} {...rest}>
        <PerfectScrollbar>
          <Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Confirmation</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {payouts &&
                  loaded &&
                  paginatedPayouts.map(e => {
                    return (
                      <TableRow hover key={e.id}>
                        <TableCell>
                          {moment().format('dddd MMM D, YYYY')}
                        </TableCell>
                        <TableCell>
                          {Number(e.amount).toLocaleString('en-US', {
                            style: 'currency',
                            currency: e.currency
                          }) +
                            ' ' +
                            e.currency || '0'}
                        </TableCell>
                        <TableCell>{e.transaction_id || ''}</TableCell>
                        <TableCell>{e.notes || ''}</TableCell>
                      </TableRow>
                    );
                  })}

                {loaded && payouts.length == 0 && (
                  <TableRow>
                    <TableCell>
                      <Typography>There has been no payouts.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {isLoading && (
              <Box display="flex" justifyContent="center" mt={3}>
                <CircularProgress />
              </Box>
            )}
          </Box>
        </PerfectScrollbar>
        <TablePagination
          component="div"
          count={payouts.length}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>
      {/* 
      simple form, when the press send, email request_amount and message to support@passtree.net
      subjet: <user.email> payout request 
      reply_to: <user.email>
      */}
      <PayoutRequestDlg
        close={handleClose}
        openFlag={openContactDlg}
        email={user.email}
        name={user.name}
        currency={user.currency}
      />
    </>
  );
};

PayoutsList.propTypes = {
  className: PropTypes.string
};

PayoutsList.defaultProps = {};

export default PayoutsList;
