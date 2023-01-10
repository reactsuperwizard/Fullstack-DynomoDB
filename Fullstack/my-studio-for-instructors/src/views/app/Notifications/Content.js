import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Grid,
  Card,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography
} from '@material-ui/core/';
import { useSelector } from 'src/store';
import { useHistory } from 'react-router-dom';

import moment from 'moment';

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  header: {
    marginBottom: 15
  },
  listItemTime: {
    textAlign: 'center',
    marginRight: 16
  },
  listItem: {
    cursor: 'pointer'
  }
}));

const Content = ({ content }) => {
  const classes = useStyles();
  const { events } = useSelector(state => state.events);
  const { classs } = useSelector(state => state.classes);
  const history = useHistory();

  const onClickItem = msg => {
    console.log('msg :>> ', msg);
    if (msg.title == 'New message' && msg.meta) {
      const event = events.find(
        o => o.eventId === msg.meta || o.packageId === msg.meta
      );
      const clas = event && classs.find(o => o.id === event.classId);
      if (event && clas) {
        history.push('/app/events/view', { event, clas });
      }
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h4" className={classes.header}>
          Notifications
        </Typography>
        <Card>
          <List disablePadding>
            {content &&
              content.map((msg, index) => (
                <ListItem
                  divider
                  key={index}
                  onClick={() => onClickItem(msg)}
                  className={classes.listItem}
                >
                  <ListItemAvatar className={classes.listItemTime}>
                    <Typography variant="caption">
                      {moment
                        .unix(msg.timestamp)
                        .format('hh:mm A  MMMM DD, YYYY')}
                    </Typography>
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
            {(!content || !content?.length) && (
              <Typography variant="caption">
                There is no notificaiton to show
              </Typography>
            )}
          </List>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Content;
