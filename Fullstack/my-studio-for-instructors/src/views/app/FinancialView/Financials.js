import React, { useCallback, useEffect } from 'react';
import { Box, Typography, Grid } from '@material-ui/core/';

import { makeStyles } from '@material-ui/core/styles';
import FinancialCard from 'src/components/general/FinancialCard';
import { getMetaData } from 'src/slices/financial';
import { useDispatch, useSelector } from 'src/store';
import useAuth from 'src/hooks/useAuth';
import useIsMountedRef from 'src/hooks/useIsMountedRef';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';

const useStyles = makeStyles(theme => ({
  root: {}
}));

const Financials = () => {
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
  console.log('metaDta :>> ', metaData);

  return (
    <>
      <Box mb={1}>
        <Typography color="inherit" variant="h3" style={{ marginRight: 10 }}>
          Financials
        </Typography>
      </Box>
      <Grid container spacing={3} className={classes.headerDiv}>
        <Grid item sm={4} xs={12}>
          <FinancialCard
            title="Balance"
            content={metaData.balance == undefined ? -1 : metaData.balance}
            prefix="$"
            currency={user.currency}
            icon={<AttachMoneyIcon fontSize="large" />}
            tooltip="Your outstanding balance including any pending income"
          />
        </Grid>
        <Grid item sm={4} xs={12}>
          <FinancialCard
            title="Monthly Income"
            content={
              metaData.thisMonthIncome == undefined
                ? -1
                : metaData.thisMonthIncome
            }
            currency={user.currency}
            icon={<AttachMoneyIcon fontSize="large" />}
            tooltip="Your income for the current month including any pending income minus fees"
          />
        </Grid>
        <Grid item sm={4} xs={12}>
          <FinancialCard
            title="Lifetime Income"
            content={
              metaData.lifeIncome == undefined ? -1 : metaData.lifeIncome
            }
            currency={user.currency}
            icon={<AttachMoneyIcon fontSize="large" />}
            tooltip="Your lifetime income including any pending income minus fees"
          />
        </Grid>
      </Grid>
    </>
  );
};

export default Financials;
