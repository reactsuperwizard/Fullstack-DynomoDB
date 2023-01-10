import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Popover,
  SvgIcon,
  Tooltip,
  Typography,
  Badge,
  makeStyles
} from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'src/store';
import { getEvents } from 'src/slices/event';
import { getClasss } from 'src/slices/class';

import { Bell as BellIcon } from 'react-feather';
import { useObject } from 'react-firebase-hooks/database';
import firebase from 'src/lib/firebase';
import useAuth from 'src/hooks/useAuth';
import moment from 'moment';

const useStyles = makeStyles(theme => ({
  popover: {
    width: 400
  },
  icon: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText
  },
  listItemTime: {
    textAlign: 'center',
    marginRight: 16
  },
  listItem: {
    cursor: 'pointer'
  }
}));

const Notifications = () => {
  const classes = useStyles();
  const ref = useRef(null);
  const [isOpen, setOpen] = useState(false);
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { events } = useSelector(state => state.events);
  const { classs } = useSelector(state => state.classes);

  const [fbMessages, loading, fberror] = useObject(
    firebase.database().ref('notification/' + user.fuid)
  );

  const [notifications, setNotifications] = useState([]);
  const [unreadMsgs, setUnreadMsgs] = useState({});
  const history = useHistory();

  const handleOpen = async () => {
    setOpen(true);
    if (Object.keys(unreadMsgs).length !== 0) {
      Object.keys(unreadMsgs).map(async key => {
        await firebase
          .database()
          .ref(`notification/${user.fuid}/${key}`)
          .update(unreadMsgs[key]);
      });
    }
    setUnreadMsgs([]);
  };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (fbMessages && fbMessages.val()) {
      const tmp = [],
        tmpMsgsUnread = {};
      Object.keys(fbMessages.val()).map(key => {
        const item = fbMessages.val()[key];
        tmp.push(item);
        if (!item.read) {
          tmpMsgsUnread[key] = { ...item, read: true };
        }
      });
      setNotifications(tmp.reverse());
      setUnreadMsgs(tmpMsgsUnread);
    }
  }, [fbMessages]);

  useEffect(() => {
    const loadData = async () => {
      if (!events.length) {
        await dispatch(getEvents(user));
      }
      if (!classs.length) {
        await dispatch(getClasss(user));
      }
    };
    loadData();
  }, []);

  const onShowAll = () => {
    history.push('/app/notifications', { notifications });
    handleClose();
  };

  const onClickItem = msg => {
    console.log('msg :>> ', msg);
    if (msg.title == 'New message' && msg.meta) {
      const event = events.find(
        o => o.eventId === msg.meta || o.packageId === msg.meta
      );
      const clas = event && classs.find(o => o.id === event.classId);
      if (event && clas) {
        history.push('/app/events/view', { event, clas });
        handleClose();
        return;
      }
    }
    history.push('/app/notifications', { notifications });
    handleClose();
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton color="inherit" ref={ref} onClick={handleOpen}>
          <Badge
            color="error"
            variant="dot"
            invisible={Object.keys(unreadMsgs).length == 0}
          >
            <SvgIcon>
              <BellIcon />
            </SvgIcon>
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        classes={{ paper: classes.popover }}
        anchorEl={ref.current}
        onClose={handleClose}
        open={isOpen}
      >
        <Box p={2}>
          <Typography variant="h5" color="textPrimary">
            Notifications
          </Typography>
        </Box>
        {notifications.length === 0 ? (
          <Box p={2}>
            <Typography variant="h6" color="textPrimary">
              There are no notifications
            </Typography>
          </Box>
        ) : (
          <>
            <List disablePadding>
              {notifications.slice(0, 5).map((msg, index) => (
                <ListItem
                  divider
                  key={index}
                  onClick={() => onClickItem(msg)}
                  className={classes.listItem}
                >
                  <ListItemAvatar className={classes.listItemTime}>
                    <>
                      <Typography variant="body2">
                        {moment.unix(msg.timestamp).format('MM/DD/YYYY')}
                      </Typography>
                      <Typography variant="body2">
                        {moment.unix(msg.timestamp).format('hh:mm A')}
                      </Typography>
                    </>
                  </ListItemAvatar>
                  <ListItemText
                    primary={msg.title}
                    primaryTypographyProps={{
                      variant: 'subtitle2',
                      color: 'textPrimary'
                    }}
                    secondary={msg.body}
                  />
                </ListItem>
              ))}
            </List>
            <Box p={1} display="flex" justifyContent="center">
              <Button size="small" onClick={onShowAll}>
                View all notifications
              </Button>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
};

export default Notifications;
