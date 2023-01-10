"use strict";

const { Pool } = require("pg");
const moment = require("moment-timezone");
const { v4: uuidv4 } = require("uuid");
const { db_config, stripe_key } = require("../utils/credentials");
const Stripe = require("stripe");
const stripe = Stripe(stripe_key, {
  maxNetworkRetries: 2,
});

const {
  getLifeIncomeEvent,
  getLifeIncomePackage,
  getThisMonthIncomeEvent,
  getThisMonthIncomePackage,
} = require("../utils/query");

const {
  addChatroomMember,
  addNewNotification,
} = require("../utils/firebaseAPI");

const { sendEventEmail, sendPackageEmail } = require("../utils/mailSender");
const { regCustomerToZoom } = require("../utils/zoom");

module.exports.getClientSecret = async (event, context, callback) => {
  const { eventId, userId, packageId } = JSON.parse(event.body);

  const client = new Pool(db_config);
  let query = [];

  console.log(`request: ${event.body}`);
  try {
    // Validation to check if event is purchased or not
    query = `SELECT * FROM mystudio.passes WHERE event_id='${eventId}' AND customer_id='${userId}' AND transaction_status='succeeded'`;
    const passRet = await client.query(query, []);

    if (passRet.rows.length !== 0) {
      await client.end();
      const response = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          status: false,
          message: "This event is already purchased by this customer.",
        }),
      };
      callback(null, response);
      return;
    }

    // get event/package price
    let eventRet = null;
    console.log("packageId :>> ", packageId);
    if (packageId) {
      eventRet = await client.query(
        `SELECT price, currency, fees FROM mystudio.packages WHERE id='${packageId}'`
      );
    } else {
      eventRet = await client.query(
        `SELECT price, currency, fees FROM mystudio.events WHERE id='${eventId}'`
      );
    }

    if (!eventRet || eventRet.rowCount == 0) {
      throw new Error("Not found events/packages!");
    }

    const customerRet = await client.query(
      `SELECT fees, credit FROM mystudio.customers WHERE id='${userId}'`
    );

    if (customerRet.rowCount == 0) {
      throw new Error("Not found this customer!");
    }

    const { fees } = customerRet.rows[0];
    const { price, currency } = eventRet.rows[0];

    const creditObj = customerRet.rows[0].credit;
    const credit = Number(creditObj[currency]);

    const amountInt = Number(price) * (1 + fees);

    console.log("amountInt :>> ", amountInt);

    const amountWillPay = credit
      ? credit >= amountInt
        ? 0
        : amountInt - credit
      : amountInt;

    console.log(`customer credit:${credit}, amountWillPay:${amountWillPay}`);

    let client_secret = -1;

    if (amountWillPay) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amountWillPay * 100),
        currency,
        // Verify your integration in this guide by including this parameter
        metadata: { integration_check: "accept_a_payment" },
      });
      client_secret = paymentIntent.client_secret;
    }

    await client.end();
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        status: true,
        message: {
          client_secret: client_secret,
          credit,
          fees,
        },
      }),
    };
    callback(null, response);
  } catch (err) {
    console.error(err);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

// purchaseEvent

module.exports.purchaseEvent = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const {
    customerId,
    customerEmail,
    customerAvatar,
    customerName,
    eventId,
    packageId,
    transData,
    instUsername,
  } = JSON.parse(event.body);
  const client = new Pool(db_config);
  let query = [];

  console.log(`request: ${event.body}`);
  console.log("transData :>> ", transData);

  // TODO: price field of TransData should be got from the db, not from the front-end
  let origin_price = 0;
  let currency = null;

  try {
    if (packageId) {
      query = `SELECT zoom_data FROM mystudio.packages WHERE id='${packageId}'`;
    } else {
      query = `SELECT zoom_data FROM mystudio.events WHERE id='${eventId}'`;
    }
    const zoomDataRet = await client.query(query, []);
    if (zoomDataRet.rowCount == 0) throw new Error("Not found this Event!");
    const { zoom_data } = zoomDataRet.rows[0];
    let zoom_registant_id = null;
    // register customers to the zoom meeting room created by the paid instructors
    if (zoom_data) {
      const { reg_data, error } = await regCustomerToZoom(
        customerEmail,
        customerName,
        instUsername,
        zoom_data,
        packageId
      );

      if (error) {
        console.warn("zoom reg error :>> ", error);
      }

      if (reg_data) {
        zoom_registant_id = reg_data.id;
      }
    }

    if (packageId) {
      query = `SELECT price, currency, zoom_data FROM mystudio.packages WHERE id='${packageId}'`;

      const priceRet = await client.query(query, []);
      if (priceRet.rowCount == 0) {
        await client.end();
        throw new Error("Not found package.");
      }

      origin_price = priceRet.rows[0].price;
      currency = priceRet.rows[0].currency;

      query = `SELECT id, currency FROM mystudio.events WHERE package_id='${packageId}'`;
      const eventIds = await client.query(query, []);
      for (let i = 0; i < eventIds.rows.length; i++) {
        const passId = uuidv4();
        query = `INSERT INTO mystudio.passes (id, event_id, customer_id, stripe_transaction_id, amount_paid, stripe_paid_amount, currency, transaction_date, transaction_status,zoom_registant_id, created_at) VALUES (
          '${passId}'
          ,'${eventIds.rows[i].id}'
          ,'${customerId}'
          ,${transData ? `'${transData.id}'` : `NULL`}
          ,${origin_price}
          ,${transData ? transData.amount / 100 : `NULL`}
          ,'${currency}'
          ,${moment().unix()}
          ,${transData ? `'${transData.status}'` : `'succeeded'`}
          ,${zoom_registant_id ? `'${zoom_registant_id}'` : `NULL`}
          ,${moment().unix()})
          `;

        await client.query(query, []);
      }

      await sendPackageEmail(
        packageId,
        0,
        customerEmail,
        customerId,
        transData ? transData.id : "Paid with credit"
      );

      query = `UPDATE mystudio.packages SET sold_tickets = sold_tickets + 1 WHERE id='${packageId}'`;

      await client.query(query, []);
    } else {
      query = `SELECT price, currency, zoom_data FROM mystudio.events WHERE id='${eventId}'`;
      const priceRet = await client.query(query, []);
      if (priceRet.rowCount == 0) {
        await client.end();
        throw new Error("Not found package.");
      }
      origin_price = priceRet.rows[0].price;
      currency = priceRet.rows[0].currency;

      const passId = uuidv4();
      query = `INSERT INTO mystudio.passes (id, event_id, customer_id, stripe_transaction_id, amount_paid, stripe_paid_amount, currency, transaction_date, transaction_status, zoom_registant_id, created_at) VALUES (
        '${passId}'
        ,'${eventId}'
        ,'${customerId}'
        ,${transData ? `'${transData.id}'` : `NULL`}
        ,${origin_price}
        ,${transData ? transData.amount / 100 : `NULL`}
        ,'${currency}'
        ,${moment().unix()}
        ,${transData ? `'${transData.status}'` : `'succeeded'`}
        ,${zoom_registant_id ? `'${zoom_registant_id}'` : `NULL`}
        ,${moment().unix()})
    `;
      await client.query(query, []);

      await sendEventEmail(
        eventId,
        0,
        customerEmail,
        customerId,
        transData ? transData.id : "Paid with credit"
      );

      query = `UPDATE mystudio.events SET sold_tickets = sold_tickets + 1 WHERE id='${eventId}'`;

      await client.query(query, []);
    }

    await addChatroomMember(
      packageId ? packageId : eventId,
      customerId,
      customerEmail,
      customerName,
      customerAvatar
    );

    // add new notification
    const passRet = await client.query(
      `SELECT * FROM mystudio.${packageId ? `packages` : `events`} WHERE id='${
        packageId ? packageId : eventId
      }'`
    );

    const passName = packageId
      ? passRet.rows[0].name
      : passRet.rows[0].event_name;
    console.log("passName for the notification:>> ", passName);

    const instRet = await client.query(
      `SELECT email FROM mystudio.users WHERE username='${instUsername}'`
    );

    await addNewNotification(
      instRet.rows[0].email,
      `${packageId ? "Package" : "Event"} Purchased`,
      `${customerName} purchased ${passName}`
    );

    query = `SELECT credit FROM mystudio.customers WHERE id='${customerId}'`;
    const creditRet = await client.query(query, []);

    const credit = creditRet.rows[0].credit[currency];
    const credit_used = credit
      ? credit >= origin_price
        ? origin_price
        : credit
      : 0;

    if (credit_used > 0) {
      query = `UPDATE mystudio.customers SET credit = credit || '{"${currency}":${
        Number(credit) - Number(credit_used)
      }}', credit_used = credit_used + ${credit_used} WHERE id='${customerId}';`;
      console.log("credit update query :>> ", query);
      await client.query(query, []);
    }

    await client.end();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Event is purchased successfully.",
      }),
    };
    callback(null, response);
  } catch (err) {
    console.error(err);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.getPayouts = async (event, context, callback) => {
  const { userId } = JSON.parse(event.body);
  const client = new Pool(db_config);
  let query = [];
  try {
    query = `SELECT * from mystudio.payouts WHERE user_id='${userId}' ORDER BY created_at`;
    const result = await client.query(query, []);
    await client.end();
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        body: result.rows,
        status: true,
      }),
    };
    callback(null, response);
  } catch (err) {
    console.error(err);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.getFinancialMetaData = async (event, contect, callback) => {
  const { user } = JSON.parse(event.body);
  console.log("user :>> ", user);
  const client = new Pool(db_config);
  let query = [];
  //balance lifetime_balance - lifetime payouts
  //monthly income
  //lifetime income
  try {
    const { id, currency, timezone } = user;
    //
    query = getLifeIncomeEvent(id, currency);
    console.log("query for income event:>> ", query);
    const sumRetEvent = await client.query(query, []);

    query = getLifeIncomePackage(id, currency);
    console.log("query for income package:>> ", query);
    const sumRetPackage = await client.query(query, []);

    query = `SELECT SUM(amount) AS "lifePayouts" FROM mystudio.payouts WHERE user_id='${id}' AND currency='${currency}' AND deleted_at IS NULL`;
    const payoutRet = await client.query(query, []);

    const lifeIncome =
      Number(sumRetEvent.rows[0].lifeIncome) +
      Number(sumRetPackage.rows[0].lifeIncome);

    const balance = lifeIncome - Number(payoutRet.rows[0].lifePayouts);

    console.log("balance :>> ", balance);

    // monthly income
    const firstday = moment()
      .tz(timezone.split(" ")[0])
      .startOf("month")
      .unix();
    const lastday = moment().tz(timezone.split(" ")[0]).endOf("month").unix();

    console.log("month day :>> ", firstday, lastday);

    query = getThisMonthIncomeEvent(id, currency, firstday, lastday);
    console.log("query this month event income:>> ", query);
    const thisRetEvent = await client.query(query, []);

    query = getThisMonthIncomePackage(id, currency, firstday, lastday);
    console.log("query this month package income:>> ", query);
    const thisRetPackage = await client.query(query, []);

    const thisMonthIncome =
      Number(thisRetEvent.rows[0].thisIncome) +
      Number(thisRetPackage.rows[0].thisIncome);

    const thisMonthSoldPasses =
      Number(thisRetEvent.rows[0].thisPasses) +
      Number(thisRetPackage.rows[0].thisPasses);

    await client.end();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        body: {
          balance,
          thisMonthIncome,
          lifeIncome,
          thisMonthSoldPasses,
        },
        status: true,
      }),
    };
    callback(null, response);
  } catch (err) {
    await client.end();
    console.error(err);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};
