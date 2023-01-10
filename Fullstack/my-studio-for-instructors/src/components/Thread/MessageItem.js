import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import moment from 'moment';
import { Lightbox } from 'react-modal-image';
import { Avatar, Box, Link, Typography, makeStyles } from '@material-ui/core';
import useAuth from 'src/hooks/useAuth';
import getUserAvatar from 'src/utils/userAvatar';

const useStyles = makeStyles(theme => ({
  root: {
    marginBottom: theme.spacing(2),
    display: 'flex'
  },
  avatar: {
    height: 32,
    width: 32
  },
  image: {
    cursor: 'pointer',
    height: 'auto',
    maxWidth: '100%',
    width: 380
  },
  msgItem: {
    color: 'inherit',
    backgroundColor: 'transparent',
    padding: 0,
    fontSize: '14px',
    fontFamily: `"Roboto", "Helvetica", "Arial", sans-serif`,
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: '-0.05px',
    margin: 0,
    whiteSpace: 'pre-line'
  }
}));

const MessageItem = ({ className, message, thread, roomData, ...rest }) => {
  const classes = useStyles();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);

  // Since chat mock db is not synced with external auth providers
  // we set the user details from user auth state instead of thread participants
  const sender = roomData.members[message.fuid];
  const senderDetails =
    message.uid === user.id
      ? {
          avatar: user.avatar,
          name: 'Me',
          type: 'user', 
          name_actual: user.name
        }
      : {
          avatar: sender ? sender.photo_url : null,
          name: sender ? sender.name : null,
          type: 'contact'
        };

  return (
    <div className={clsx(classes.root, className)} {...rest}>
      <Box
        display="flex"
        maxWidth={500}
        ml={senderDetails.type === 'user' ? 'auto' : 0}
      >
        {senderDetails.avatar.includes('https://s.gravatar') ? (
          <Avatar className={classes.avatar} style={{ backgroundColor: getUserAvatar(senderDetails.name_actual ? senderDetails.name_actual : senderDetails.name).color }}>
            {senderDetails.name === 'Me' ? senderDetails.name : getUserAvatar(senderDetails.name).letters}
          </Avatar>
        ) : (
          <Avatar className={classes.avatar}src={senderDetails.avatar} />
        )}
        <Box ml={2}>
          <Box
            bgcolor={
              senderDetails.type === 'user'
                ? 'secondary.main'
                : 'background.default'
            }
            borderRadius="borderRadius"
            boxShadow={1}
            color={
              senderDetails.type === 'user'
                ? 'secondary.contrastText'
                : 'text.primary'
            }
            px={2}
            py={1}
          >
            <Link color="inherit" component={RouterLink} to="#" variant="h6">
              {senderDetails.name}
            </Link>
            <Box mt={1} mb={1}>
              {message.contentType === 'image' ? (
                <Box mt={2} onClick={() => setSelectedImage(message.message)}>
                  <img
                    alt="Attachment"
                    className={classes.image}
                    src={message.message}
                  />
                </Box>
              ) : (
                <pre className={classes.msgItem}>{message.message}</pre>
              )}
            </Box>
          </Box>
          <Box mt={1} display="flex" justifyContent="flex-end">
            <Typography noWrap color="textSecondary" variant="caption">
              {moment.unix(message.timestamp).fromNow()}
            </Typography>
          </Box>
        </Box>
      </Box>
      {selectedImage && (
        <Lightbox
          large={selectedImage}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  );
};

MessageItem.propTypes = {
  className: PropTypes.string,
  message: PropTypes.object.isRequired
};

export default MessageItem;
