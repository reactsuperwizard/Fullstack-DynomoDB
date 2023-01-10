import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  makeStyles,
  CircularProgress,
  Typography
} from '@material-ui/core';
import axios from 'src/utils/axiosApiGateway';
import Page from 'src/components/Page';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import Header from './Header';
import Results from './Results';
import useAuth from 'src/hooks/useAuth';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.background.dark,
    minHeight: '100%',
    paddingTop: theme.spacing(3),
    paddingBottom: 100
  }
}));

const ClassListView = () => {
  const styleClasses = useStyles();
  const isMountedRef = useIsMountedRef();
  const [classes, setClasses] = useState([]);
  const [isLoading, setLoading] = useState(false);

  const { user } = useAuth();

  const getClasses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.post('/get_classes', user);
      console.log('classes', response);

      if (isMountedRef.current) {
        console.log(response.data.message);
        let classesTmp = response.data.message;
        if (classesTmp && classesTmp.length !== 0) {
          classesTmp = classesTmp.filter(cc => cc.deletedAt == null);
          setClasses(classesTmp);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
    }
  }, [isMountedRef]);

  useEffect(() => {
    getClasses();
  }, [getClasses]);

  return (
    <Page className={styleClasses.root} title="Class List">
      <Container maxWidth={false}>
        <Header />
        {classes && (
          <Box mt={3}>
            <Results classes={classes} verified={user.emailVerified} />
          </Box>
        )}
        {isLoading && (
          <Box display="flex" justifyContent="center" mt={3}>
            <CircularProgress />
          </Box>
        )}
        {!isLoading && classes.length == 0 && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Typography variant="caption">
              Press [NEW CLASS] on the top-right corner to create your first
              class.
            </Typography>
          </Box>
        )}
      </Container>
    </Page>
  );
};

export default ClassListView;
