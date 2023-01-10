import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import PerfectScrollbar from 'react-perfect-scrollbar';
import moment from 'moment';
import {
  Card,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  makeStyles,
  Typography,
  Icon,
  Tooltip
} from '@material-ui/core';
import GenericMoreButton from './EventListMenu';
import ShareDialog from 'src/components/general/ShareDialog';
import { useSnackbar } from 'notistack';
import { useDispatch, useSelector } from 'src/store';
import { useHistory } from 'react-router-dom';
import useAuth from 'src/hooks/useAuth';
import { deleteEvent } from 'src/slices/event';
import { getClasss } from 'src/slices/class';
import { getCurrent, getNext, getPrev } from 'src/slices/event';
import Toolbar from './Toolbar';
import EventCancelDialog from 'src/components/EventView/EventCancelDialog';
const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingTop: 10,
    paddingBottom: 10
  },
  dayCard: {
    backgroundColor: theme.palette.background.white,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    overflowX: 'auto'
  },
  pointerCursor: {
    cursor: 'pointer'
  },
  actionCell: {
    width: '12%'
  },
  nameCell: {
    width: '50%'
  },
  imageIcon: {
    display: 'flex',
    height: 'inherit',
    width: 'inherit'
  },
  iconRoot: {
    textAlign: 'center'
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

const EventListView = ({
  className,
  visibleEvents,
  staticContext,
  range,
  isLoading,
  ...rest
}) => {
  const styleClasses = useStyles();
  const [openCancelDlg, setOpenCancelDlg] = useState(false);
  const [openShareDlg, setOpenShareDlg] = useState(false);
  const [eventSelected, setEventSelected] = useState({});
  const dispatch = useDispatch();
  const history = useHistory();

  const { classs } = useSelector(state => state.classes);
  const { user } = useAuth();

  useEffect(() => {
    dispatch(getClasss(user));
  }, [getClasss]);

  const { enqueueSnackbar } = useSnackbar();

  const handleCancel = event => {
    if (moment(event.from).isBefore(moment())) {
      enqueueSnackbar(`You can only cancel future events.`, {
        variant: 'error'
      });
      return;
    }
    setOpenCancelDlg(true);
    setEventSelected(event);
  };

  const handleCancelConfirm = async () => {
    setOpenCancelDlg(false);
    try {
      await dispatch(deleteEvent(eventSelected));
      history.go(0);
      enqueueSnackbar(`Event ${eventSelected.name} canceled`, {
        variant: 'success'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleView = event => {
    const clas = classs.find(o => o.id === event.classId);
    history.push('/app/events/view', { event, clas });
  };

  const handleEdit = event => {
    console.log(event);
    history.push('/app/events/edit', { event });
  };

  const handleShare = event => {
    setOpenShareDlg(true);
    setEventSelected(event);
  };

  const handleClose = () => {
    setOpenCancelDlg(false);
  };

  return (
    <Card className={clsx(styleClasses.root, className)} {...rest}>
      <Toolbar
        onCurrent={() => dispatch(getCurrent())}
        onNext={() => dispatch(getNext())}
        onPrev={() => dispatch(getPrev())}
        range={range}
        isLoading={isLoading}
      />
      <PerfectScrollbar>
        {Object.keys(visibleEvents).map(key => (
          <Card className={clsx(styleClasses.dayCard, className)} key={key}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell className={styleClasses.nameCell} colSpan={2}>
                    <Typography variant="h4">
                      {moment(visibleEvents[key][0].from).format('dddd MMM D')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right"></TableCell>
                  <TableCell align="right">
                    <Typography variant="h4">Spaces (Sold)</Typography>
                  </TableCell>
                  <TableCell align="right" className={styleClasses.actionCell}>
                    <Typography variant="h4">Actions</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleEvents[key].map(event => {
                  return (
                    <TableRow
                      hover
                      key={event.eventId}
                      className={styleClasses.pointerCursor}
                    >
                      <TableCell style={{ width: '13%' }}>
                        <Typography variant="h6">
                          {moment(event.from).format('hh:mm A') +
                            ' - ' +
                            moment(event.to).format('hh:mm A')}
                        </Typography>
                      </TableCell>
                      <TableCell className={styleClasses.nameCell}>
                        <Link
                          variant="subtitle2"
                          color="textPrimary"
                          underline="none"
                          onClick={() => handleView(event)}
                        >
                          <Typography variant="h6">
                            {event.name + (event.deletedAt ? ' CANCELED' : '')}
                          </Typography>
                        </Link>
                      </TableCell>
                      <TableCell align="right">
                        {event.isPackage ? (
                          <Icon classes={{ root: styleClasses.iconRoot }}>
                            <Tooltip
                              title="Event is part of a package"
                              placement="top"
                            >
                              <img
                                className={styleClasses.imageIcon}
                                src={require('src/assets/img/two_tickets.svg')}
                              />
                            </Tooltip>
                          </Icon>
                        ) : event.seriesId ? (
                          <Icon classes={{ root: styleClasses.iconRoot }}>
                            <Tooltip title="Repeating event" placement="top">
                              <img
                                className={styleClasses.imageIcon}
                                src={require('src/assets/img/repeat_ticket.svg')}
                                alt="Repeating event"
                              />
                            </Tooltip>
                          </Icon>
                        ) : (
                          <Icon classes={{ root: styleClasses.iconRoot }}>
                            <Tooltip title="Single event" placement="top">
                              <img
                                className={styleClasses.imageIcon}
                                src={require('src/assets/img/ticket.svg')}
                                alt="Non-repeating event"
                              />
                            </Tooltip>
                          </Icon>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {event.availableSpaces + ' (' + event.soldTickets + ')'}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={styleClasses.actionCell}
                      >
                        <GenericMoreButton
                          disableDelBtn={Boolean(event.deletedAt)}
                          handleCancel={() => handleCancel(event)}
                          handleView={() => handleView(event)}
                          handleShare={() => handleShare(event)}
                          handleEdit={() => handleEdit(event)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ))}
      </PerfectScrollbar>
      <ShareDialog
        open={openShareDlg}
        url={'/events/' + eventSelected.eventId}
        closeDlg={setOpenShareDlg}
      />
      <EventCancelDialog
        open={openCancelDlg}
        close={() => setOpenCancelDlg(false)}
        eventIns={eventSelected}
        confirm={handleCancelConfirm}
      />
    </Card>
  );
};

EventListView.propTypes = {
  className: PropTypes.string,
  visibleEvents: PropTypes.object.isRequired
};

EventListView.defaultProps = {
  visibleEvents: {}
};

export default EventListView;
