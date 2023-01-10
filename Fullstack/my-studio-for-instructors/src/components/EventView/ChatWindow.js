import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Paper, Popper, Fade } from '@material-ui/core/';
import Fab from '@material-ui/core/Fab';

import ChatIcon from '@material-ui/icons/Chat';
import Thread from 'src/components/Thread';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles(theme => ({
  chatButton: {
    position: 'fixed',
    bottom: 20,
    right: 30,
    '& span': {
      transition: 'all 0.3s cubic-bezier(.69,.35,.48,.78)'
    }
  },
  active: {
    '& span': {
      transform: 'rotate(90deg)'
    }
  }
}));

const ChatWindow = ({ roomData, sendMsg, loading }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [open, setOpen] = React.useState(false);

  const openChatWnd = e => {
    setAnchorEl(e.currentTarget);
    setOpen(prev => !prev);
  };

  return (
    <>
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement={'top-end'}
        transition
        style={{ zIndex: 100 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={100}>
            <Thread roomData={roomData} sendMsg={sendMsg} loading={loading} />
          </Fade>
        )}
      </Popper>
      <Fab
        color="primary"
        aria-label="chat_now"
        className={`${classes.chatButton} ${open ? classes.active : ''}`}
        onClick={openChatWnd}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>
    </>
  );
};

export default ChatWindow;
