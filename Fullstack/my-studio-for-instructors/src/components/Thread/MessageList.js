import React, { useEffect, useRef } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core';
import MessageItem from './MessageItem';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(2)
  }
}));

const MessageList = ({ className, thread, roomData, ...rest }) => {
  const classes = useStyles();
  const scrollRef = useRef(null);
  const firstRenderRef = useRef(true);

  useEffect(() => {
    const scrollMessagesToBottom = () => {
      if (scrollRef.current && scrollRef.current._container) {
        let timesRun = 0;
        let dh =
          (scrollRef.current._container.scrollHeight -
            scrollRef.current._container.scrollTop) /
          20;
        let interval = setInterval(function() {
          timesRun += 1;
          if (timesRun === 5) {
            clearInterval(interval);
          }
          if (scrollRef.current) {
            scrollRef.current._container.scrollTop += dh;
          }
        }, 30);
      }
    };
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
    } else {
      scrollMessagesToBottom();
    }
  }, [roomData.messages]);

  useEffect(() => {
    const scrollMessagesToBottom = () => {
      if (scrollRef.current && scrollRef.current._container) {
        scrollRef.current._container.scrollTop =
          scrollRef.current._container.scrollHeight;
      }
    };
    scrollMessagesToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PerfectScrollbar
      className={clsx(classes.root, className)}
      options={{ suppressScrollX: true }}
      ref={scrollRef}
      {...rest}
    >
      {Object.keys(roomData.messages).map((ii, index) => (
        <MessageItem
          key={index}
          message={roomData.messages[ii]}
          roomData={roomData}
        />
      ))}
    </PerfectScrollbar>
  );
};

MessageItem.propTypes = {
  className: PropTypes.string
};

export default MessageList;
