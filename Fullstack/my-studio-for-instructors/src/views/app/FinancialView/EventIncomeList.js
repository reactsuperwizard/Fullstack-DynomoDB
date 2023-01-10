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
  makeStyles
} from '@material-ui/core';
import { useDispatch, useSelector } from 'src/store';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import { getEventsIncome } from 'src/slices/financial';

import moment from 'moment';
const applyPagination = (events, page, limit) => {
  return events.slice(page * limit, page * limit + limit);
};

const useStyles = makeStyles(theme => ({
  root: {}
}));

const EventIncomeList = ({ className, ...rest }) => {
  const classes = useStyles();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(5);

  const dispatch = useDispatch();

  const { user } = useAuth();
  const isMountedRef = useIsMountedRef();
  const { events, isLoading, loaded } = useSelector(state => state.financial);

  console.log('events :>> ', events);
  const loadingEvents = useCallback(() => {
    try {
      dispatch(getEventsIncome(user, null, 'created_at'));
    } catch (err) {
      console.error(err);
    }
  }, [isMountedRef]);

  useEffect(() => {
    loadingEvents();
  }, [loadingEvents]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleLimitChange = event => {
    setLimit(parseInt(event.target.value));
  };

  const paginatedEvents = applyPagination(events, page, limit);

  return (
    <>
      <Box mb={1}>
        <Typography color="inherit" variant="h3" style={{ marginRight: 10 }}>
          Income
        </Typography>
      </Box>
      <Card className={clsx(classes.root, className)} {...rest}>
        <PerfectScrollbar>
          <Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Event/Package</TableCell>
                  <TableCell>Sold Tickets</TableCell>
                  <TableCell>Income</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events &&
                  loaded &&
                  paginatedEvents.map(e => {
                    return (
                      <TableRow hover key={e.eventId}>
                        <TableCell>
                          {e.packageId
                            ? moment(e.from).format('dddd MMMM D') +
                              ' - ' +
                              moment(e.to).format('dddd MMMM D')
                            : moment(e.from).format('dddd MMMM D')}
                        </TableCell>
                        <TableCell>
                          {e.packageId ? e.packageName : e.name}
                        </TableCell>
                        <TableCell>{e.soldTickets || '0'}</TableCell>
                        <TableCell>
                          <Box>
                            {Number(
                              e.soldTickets *
                                (e.deletedAt ? 0 : e.price * (1 - e.fees))
                            ).toLocaleString('en-US', {
                              style: 'currency',
                              currency: e.currency
                            }) +
                              ' ' +
                              e.currency}
                          </Box>
                          <Box>
                            (Fees:{' '}
                            {Number(
                              e.soldTickets *
                                (e.deletedAt ? 0 : e.price * e.fees)
                            ).toLocaleString('en-US', {
                              style: 'currency',
                              currency: e.currency
                            })}
                            )
                          </Box>
                        </TableCell>
                        <TableCell>
                          {moment(e.to).isAfter(moment())
                            ? 'Pending'
                            : 'Actual'}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                {loaded && events.length == 0 && (
                  <TableRow>
                    <TableCell>
                      <Typography>No events have been scheduled.</Typography>
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
          count={events.length}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handleLimitChange}
          page={page}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>
    </>
  );
};

EventIncomeList.propTypes = {
  className: PropTypes.string
};

EventIncomeList.defaultProps = {};

export default EventIncomeList;
