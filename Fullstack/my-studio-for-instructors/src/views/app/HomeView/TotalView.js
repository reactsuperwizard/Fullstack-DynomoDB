import React, { useCallback, useEffect } from 'react';
import { Grid } from '@material-ui/core/';

import { makeStyles } from '@material-ui/core/styles';
import moment from 'moment';
import ShowChart from '@material-ui/icons/ShowChart';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';

import { getMetaData } from 'src/slices/financial';
import { useDispatch, useSelector } from 'src/store';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';

import FinancialCard from 'src/components/general/FinancialCard';

const useStyles = makeStyles(theme => ({
  root: {},
  imageIcon: {
    display: 'flex',
    height: 40,
    width: 40
  }
}));

const TotalView = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const isMountedRef = useIsMountedRef();

  const loadingMetaData = useCallback(() => {
    try {
      dispatch(getMetaData(user));
    } catch (err) {
      console.error(err);
    }
  }, [isMountedRef]);

  useEffect(() => {
    loadingMetaData();
  }, [loadingMetaData]);

  const { user } = useAuth();
  const { metaData } = useSelector(state => state.financial);

  return (
    <>
      <Grid container spacing={3} className={classes.headerDiv}>
        <Grid item sm={4} xs={12}>
          <FinancialCard
            title={moment().format('MMMM') + ' Passes Sold'}
            content={
              metaData.thisMonthSoldPasses == undefined
                ? -1
                : metaData.thisMonthSoldPasses
            }
            currency={null}
            icon={
              <img
                className={classes.imageIcon}
                src={require('src/assets/img/ticket_white.svg')}
                alt="Non-repeating event"
              />
            }
            tooltip="Passes sold in the currnet month"
          />
        </Grid>
        <Grid item sm={4} xs={12}>
          <FinancialCard
            title={moment().format('MMMM') + ' Income'}
            content={
              metaData.thisMonthIncome == undefined
                ? -1
                : metaData.thisMonthIncome
            }
            currency={user.currency}
            icon={<ShowChart fontSize="large" />}
            tooltip="Your income for the current month including any pending income minus fees"
          />
        </Grid>
        <Grid item sm={4} xs={12}>
          <FinancialCard
            title="Balance"
            content={metaData.balance == undefined ? -1 : metaData.balance}
            currency={user.currency}
            icon={<AttachMoneyIcon fontSize="large" />}
            tooltip="Your outstanding balance including any pending income"
          />
        </Grid>
      </Grid>
    </>
  );
};

export default TotalView;
