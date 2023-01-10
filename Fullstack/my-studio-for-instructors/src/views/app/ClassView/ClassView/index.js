import React from 'react';
import { Container, makeStyles } from '@material-ui/core';
import Page from 'src/components/Page';
import Header from './Header';
import ClassViewForm from './ClassViewForm';
import useAuth from 'src/hooks/useAuth';
import { useSnackbar } from 'notistack';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: 100
  }
}));

const ClassView = ({ className, ...rest }) => {
  console.log(rest.location.state.classInstance);
  const classes = useStyles();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const history = useHistory();

  const handleSchedule = () => {
    if (!user.emailVerified) {
      enqueueSnackbar('Verify your email in order to make a schedule.', {
        variant: 'error'
      });
      return;
    }
    history.push('/app/events/create', {
      classId: rest.location.state.classInstance.id,
      classsName: rest.location.state.classInstance.name
    });
  };

  return (
    <Page className={classes.root} title="Product Create">
      <Container maxWidth="lg">
        <Header
          name={rest.location.state.classInstance.name}
          classId={rest.location.state.classInstance.id}
          schedule={handleSchedule}
        />
        <ClassViewForm
          classInstance={rest.location.state.classInstance}
          schedule={handleSchedule}
        />
      </Container>
    </Page>
  );
};

export default ClassView;
