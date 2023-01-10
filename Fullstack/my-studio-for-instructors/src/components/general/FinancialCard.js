import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, Box, Card, Typography, makeStyles, Tooltip } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  avatar: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    height: 48,
    width: 48
  }
}));

const FinancialCard = ({ title, content, currency, icon, tooltip }) => {
  const classes = useStyles();

  return (
    <Tooltip title={tooltip}>
      <Card className={classes.root}>
        <Box flexGrow={1}>
          <Typography
            color="inherit"
            component="h3"
            gutterBottom
            variant="overline"
          >
            {title}
          </Typography>
          <Box display="flex" alignItems="center" flexWrap="wrap">
            {content == -1 ? (
              <Skeleton
                animation="wave"
                width="70%"
                height={28}
                style={{ transform: 'scale(1)' }}
              />
            ) : (
              <Typography
                color="inherit"
                variant="h3"
                style={{ marginRight: 10 }}
              >
                {currency
                  ? Number(content).toLocaleString('en-US', {
                      style: 'currency',
                      currency: currency
                    }) +
                    ' ' +
                    currency
                  : content}
              </Typography>
            )}
          </Box>
        </Box>
        <Avatar className={classes.avatar} color="inherit">
          {icon}
        </Avatar>
      </Card>
    </Tooltip>
  );
};

FinancialCard.propTypes = {
  className: PropTypes.string
};

export default FinancialCard;
