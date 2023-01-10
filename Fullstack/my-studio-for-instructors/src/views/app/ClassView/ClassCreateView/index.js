import React from 'react';
import { Container, makeStyles } from '@material-ui/core';
import Page from 'src/components/Page';
import Header from './Header';
import ClassCreateForm from './ClassCreateForm';

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: 100
  }
}));

const ClassCreateView = () => {
  const classes = useStyles();

  return (
    <Page
      className={classes.root}
      title="Product Create"
    >
      <Container maxWidth="lg">
        <Header />
        <ClassCreateForm />
      </Container>
    </Page>
  );
};

export default ClassCreateView;
