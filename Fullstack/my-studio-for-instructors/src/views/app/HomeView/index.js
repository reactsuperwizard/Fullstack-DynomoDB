import React, { useState, useEffect } from 'react';
import { Container, Grid, makeStyles, Box, TextField } from '@material-ui/core';
import Page from 'src/components/Page';
import EventSeriesView from './EventSeriesView';
import Financials from './TotalView';
import useAuth from 'src/hooks/useAuth';
import VerificationDialog from 'src/components/general/VerificationDialog';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3)
  },
  headerDiv: {
    marginBottom: 0
  }
}));

const HomeView = () => {
  const classes = useStyles();
  const [openDlg, setOpenDlg] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    console.log('emailVerified :>> ', user.emailVerified);
    setOpenDlg(!user.emailVerified);
  }, [user]);

  return (
    <Page className={classes.root} title="Home">
      <Container maxWidth={false}>
        <Financials />
        <Box mt={2}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <EventSeriesView />
            </Grid>
          </Grid>
        </Box>
      </Container>
      <VerificationDialog open={openDlg} />
    </Page>
  );
};

export default HomeView;
