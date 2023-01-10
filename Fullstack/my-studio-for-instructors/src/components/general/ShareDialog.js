import React, { useState, useMemo } from 'react';
import {
  Container,
  Dialog,
  DialogActions,
  Button,
  Box,
  makeStyles
} from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';

const useStyles = makeStyles(theme => ({
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

const ShareDialog = ({ url, open, closeDlg }) => {
  const classes = useStyles();
  const [copied, setCopied] = useState(false);

  console.log('env :>> ', process.env.REACT_APP_BUILD_ENV);
  const sharedUrl = useMemo(
    () =>
      process.env[
        'REACT_APP_PUBLIC_BASEURL_' +
          process.env.REACT_APP_BUILD_ENV.toUpperCase()
      ] + url,
    [url]
  );

  const handleCopy = () => {
    console.log('sharedUrl :>> ', sharedUrl);
    setCopied(true);
    navigator.clipboard.writeText(sharedUrl);
  };

  const handleConfirmShare = () => {
    closeDlg(false);
    window.open('https://www.facebook.com/sharer.php?u=' + sharedUrl, '_blank');
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        closeDlg(false);
        setCopied(false);
      }}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogActions style={{ height: '160px' }}>
        <Box display="flex" className={classes.shareDlgBox}>
          <Button
            color="primary"
            variant="contained"
            className={classes.shareDlgBtn}
            onClick={() => handleConfirmShare()}
          >
            Share on Facebook
          </Button>
          <Button
            onClick={handleCopy}
            color="primary"
            variant="contained"
            disabled={copied}
            className={classes.shareDlgBtn}
          >
            {copied ? (
              <>
                Copied! <CheckIcon />
              </>
            ) : (
              'Copy Link'
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
