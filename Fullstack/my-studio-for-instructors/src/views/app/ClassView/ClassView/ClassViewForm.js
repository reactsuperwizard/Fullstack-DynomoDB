import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Typography,
  makeStyles,
  GridList,
  GridListTile
} from '@material-ui/core';
import ClassViewMenu from './ClassViewMenu';
import ClassDeleteDialog from 'src/components/general/ClassDeleteDialog';

const useStyles = makeStyles(theme => ({
  root: {},
  editor: {
    '& .ql-editor': {
      height: 200
    }
  },
  gridList: {
    flexWrap: 'nowrap',
    transform: 'translateZ(0)'
  },
  gridTile: {
    [theme.breakpoints.down('xs')]: {
      width: 'auto !important'
    },
    [theme.breakpoints.up('sm')]: {
      width: 'auto !important'
    }
  },
  detailTxt: { fontSize: '110%', fontWeight: '200' }
}));

const ClassViewForm = ({ className, schedule, classInstance }) => {
  const classes = useStyles();
  const history = useHistory();
  const [classToDelete, setClassToDelete] = useState({});
  const [open, setOpen] = useState(false);

  console.log(classInstance);

  const handleClose = () => {
    setOpen(false);
  };

  const handleEdit = classInstance => {
    console.log(classInstance);
    history.push('/app/classes/edit', { classInstance });
  };

  const handleDelete = classInstance => {
    setOpen(true);
    setClassToDelete(classInstance);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={12}>
        <Card>
          <CardHeader
            title="Class Information"
            action={
              <ClassViewMenu
                handleDelete={() => handleDelete(classInstance)}
                handleEdit={() => handleEdit(classInstance)}
                handleSchedule={schedule}
              />
            }
          />
          <Divider />
          <CardContent>
            <Box mt={0} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                Class Name
              </Typography>
            </Box>
            <Box mt={0} mb={0} pl={2} pr={2}>
              <Typography
                variant="body1"
                color="textSecondary"
                className={classes.detailTxt}
              >
                {classInstance.name}
              </Typography>
            </Box>

            <Box mt={2} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                Category
              </Typography>
            </Box>
            <Box mt={0} mb={0} pl={2} pr={2}>
              <Typography
                variant="body1"
                color="textSecondary"
                className={classes.detailTxt}
              >
                {classInstance.category || '- - -'}
              </Typography>
            </Box>

            <Box mt={2} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                Difficulty
              </Typography>
            </Box>
            <Box mt={0} mb={0} pl={2} pr={2}>
              <Typography
                variant="body1"
                color="textSecondary"
                className={classes.detailTxt}
              >
                {classInstance.difficulty || '- - -'}
              </Typography>
            </Box>

            <Box mt={2} mb={0}>
              <Typography variant="subtitle2" color="textSecondary">
                At a Glance
              </Typography>
            </Box>
            <Box mt={0} mb={0} pl={2} pr={2}>
              <Typography
                variant="body1"
                color="textSecondary"
                component={'span'}
                className={classes.detailTxt}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: classInstance.atAGlance || '- - -'
                  }}
                ></div>
              </Typography>
            </Box>

            <Box mt={2} mb={0}>
              <Typography
                variant="subtitle2"
                color="textSecondary"
                component={'span'}
              >
                Equipment
              </Typography>
            </Box>
            <Box mt={0} mb={0} pl={2} pr={2}>
              <Typography
                variant="body1"
                color="textSecondary"
                component={'span'}
                className={classes.detailTxt}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: classInstance.equipment || '- - -'
                  }}
                ></div>
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Grid item xs={12} md={12}>
          <Card style={{ marginTop: 20 }}>
            <CardHeader title="Images" />
            <Divider />
            <CardContent style={{ padding: 5 }}>
              <GridList cellHeight={240} className={classes.gridList}>
                {classInstance.images.map(src => (
                  <GridListTile key={src} cols={1} className={classes.gridTile}>
                    <img
                      style={{ width: 'auto', height: 240, objectFit: 'cover' }}
                      src={src}
                    />
                  </GridListTile>
                ))}
              </GridList>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid item xs={12} lg={4}></Grid>
      <ClassDeleteDialog
        openFlag={open}
        classIns={classToDelete}
        close={handleClose}
        shouldRoute
      />
    </Grid>
  );
};

ClassViewForm.propTypes = {
  className: PropTypes.string
};

export default ClassViewForm;
