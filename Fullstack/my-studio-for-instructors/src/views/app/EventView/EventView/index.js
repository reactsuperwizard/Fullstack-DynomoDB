import React, { useState, useEffect, useRef } from 'react';
import { Container, makeStyles } from '@material-ui/core';
import Page from 'src/components/Page';
import Header from 'src/components/EventView/Header';
import EventViewContent from './EventViewContent';
import PerfectScrollbar from 'react-perfect-scrollbar';
import ShareDialog from 'src/components/general/ShareDialog';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: 100
  }
}));

const EventView = ({ ...rest }) => {
  const classes = useStyles();
  const [openShareDlg, setOpenShareDlg] = useState(false);
  const pageRef = useRef(null);

  console.log('Event View:event :>> ', rest.location.state.event);
  console.log('Event View:class :>> ', rest.location.state.clas);

  useEffect(() => {
    const scrollPageTop = () => {
      if (pageRef.current && pageRef.current._container) {
        let timesRun = 0;
        let dh = pageRef.current._container.scrollTop / 20;
        let interval = setInterval(function() {
          timesRun += 1;
          if (timesRun === 20) {
            clearInterval(interval);
          }
          if (pageRef.current) {
            pageRef.current._container.scrollTop -= dh;
          }
        }, 15);
      }
    };
    scrollPageTop();
  }, [rest.location.state.event]);

  useEffect(() => {
    const scrollPageTop = () => {
      if (pageRef.current && pageRef.current._container) {
        pageRef.current._container.scrollTop = 0;
      }
    };
    scrollPageTop();
  }, []);

  return (
    <PerfectScrollbar ref={pageRef}>
      <Page className={classes.root} title="Event Create">
        <Container maxWidth={false}>
          <Header
            eventIns={rest.location.state.event}
            openShareDlg={() => setOpenShareDlg(true)}
          />
          <EventViewContent
            eventIns={rest.location.state.event}
            classIns={rest.location.state.clas}
            openShareDlg={() => setOpenShareDlg(true)}
          />
          <ShareDialog
            open={openShareDlg}
            url={'/events/' + rest.location.state.event.eventId}
            closeDlg={setOpenShareDlg}
          />
        </Container>
      </Page>
    </PerfectScrollbar>
  );
};

export default EventView;
