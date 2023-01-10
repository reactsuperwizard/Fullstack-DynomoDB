import React, { useEffect, useState, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Hidden,
  GridList,
  GridListTile,
  IconButton,
  Typography
} from '@material-ui/core/';

import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import { useHistory } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import moment from 'moment';
import { useDispatch, useSelector } from 'src/store';
import { deleteEvent, getSeries, getEvents } from 'src/slices/event';
import useAuth from 'src/hooks/useAuth';
import firebase from 'src/lib/firebase';
import EventCancelDialog from 'src/components/EventView/EventCancelDialog';

import {
  ChatWindow,
  EventViewMenu,
  EventDetailView,
  ClassDetailView,
  EventSeriesView,
  HoldersView
} from 'src/components/EventView';

import Thread from 'src/components/Thread';
import { useObject } from 'react-firebase-hooks/database';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  chatCard: {
    marginTop: 15,
    display: 'flex',
    flexDirection: 'column'
  },
  chatGrid: { display: 'flex', flexDirection: 'column', top: 10 },
  gridList: {
    flexWrap: 'nowrap',
    transform: 'translateZ(0)'
  },
  gridTile: {
    [theme.breakpoints.down('xs')]: {
      width: 'auto !important'
    },
    [theme.breakpoints.up('sm')]: {
      width: 'auto !important'
    }
  },
  chatCardContent: {
    flex: 1,
    '&:last-child': {
      paddingBottom: 5
    },
    height: 300
  },
  detailTxt: { fontSize: '110%', fontWeight: '200' }
}));

const EventViewContent = ({ eventIns, classIns, openShareDlg }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { events, seriesEvents } = useSelector(state => state.events);
  const history = useHistory();
  const [openDeleteDlg, setOpenDeleteDlg] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const roomId = useMemo(() => {
    return eventIns.isPackage ? eventIns.packageId : eventIns.eventId;
  }, [eventIns]);

  const [chatRoom, roomLoading, roomLoadingerror] = useObject(
    firebase.database().ref('chatroom/' + roomId)
  );

  const handleEdit = () => {
    history.push('/app/events/edit', { event: eventIns });
  };

  const handleDelete = () => {
    if (moment(eventIns.from).isBefore(moment())) {
      enqueueSnackbar(`You can only cancel future events.`, {
        variant: 'error'
      });
      return;
    }

    setOpenDeleteDlg(true);
  };

  const handleConfirm = async () => {
    setOpenDeleteDlg(false);
    try {
      await dispatch(deleteEvent(eventIns, user.id));

      enqueueSnackbar(`Event ${eventIns.name} canceled`, {
        variant: 'success'
      });
      history.push('/app/events');
    } catch (err) {
      console.error(err);
    }
  };

  const handleClose = () => {
    setOpenDeleteDlg(false);
  };

  useEffect(() => {
    const getEvent = async () => {
      if (events.length === 0) {
        await dispatch(getEvents(user));
      }
      await dispatch(getSeries(eventIns));
    };
    getEvent();
  }, [getSeries, eventIns]);

  const onSendMsg = async value => {
    // console.log('send msg here:>> ', moment().unix());
    const msgRef = await firebase.database().ref(`chatroom/${roomId}/messages`);
    const newMsgRef = await msgRef.push();
    await newMsgRef.set({
      message: value,
      timestamp: moment().unix(),
      uid: user.id,
      fuid: user.fuid
    });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12} lg={8} mb={1}>
        <Card>
          <CardHeader
            title="Event Details"
            action={
              <EventViewMenu
                disableDelBtn={Boolean(eventIns.deletedAt)}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                handleShare={openShareDlg}
              />
            }
          />
          <EventDetailView eventIns={eventIns} seriesEvents={seriesEvents} />
          <Divider />
          <CardHeader
            title="Class Details"
            action={
              <IconButton
                disabled={Boolean(classIns.deletedAt)}
                onClick={() =>
                  history.push('/app/classes/view', { classInstance: classIns })
                }
              >
                <Typography style={{ marginRight: 5 }}>View</Typography>
                <ArrowForwardIcon />
              </IconButton>
            }
          />
          <Divider />
          {classIns !== null && classIns !== undefined && (
            <ClassDetailView classIns={classIns} classes={classes} />
          )}
        </Card>
      </Grid>

      <Hidden lgUp>
        <Grid item xs={12}>
          <Divider />
          <HoldersView
            members={
              chatRoom && typeof chatRoom.val() == 'object'
                ? chatRoom.val().members
                : {}
            }
          />
        </Grid>
      </Hidden>

      <Hidden mdDown>
        <Grid item xs={12} md={4} className={classes.chatGrid}>
          <HoldersView
            members={
              chatRoom && typeof chatRoom.val() == 'object'
                ? chatRoom.val().members
                : {}
            }
          />
          <Card
            className={classes.chatCard}
            style={{ position: 'sticky', top: 10, height: 700 }}
          >
            <CardHeader
              title={eventIns.isPackage ? 'Chatroom' : 'Event Chatroom'}
            />
            <Divider />
            <CardContent className={classes.chatCardContent}>
              <Thread
                desktop
                roomData={chatRoom ? chatRoom.val() : null}
                sendMsg={onSendMsg}
                loading={roomLoading}
              />
            </CardContent>
          </Card>
        </Grid>
      </Hidden>

      {!Boolean(classIns.deletedAt) && (
        <Grid item xs={12} md={12}>
          <Card>
            <CardHeader title="Images" />
            <Divider />
            <CardContent style={{ padding: 5 }}>
              <GridList cellHeight={240} className={classes.gridList}>
                {classIns.images.map(src => (
                  <GridListTile key={src} cols={1} className={classes.gridTile}>
                    <img
                      style={{ width: 'auto', height: 240, objectFit: 'cover' }}
                      src={src}
                    />
                  </GridListTile>
                ))}
              </GridList>
            </CardContent>
          </Card>
        </Grid>
      )}
      {eventIns.seriesId && (
        <Grid item xs={12} md={12}>
          <Divider />
          <Card>
            <EventSeriesView
              seriesEvents={seriesEvents}
              isPackage={eventIns.isPackage}
            />
          </Card>
        </Grid>
      )}
      <EventCancelDialog
        open={openDeleteDlg}
        close={handleClose}
        eventIns={eventIns}
        confirm={handleConfirm}
      />
      <Hidden lgUp>
        <ChatWindow
          roomData={chatRoom ? chatRoom.val() : null}
          sendMsg={onSendMsg}
          loading={roomLoading}
        />
      </Hidden>
    </Grid>
  );
};

export default EventViewContent;
