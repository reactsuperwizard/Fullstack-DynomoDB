import React from 'react';
import {
  Box,
  CardContent,
  CardHeader,
  Divider,
  Typography,
  GridList,
  GridListTile,
  Card
} from '@material-ui/core/';

const ClassDetailView = ({ classIns, classes }) => {
  return (
    <>
      <CardContent>
        <Box mt={0} mb={0}>
          <Typography variant="subtitle2" color="textSecondary">
            Name
          </Typography>
        </Box>
        <Box mt={0} mb={0} pl={2} pr={2}>
          <Typography
            variant="body1"
            color="textSecondary"
            className={classes.detailTxt}
          >
            {classIns.name + (Boolean(classIns.deletedAt) && ' - DELETED')}
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
            {classIns.difficulty || '- - -'}
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
            component={'span'}
            className={classes.detailTxt}
          >
            {classIns.category || '- - -'}
          </Typography>
        </Box>
        <Box mt={2} mb={0}>
          <Typography variant="subtitle2" color="textSecondary">
            At a glance
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
                __html: classIns.atAGlance || '- - -'
              }}
            ></div>
          </Typography>
        </Box>
        <Box mt={2} mb={0}>
          <Typography variant="subtitle2" color="textSecondary">
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
                __html: classIns.equipment || '- - -'
              }}
            ></div>
          </Typography>
        </Box>
      </CardContent>
    </>
  );
};

export default ClassDetailView;
