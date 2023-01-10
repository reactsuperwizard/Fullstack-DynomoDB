import React, { useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
  Box,
  Divider,
  makeStyles,
  Typography,
  CircularProgress
} from '@material-ui/core';
import { useDispatch, useSelector } from 'src/store';
import {
  getThread,
  markThreadAsSeen,
  resetActiveThread,
  getParticipants,
  addRecipient,
  removeRecipient
} from 'src/slices/chat';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';

const threadSelector = state => {
  const { threads, activeThreadId } = state.chat;
  const thread = threads.byId[activeThreadId];

  if (thread) {
    return thread;
  }

  return {
    id: null,
    messages: [],
    participants: [],
    unreadMessages: 0
  };
};

const useStyles = makeStyles(theme => ({
  root: props => ({
    backgroundColor: theme.palette.background.dark,
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    height: props.desktop ? '100%' : '67vh',
    [theme.breakpoints.down('xs')]: {
      width: '90vw'
    },
    [theme.breakpoints.up('sm')]: {
      width: '60vw'
    },
    [theme.breakpoints.up('md')]: {
      width: props.desktop ? '100%' : '40vw'
    },
    [theme.breakpoints.up('lg')]: {
      width: props.desktop ? '100%' : '20vw'
    },
    marginBottom: 10,
    boxShadow: props.desktop
      ? ''
      : '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)',
    zIndex: 9999
  }),
  header: {
    backgroundColor: theme.palette.primary.main,
    padding: '15px 10px',
    borderRadius: '10px 10px 0px 0px'
  },
  headerTitle: {
    color: 'white'
  },
  msgList: {
    justifyContent: 'center',
    display: 'flex'
  }
}));

const Thread = ({ desktop = false, roomData, sendMsg, loading }) => {
  const classes = useStyles({ desktop });
  const dispatch = useDispatch();
  const history = useHistory();
  // const { threadKey } = useParams();
  const { threadKey } = { threadKey: 'adam.denisov' };
  const { activeThreadId, participants, recipients } = useSelector(
    state => state.chat
  );
  const thread = useSelector(state => threadSelector(state));

  // In our case there two possible routes
  // one that contains chat/new and one with a chat/:threadKey
  // if threadKey does not exist, it means that the chat is in compose mode
  // const mode = threadKey ? 'DETAIL' : 'COMPOSE';
  const mode = threadKey ? 'COMPOSE' : 'DETAIL';

  const handleAddRecipient = recipient => {
    dispatch(addRecipient(recipient));
  };

  const handleRemoveRecipient = recipientId => {
    dispatch(removeRecipient(recipientId));
  };

  useEffect(() => {
    const getDetails = async () => {
      dispatch(getParticipants(threadKey));

      try {
        await dispatch(getThread(threadKey));
      } catch (err) {
        // If thread key is not a valid key (thread id or username)
        // the server throws an error, this means that the user tried a shady route
        // and we redirect him on the compose route
        console.error(err);
        history.push('/app/chat/new');
      }
    };

    // If path contains a thread key we do the following:
    // 1) Load the thread participants based on the key
    // 2) Try to find a related thread based on the key, it might not exist if it is a new tread
    if (threadKey) {
      getDetails();
    } else {
      // If no thread key specifid, but an active thread id exists in the
      // store, reset that key. This means that the user navigated from details mode to compose
      if (activeThreadId) {
        dispatch(resetActiveThread());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadKey]);

  useEffect(() => {
    if (activeThreadId) {
      // Maybe we should also check if active thread
      // has unread messages before triggering this
      dispatch(markThreadAsSeen(activeThreadId));
    }
  }, [dispatch, activeThreadId]);

  return (
    <div className={classes.root}>
      {!desktop && (
        <div className={classes.header}>
          <Typography variant="h3" className={classes.headerTitle}>
            Chatroom
          </Typography>
        </div>
      )}
      <Box
        flexGrow={1}
        height="65vh"
        overflow="hidden"
        alignItems="center"
        className={classes.msgList}
      >
        {roomData && <MessageList thread={thread} roomData={roomData} />}
        {loading && <CircularProgress size={50} />}
      </Box>
      <Divider />
      <MessageComposer disabled onSend={sendMsg} />
    </div>
  );
};

export default Thread;
