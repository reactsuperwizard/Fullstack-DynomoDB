import React from 'react';
import { Container, Grid, makeStyles } from '@material-ui/core';
import Page from 'src/components/Page';
import Financials from './Financials';
import EventIncomeList from './EventIncomeList';
import PayoutsList from './PayoutsList';

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

const FinancialView = () => {
  const classes = useStyles();

  return (
    <Page className={classes.root} title="Home">
      <Container maxWidth={false}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Financials />
          </Grid>
          <Grid item xs={12}>
            <EventIncomeList />
          </Grid>
          <Grid item xs={12}>
            <PayoutsList />
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
};

export default FinancialView;
