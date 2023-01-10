import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  IconButton,
  Hidden
} from '@material-ui/core/';
import { makeStyles } from '@material-ui/core/styles';
import { AvatarGroup } from '@material-ui/lab';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import getUserAvatar from 'src/utils/userAvatar';

const useStyles = makeStyles(theme => ({
  avatarGroup: {
    '& div': {
      width: theme.spacing(7),
      height: theme.spacing(7),
    }
  },
  holderContent: {
    display: 'grid',
    gridAutoFlow: 'column',
    overflowX: 'scroll'
  },
  showOneRow: {
    gridTemplateRows: 'auto'
  },
  showTwoRow: {
    gridTemplateRows: 'auto auto'
  },
  holdersSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  holderAvatar: {
    fontSize: 30,
    margin: '10px 30px',
    width: theme.spacing(7),
    height: theme.spacing(7)
  },
  holderName: {
    wordBreak: 'break-word',
    textAlign: 'center'
  }
}));

const HoldersView = ({ members, style }) => {
  const classes = useStyles();
  const [openHolderViewDlg, setOpenHolderViewDlg] = useState(false);

  console.log('members :>> ', members);
  return (
    <Card style={style}>
      <CardHeader
        title="Pass Holders"
        action={
          <IconButton
            aria-label="settings"
            onClick={() => setOpenHolderViewDlg(true)}
          >
            <Typography style={{ marginRight: 10 }}>View</Typography>
            <ArrowForwardIcon />
          </IconButton>
        }
      />
      <Divider />
      <CardContent>
        <AvatarGroup max={5} className={classes.avatarGroup}>
          {Object.keys(members)
            .filter(key => members[key].role != 'instructor')
            .map((key, index) => {
              if (members[key].photo_url === null || members[key].photo_url === '' || members[key].photo_url.includes('gravatar')){
                return (
                  <Avatar
                    style={{ backgroundColor: getUserAvatar(members[key].name).color }}
                    key={index}
                  >
                    {getUserAvatar(members[key].name).letters}
                  </Avatar>
                )
              }
              else{
                return (<Avatar src={members[key].photo_url}  key={index}/>)
              }
            }
          )}
        </AvatarGroup>
      </CardContent>
      <Dialog
        open={openHolderViewDlg}
        onClose={() => setOpenHolderViewDlg(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent
          className={`${classes.holderContent} ${
            Object.keys(members).length < 5
              ? classes.showOneRow
              : classes.showTwoRow
          }`}
        >
          {Object.keys(members)
            .filter(key => members[key].role != 'instructor')
            .map((key, index) => (
              <div className={classes.holdersSection} key={index}>
                {members[key].photo_url === null || members[key].photo_url === '' || members[key].photo_url.includes('gravatar') ? (
                  <Avatar
                    className={classes.holderAvatar}
                    style={{ backgroundColor: getUserAvatar(members[key].name).color }}
                  >
                    {getUserAvatar(members[key].name).letters}
                  </Avatar>
                ) : (
                  <Avatar className={classes.holderAvatar} src={members[key].photo_url} />
                )}
                <Typography className={classes.holderName}>
                  {members[key].name}
                </Typography>
              </div>
            ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHolderViewDlg(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default HoldersView;
