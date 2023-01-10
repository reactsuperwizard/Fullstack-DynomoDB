import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  Avatar,
  IconButton,
  Input,
  Paper,
  SvgIcon,
  Tooltip,
  makeStyles
} from '@material-ui/core';
import { Send as SendIcon } from 'react-feather';
import useAuth from 'src/hooks/useAuth';

const useStyles = makeStyles(theme => ({
  root: {
    alignItems: 'center',
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    padding: theme.spacing(1, 2),
    paddingLeft: 0,
    paddingRight: 0
  },
  inputContainer: {
    flexGrow: 1,
    height: 'auto',
    marginLeft: theme.spacing(1),
    [theme.breakpoints.up('lg')]: {
      marginLeft: theme.spacing(0)
    },
    padding: theme.spacing(1)
  },
  divider: {
    height: 24,
    width: 1
  },
  fileInput: {
    display: 'none'
  }
}));

const MessageComposer = ({ className, onSend, ...rest }) => {
  const classes = useStyles();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [body, setBody] = useState('');
  const [disabled, setDisabled] = useState(false);

  const handleAttach = () => {
    fileInputRef.current.click();
  };

  const handleChange = event => {
    setBody(event.target.value);
    event.stopPropagation();
  };

  const handleKeyDown = e => {
    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!body) {
      return;
    }

    if (onSend) {
      onSend(body);
    }

    setBody('');
  };

  return (
    <div className={clsx(classes.root, className)} {...rest}>
      <Paper variant="outlined" className={classes.inputContainer}>
        <Input
          disableUnderline
          fullWidth
          value={body}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Leave a message"
          disabled={disabled}
          rowsMax={8}
          multiline
        />
      </Paper>
      <Tooltip title="Send">
        <span>
          <IconButton
            color="secondary"
            disabled={!body || disabled}
            onClick={handleSend}
          >
            <SvgIcon color="secondary">
              <SendIcon style={{ fontSize: 32 }} />
            </SvgIcon>
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
};

MessageComposer.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  onSend: PropTypes.func
};

MessageComposer.defaultProps = {
  disabled: false,
  onSend: () => {}
};

export default MessageComposer;
