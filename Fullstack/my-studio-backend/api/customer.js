"use strict";

const { Pool } = require("pg");
const { uploadFile } = require("../utils/uploadFile");
const moment = require("moment");
const { db_config } = require("../utils/credentials");
const {
  createFirebaseUser,
  changeUserInfo,
  addNewNotification,
} = require("../utils/firebaseAPI");

const {
  getEventByIdQuery,
  getSeriesByIdQuery,
  getAllEventsCustomerQuery,
} = require("../utils/query");

const {
  sendEventChangeEmail,
  sendPackageUpdateEmail,
  sendContactMsgInst,
  sendVerificationCode,
} = require("../utils/mailSender");

const { cancelRegister } = require("../utils/zoom");

module.exports.set = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const client = new Pool(db_config);
  let query = [];
  const { sub, email, name, picture, timezone } = JSON.parse(event.body);

  query = `SELECT 1 FROM mystudio.customers WHERE id = '${sub}'`;
  const results1 = await client.query(query, []);
  if (results1.rowCount == 0) {
    // if (picture.includes('gravatar.com')) {
    //   query = `INSERT INTO mystudio.customers (id, name, email, avatar, timezone, created_at) VALUES ('${sub}','${name}','${email}', NULL,'${timezone}', NOW())`;
    // } else {
    const verifyCode = Math.floor(100000 + Math.random() * 900000);
    await sendVerificationCode(name, email, verifyCode);
    console.log("verify code", verifyCode);

    query = `INSERT INTO mystudio.customers (id, name, email, avatar, timezone, created_at, email_verified, verify_code) VALUES ('${sub}','${name}','${email}', '${picture}','${timezone}', NOW(), ${sub.includes('auth0') ? 0 : 1}, '${verifyCode}')`;
    // }
    await client.query(query, []);
  }

  query = `SELECT 
      id 
      ,name
      ,email
      ,avatar
      ,timezone
      ,email_subscription AS "emailSubscription"
      ,balance
      ,created_at AS "createdAt"
      ,updated_at AS "updatedAt"
      ,email_verified AS "emailVerified"
     FROM mystudio.customers WHERE id = '${sub}'`;
  const results2 = await client.query(query, []);
  await client.end();

  const fb_userId = await createFirebaseUser({
    ...results2.rows[0],
    avatar: picture,
  });

  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      message: results2.rows,
      input: event,
    }),
  };

  callback(null, response);
};

module.exports.uploadAvatar = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const client = new Pool(db_config);
    const { photoFile, userID } = JSON.parse(event.body);
    let link = null;
    if (photoFile) {
      link = await uploadFile(photoFile);
    }
    let query = [];
    console.log("link", link);
    if (link === null) {
      query = `
        UPDATE mystudio.customers SET
          avatar = NULL
          ,updated_at = now()
        WHERE id = '${userID}'`;
    } else {
      query = `
          UPDATE mystudio.customers SET
            avatar = '${link}'
            ,updated_at = now()
          WHERE id = '${userID}'`;
    }
    await client.query(query, []);

    query = `SELECT 
        id 
        ,name
        ,email
        ,avatar
        ,timezone
        ,balance
        ,created_at AS "createdAt"
        ,updated_at AS "updatedAt"
      FROM mystudio.customers WHERE id = '${userID}'`;

    const result = await client.query(query, []);
    await client.end();

    await changeUserInfo(
      userID,
      result.rows[0].email,
      result.rows[0].name,
      result.rows[0].avatar,
      true
    );

    const response = {
      statusCode: 200,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-credentials": true,
      },
      body: JSON.stringify({
        message: result.rows,
      }),
    };
    callback(null, response);
  } catch (err) {
    console.log("Failed to uploadAvatar", err);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.update = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const client = new Pool(db_config);
  let query = [];
  const { id, name, timezone, emailSubscription } = JSON.parse(event.body);
  query = `
      UPDATE mystudio.customers SET 
        name = '${name.replace(/'/g, "''")}'
        ,timezone = '${timezone.replace(/'/g, "''")}'
        ,email_subscription = ${emailSubscription ? 1 : 0}
        ,updated_at = now()
      WHERE id = '${id}'
    `;
  const results = await client.query(query, []);
  query = `SELECT email, avatar FROM mystudio.customers WHERE id='${id}'`;

  const userInfo = await client.query(query, []);

  await changeUserInfo(
    id,
    userInfo.rows[0].email,
    name,
    userInfo.rows[0].avatar,
    true
  );

  await client.end();
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      message: results,
      input: event,
    }),
  };

  callback(null, response);
};

