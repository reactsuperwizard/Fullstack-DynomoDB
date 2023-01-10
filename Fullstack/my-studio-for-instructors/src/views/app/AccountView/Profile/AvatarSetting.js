import React, { useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Link,
  Typography,
  CircularProgress,
  makeStyles
} from '@material-ui/core';
import ShareDialog from 'src/components/general/ShareDialog';

import { useSnackbar } from 'notistack';
import useAuth from 'src/hooks/useAuth';
import { toBase64 } from 'src/utils';
import getUserAvatar from 'src/utils/userAvatar';

const useStyles = makeStyles(theme => ({
  root: {},
  name: {
    marginTop: theme.spacing(1)
  },
  avatar: {
    height: 100,
    width: 100
  },
  buttonProgress: {
    position: 'absolute',
    top: '22%',
    left: '44%'
  },
  relativeWrapper: {
    position: 'relative'
  },
  shareBtn: {
    marginTop: 15,
    marginBottom: 15
  }
}));

const ProfileDetails = ({ className, user, ...rest }) => {
  const classes = useStyles();
  const inputRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();
  const { uploadProfilePhoto, removeProfilePhoto } = useAuth();
  const [submitting, setSubmitting] = useState({
    udpate: false,
    remove: false
  });
  const [openShareDlg, setOpenShareDlg] = useState(false);

  const sharedUrl = useMemo(
    () =>
      process.env[
        'REACT_APP_PUBLIC_BASEURL_' +
          process.env.REACT_APP_BUILD_ENV.toUpperCase()
      ] +
      '/users/' +
      user.username,
    [user]
  );

  const userEmptyAvatar = useMemo(() => {
    return getUserAvatar(user.name);
  }, [user.name]);

  const onChangeFile = async event => {
    const file = event.target.files[0];
    try {
      setSubmitting({ ...submitting, update: true });
      const base64 = await toBase64(file);
      const result = await uploadProfilePhoto(user.id, base64);
      setSubmitting({ ...submitting, update: false });

      enqueueSnackbar(
        `${
          result
            ? 'Profile image updated'
            : 'Failed to uplaod image, try with another image'
        }`,
        {
          variant: `${result ? 'success' : 'error'}`
        }
      );
    } catch (e) {
      console.info('e onChangeFile', e);
      setSubmitting({ ...submitting, update: false });
    }
  };

  const onUpdate = () => {
    inputRef.current.click();
  };

  const onRemove = async () => {
    try {
      setSubmitting({ ...submitting, remove: true });
      await removeProfilePhoto(user.id);
      setSubmitting({ ...submitting, remove: false });
      enqueueSnackbar('Profile image removed', {
        variant: 'success'
      });
    } catch (e) {
      console.error('e onRmove', e);
      setSubmitting({ ...submitting, remove: false });
    }
  };
  return (
    <>
      <Card className={clsx(classes.root, className)} {...rest}>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            flexDirection="column"
            textAlign="center"
          >
            {user.avatar === null ||
            user.avatar === '' ||
            user.avatar.includes('https://s.gravatar') ? (
              <Avatar
                className={classes.avatar}
                style={{ backgroundColor: userEmptyAvatar.color, fontSize: 40 }}
              >
                {userEmptyAvatar.letters}
              </Avatar>
            ) : (
              <Avatar className={classes.avatar} src={user.avatar} />
            )}
            <Typography
              className={classes.name}
              color="textPrimary"
              gutterBottom
              variant="h3"
            >
              {user.name}
            </Typography>
          </Box>
        </CardContent>
        <CardActions className={classes.relativeWrapper}>
          <input
            id="myInput"
            type="file"
            ref={inputRef}
            style={{ display: 'none' }}
            onChange={onChangeFile}
            accept=".jpg, .png, .jpeg, .gif, .bmp, .tif, .tiff|image/*"
          />
          <Button
            fullWidth
            variant="text"
            disabled={
              submitting.remove ||
              user.avatar === null ||
              user.avatar === '' ||
              user.avatar.includes('https://s.gravatar')
            }
            onClick={onRemove}
          >
            Remove picture
          </Button>
          {submitting.remove && (
            <CircularProgress size={24} className={classes.buttonProgress} />
          )}
        </CardActions>
        <CardActions className={classes.relativeWrapper}>
          <Button
            fullWidth
            variant="text"
            onClick={onUpdate}
            disabled={submitting.update}
          >
            update picture
          </Button>
          {submitting.update && (
            <CircularProgress size={24} className={classes.buttonProgress} />
          )}
        </CardActions>
      </Card>
      <Box display="flex" flexDirection="column" textAlign="center">
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={() => setOpenShareDlg(true)}
          className={classes.shareBtn}
        >
          Share Profile
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={() => window.open(sharedUrl, '_blank')}
        >
          Open Public Profile
        </Button>
        <ShareDialog
          open={openShareDlg}
          url={'/instructors/' + user.username}
          closeDlg={setOpenShareDlg}
        />
      </Box>
    </>
  );
};

ProfileDetails.propTypes = {
  className: PropTypes.string,
  user: PropTypes.object.isRequired
};

export default ProfileDetails;
