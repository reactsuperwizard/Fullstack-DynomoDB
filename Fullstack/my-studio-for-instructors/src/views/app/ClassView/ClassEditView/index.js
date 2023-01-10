import React from 'react';
import { Container, makeStyles } from '@material-ui/core';
import Page from 'src/components/Page';
import Header from './Header';
import ClassEditForm from './ClassEditForm';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: 100
  }
}));

const ClassCreateView = ({ ...rest }) => {
  const classes = useStyles();

  console.log('param', rest.location.state);
  return (
    <Page className={classes.root} title="Product Create">
      <Container maxWidth="lg">
        <Header name={rest.location.state.classInstance.name} />
        <ClassEditForm classInstance={rest.location.state.classInstance} />
      </Container>
    </Page>
  );
};

export default ClassCreateView;