module.exports.getEventById = async (event, context, callback) => {
  const { eventId } = JSON.parse(event.body);
  const client = new Pool(db_config);

  console.log(`eventId=${eventId}`);

  let series = [];
  try {
    const result1 = await client.query(getEventByIdQuery(eventId), []);

    if (result1.rows.length !== 0 && result1.rows[0].isPackage == true) {
      const result2 = await client.query(
        getSeriesByIdQuery(result1.rows[0].seriesId),
        []
      );
      series = result2.rows;
    }
    await client.end();
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: { ...result1.rows[0], series },
        input: event,
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

module.exports.getAllEvents = async (event, context, callback) => {
  const { fromTime, userId } = JSON.parse(event.body);

  const client = new Pool(db_config);
  let metaData = {};
  try {
    const results = await client.query(
      getAllEventsCustomerQuery(userId, fromTime),
      []
    );

    if (fromTime) {
      //if this is for getting coming events, get total data
      //credit
      const creditRet = await client.query(
        `SELECT credit FROM mystudio.customers WHERE id='${userId}'`
      );

      const creditObj = creditRet.rows[0].credit;
      let creditCurrency = "USD";
      if (creditObj.CAD != 0) {
        creditCurrency =
          Object.keys(creditObj)[
          Object.values(creditObj).indexOf(
            Math.max(...Object.values(creditObj))
          )
          ];
      }

      //total classes
      const utcNow = moment.utc().format("YYYY-MM-DD HH:mm");

      const passesRet = await client.query(
        `SELECT DISTINCT pp.stripe_transaction_id from mystudio.passes pp INNER JOIN mystudio.events ee ON pp.event_id=ee.id where pp.customer_id='${userId}' 
        AND pp.transaction_status='succeeded' AND ee.to_timestamp < '${utcNow}'`,
        []
      );

      metaData = {
        credit: creditObj[creditCurrency],
        creditCurrency,
        cntAttendEvents: passesRet.rowCount,
        cntComingEvents: results.rowCount,
      };
    }

    await client.end();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: { events: results.rows, metaData },
        input: event,
      }),
    };

    callback(null, response);
  } catch (err) {
    console.log("query error", err);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.getInstructorData = async (event, context, callback) => {
  const { instructorId, fromTime } = JSON.parse(event.body);
  console.log("instructorId :>> ", instructorId);
  const client = new Pool(db_config);
  let query = [];
  let instData = {};
  try {
    query = `SELECT id, name, email, business_name, phone_number, bio, certificates, avatar FROM mystudio.users
          WHERE username='${instructorId}'`;
    const results_user = await client.query(query, []);
    instData.user = results_user.rows[0];

    // Get coming packages
    query = `SELECT p.id, p.name, p.price, p.available_spaces AS "availableSpaces", p.sold_tickets FROM mystudio.packages p
             INNER JOIN mystudio.classes c ON p.class_id=c.id WHERE c.user_id='${results_user.rows[0].id}'`;
    const results_packages = await client.query(query, []);
    const packagesData = [];
    for (let i = 0; i < results_packages.rows.length; i++) {
      query = `SELECT MIN(from_timestamp), MAX(to_timestamp), COUNT(id), MIN(currency) AS "currency", 
                MIN(location) AS "location", MIN(other) AS "other", MIN(zoom_data ->> 'join_url') AS "zoom_data"
               FROM mystudio.events WHERE package_id='${results_packages.rows[i].id}'`;
      console.log("query", query);
      const result_item = await client.query(query, []);
      console.log(`min: ${result_item.rows[0].min}, fromtime: ${fromTime}`);
      if (
        result_item.rows[0].min !== null &&
        moment(result_item.rows[0].max).isAfter(fromTime)
      ) {
        const { min, max, currency, count, location, other, zoom_data } =
          result_item.rows[0];
        const type =
          (location && "In-Person") ||
          (other && "Other") ||
          (zoom_data && "Zoom");

        packagesData.push({
          ...results_packages.rows[i],
          min,
          max,
          count,
          currency,
          type,
        });
      }
    }
    instData.packages = packagesData;

    // Get coming events
    query = `SELECT id, event_name AS "eventName", currency,zoom_data AS "zoomData", other, from_timestamp AS "from", to_timestamp AS "to", location, price, available_spaces AS "availableSpaces", deleted_at AS "deletedAt" from mystudio.events
    WHERE is_package=false AND to_timestamp >= '${fromTime}' AND class_id IN (SELECT id from mystudio.classes WHERE user_id='${results_user.rows[0].id}') ORDER BY from_timestamp LIMIT 5`;

    const results_events = await client.query(query, []);
    instData.events = results_events.rows;

    await client.end();
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        body: instData,
        status: true,
      }),
    };
    callback(null, response);
  } catch (err) {
    console.log("query error", err);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.cancelEvent = async (event, context, callback) => {
  const { eventId, packageId, customerId, instUname } = JSON.parse(event.body);
  console.log(
    `eventId:${eventId}, packageId: ${packageId}, customerId: ${customerId}`
  );

  try {
    const client = new Pool(db_config);
    let query = [];
    let zoom_registant_id = null;

    // TODO: we should check if event > 24hrs

    query = `SELECT credit, name FROM mystudio.customers WHERE id='${customerId}'`;
    const cust_ret = await client.query(query, []);

    const instRet = await client.query(
      `SELECT email FROM mystudio.users WHERE username='${instUname}'`
    );

    if (packageId) {
      query = `SELECT amount_paid, id, currency, zoom_registant_id FROM mystudio.passes WHERE event_id in (SELECT id FROM mystudio.events WHERE package_id='${packageId}') AND customer_id='${customerId}'`;
      const pass_ret = await client.query(query, []);
      if (!pass_ret.rowCount)
        throw new Error("This package is not purchased by this customer!");

      zoom_registant_id = pass_ret.rows[0].zoom_registant_id;

      for (let ii = 0; ii < pass_ret.rowCount; ii++) {
        query = `UPDATE mystudio.passes SET transaction_status = 'canceled by customer' WHERE id='${pass_ret.rows[ii].id}'`;
        await client.query(query, []);
      }

      //credit update
      query = `UPDATE mystudio.customers SET credit = credit || '{"${pass_ret.rows[0].currency
        }":${Number(cust_ret.rows[0].credit[pass_ret.rows[0].currency]) +
        Number(pass_ret.rows[0].amount_paid)
        }}' WHERE id='${customerId}';
               UPDATE mystudio.packages SET sold_tickets = sold_tickets - 1 WHERE id='${packageId}';`;

      await client.query(query, []);
      await sendPackageUpdateEmail(
        packageId,
        2,
        customerId,
        instRet.rows[0].email
      );
    } else {
      query = `SELECT amount_paid, id, currency, zoom_registant_id FROM mystudio.passes WHERE event_id='${eventId}' AND customer_id='${customerId}'`;
      const pass_ret = await client.query(query, []);
      if (!pass_ret.rowCount)
        throw new Error("This event is not purchased by this customer!");

      zoom_registant_id = pass_ret.rows[0].zoom_registant_id;

      query = `UPDATE mystudio.customers SET credit = credit || '{"${pass_ret.rows[0].currency
        }":${Number(cust_ret.rows[0].credit[pass_ret.rows[0].currency]) +
        Number(pass_ret.rows[0].amount_paid)
        }}' WHERE id='${customerId}';
               UPDATE mystudio.passes SET transaction_status = 'canceled by customer' WHERE id='${pass_ret.rows[0].id
        }';
               UPDATE mystudio.events SET sold_tickets = sold_tickets - 1 WHERE id='${eventId}';`;

      await client.query(query, []);
      await sendEventChangeEmail(eventId, 2, customerId, instRet.rows[0].email);
    }

    query = `SELECT zoom_data FROM mystudio.events WHERE id='${eventId}'`;
    const zDataRet = await client.query(query, []);
    if (zoom_registant_id && zDataRet.rowCount && zDataRet.rows[0].zoom_data) {
      const cancelRet = await cancelRegister(
        instUname,
        customerId,
        zDataRet.rows[0].zoom_data,
        zoom_registant_id,
        packageId
      );
      console.log("result from canceling register :>> ", cancelRet);
    }

    // add new notification
    const passRet = await client.query(
      `SELECT * FROM mystudio.${packageId ? `packages` : `events`} WHERE id='${packageId ? packageId : eventId
      }'`
    );

    const passName = packageId
      ? passRet.rows[0].name
      : passRet.rows[0].event_name;
    console.log("passName for the notification:>> ", passName);

    await addNewNotification(
      instRet.rows[0].email,
      `${packageId ? "Package" : "Event"} Canceled`,
      `${cust_ret.rows[0].name} canceled ${passName}`
    );

    await client.end();
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        body: "succeeded to cancel the event/package",
        status: true,
      }),
    };
    callback(null, response);
  } catch (err) {
    console.log("query error", err);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.sendMsgInstructor = async (event, context, callback) => {
  const { customerId, username, msg } = JSON.parse(event.body);

  console.log(`event.body : ${event.body}`);
  const client = new Pool(db_config);
  try {
    const custRet = await client.query(
      `SELECT name, email FROM mystudio.customers WHERE id='${customerId}'`,
      []
    );
    if (!custRet.rowCount) throw new Error("Not found this customer");
    const instRet = await client.query(
      `SELECT name, email FROM mystudio.users WHERE username='${username}'`,
      []
    );
    if (!instRet.rowCount) throw new Error("Not found this instructor");

    console.log(`instructor email: ${instRet.rows[0].email}`);
    await sendContactMsgInst(
      instRet.rows[0].name,
      instRet.rows[0].email,
      custRet.rows[0].name,
      custRet.rows[0].email,
      msg
    );

    await client.end();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Message has been sent to the instructor!",
        status: true,
      }),
    };
    callback(null, response);
  } catch (err) {
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.sendNotification = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const { customerName, passId, passName, instUsername } = JSON.parse(
    event.body
  );

  console.log("event.body :>> ", event.body);
  try {
    const client = new Pool(db_config);

    const instRet = await client.query(
      `SELECT email FROM mystudio.users WHERE username='${instUsername}'`,
      []
    );
    if (!instRet.rowCount)
      throw new Error("Not found instructor from the username");

    await addNewNotification(
      instRet.rows[0].email,
      "New message",
      `${customerName} sent a new message in ${passName}`,
      passId
    );

    await client.end();
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Added new notification!",
        status: true,
      }),
    };
    callback(null, response);
  } catch (err) {
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.verifyAccount = async (event, context, callback) => {
  const { userId, code } = JSON.parse(event.body);
  try {
    console.log(`userId:${userId}, code: ${code}`);
    const client = new Pool(db_config);
    const code_ret = await client.query(
      `SELECT verify_code FROM mystudio.customers WHERE id='${userId}'`
    );
    const verified = code_ret.rowCount && code_ret.rows[0].verify_code == code;
    if (verified) {
      await client.query(
        `UPDATE mystudio.customers set email_verified = 1 WHERE id='${userId}'`
      );
    }
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        status: verified ? true : false,
        message: verified
          ? "Account verified successfully."
          : "Something was wrong, try again",
      }),
    };
    await client.end();
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
