"use strict";

const { Pool } = require("pg");
const moment = require("moment");
const { v4: uuidv4 } = require("uuid");
const { createChatRoom } = require("../utils/firebaseAPI");

const { db_config } = require("../utils/credentials");
const { getAllEventsQuery } = require("../utils/query");
const {
  sendEventChangeEmail,
  sendPackageUpdateEmail,
} = require("../utils/mailSender");
const {
  createZoomMeeting,
  deleteZoomMeeting,
  udpateMeeting,
} = require("../utils/zoom");

module.exports.getEvents = async (event, context, callback) => {
  const client = new Pool(db_config);
  const { id, fromTime, orderby, limit } = JSON.parse(event.body);
  console.log("id :>> ", id);
  console.log("fromTime :>> ", fromTime);
  try {
    const packageResults = await client.query(
      getAllEventsQuery(fromTime, id, orderby, limit),
      []
    );

    await client.end();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: packageResults.rows,
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

module.exports.create = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; //<---Important

  const client = new Pool(db_config);
  let query = [];

  const {
    event_series_id,
    is_package,
    class_id,
    notes,
    location,
    place_id,
    zoom_link,
    price,
    currency,
    available_spaces,
    dates,
    package_name,
    user_id,
    user_avatar,
    username,
    user_email,
    other,
    frequency,
    days,
    event_count,
  } = JSON.parse(event.body);

  try {
    let package_id = null;
    let zoom_data = null;
    let occurrences_data = null;

    if (zoom_link == "unset") {
      console.log("Getting zoom data");

      const meetingData = await createZoomMeeting(
        user_id,
        dates[0],
        package_name,
        frequency,
        days,
        event_count
      );

      if (!meetingData) {
        console.error("Failed to create Zoom meeting room!");
      } else {
        const {
          meeting_id,
          join_url,
          start_url,
          password,
          occurrences,
        } = meetingData;
        zoom_data = {
          meeting_id,
          join_url,
          start_url,
          passcode: password,
        };
        occurrences_data = occurrences;
        console.log("zoom_data :>> ", zoom_data);
        console.log("occurrences_data :>> ", occurrences_data);
      }
    }

    if (package_name) {
      package_id = uuidv4();
      query = `
            INSERT INTO mystudio.packages (id, name, class_id, price, available_spaces, zoom_data, created_at) VALUES (
              '${package_id}'
              ,'${package_name}'
              ,'${class_id.replace(/'/g, "''")}'
              ,${price}
              ,${available_spaces}
              ,${zoom_data ? `'${JSON.stringify(zoom_data)}'` : `NULL`}
              ,${moment().unix()})
          `;
      await client.query(query, []);

      await createChatRoom({
        room_id: package_id,
        room_title: package_name,
        is_package,
        user_id,
        user_avatar,
        username,
        user_email,
      });
    }

    console.log("creat individual events :>> ");
    for (let i = 0; i < dates.length; i++) {
      const event_id = uuidv4();
      if (occurrences_data && occurrences_data[i]) {
        zoom_data.occurrence_id = occurrences_data[i].occurrence_id;
      }

      query = `
        INSERT INTO mystudio.events (id, event_series_id, is_package, class_id, notes, location, place_id, zoom_link, price, currency, available_spaces, zoom_data, from_timestamp, to_timestamp, event_name, package_id, created_at, other) VALUES (
          '${event_id}'
          ,${event_series_id ? `'${event_series_id}'` : `NULL`}
          ,${is_package}
          ,${!package_id ? `'${class_id.replace(/'/g, "''")}'` : `NULL`}
          ,'${notes.replace(/'/g, "''")}'
          ,${location ? `'${location.replace(/'/g, "''")}'` : `NULL`}
          ,${place_id ? `'${place_id.replace(/'/g, "''")}'` : `NULL`}
          ,${zoom_link ? `'${zoom_link.replace(/'/g, "''")}'` : `NULL`}
          ,${!package_id ? price : -1}
          ,'${currency.replace(/'/g, "''")}'
          ,${!package_id ? available_spaces : -1}
          ,${zoom_data ? `'${JSON.stringify(zoom_data)}'` : `NULL`}
          ,'${dates[i][0].replace(/'/g, "''")}'
          ,'${dates[i][1].replace(/'/g, "''")}'
          ,'${dates[i][2].replace(/'/g, "''")}'
          ,${package_id ? `'${package_id}'` : `NULL`}
          ,${moment().unix()}
          ,${other ? `'${other.replace(/'/g, "''")}'` : `NULL`})`;

      await client.query(query, []);
      if (!package_id) {
        await createChatRoom({
          room_id: event_id,
          room_title: dates[i][2],
          is_package,
          user_id,
          user_avatar,
          username,
          user_email,
        });
      }
    }

    await client.end();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Event created successfully",
        input: event,
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

module.exports.delete = async (event, context, callback) => {
  const client = new Pool(db_config);
  let query = [];
  const { id, packageId, userId } = JSON.parse(event.body);
  console.log(`id:${id}, packageId: ${packageId}`);

  try {
    if (packageId) {
      query = `UPDATE mystudio.packages SET deleted_at = ${moment().unix()}, sold_tickets=0 where id = '${packageId}';
               UPDATE mystudio.events SET deleted_at = ${moment().unix()} WHERE package_id = '${packageId}';`;
      await client.query(query, []);
    } else {
      query = `UPDATE mystudio.events SET deleted_at = ${moment().unix()}, sold_tickets=0 WHERE id = '${id}'`;
      await client.query(query, []);
    }
    query = `SELECT DISTINCT customer_id, amount_paid, currency FROM mystudio.passes WHERE event_id='${id}' OR event_id in (SELECT id FROM mystudio.events WHERE package_id='${packageId}')`;

    const c_idRet = await client.query(query, []);

    //increase the customer's credit as paid_amount
    for (let i = 0; i < c_idRet.rowCount; i++) {
      const { customer_id, amount_paid, currency } = c_idRet.rows[i];
      const customerRet = await client.query(
        `SELECT credit FROM mystudio.customers WHERE id='${customer_id}'`
      );

      query = `UPDATE mystudio.customers SET credit = credit || '{"${currency}":${
        Number(customerRet.rows[0].credit[currency]) + Number(amount_paid)
      }}' WHERE id='${customer_id}';`;

      await client.query(query, []);
    }

    //mark the status field in passes table to "canceled by instructor"
    query = `UPDATE mystudio.passes SET transaction_status = 'canceled by instructor' WHERE event_id='${id}' OR event_id in (SELECT id FROM mystudio.events WHERE package_id='${packageId}')`;

    await client.query(query, []);

    //send email to customers about the event/package cancelation
    if (!packageId) {
      await sendEventChangeEmail(id, 2);
    } else {
      await sendPackageUpdateEmail(packageId, 2);
    }

    console.log("deleting zoom meeting...");
    const eventRet = await client.query(
      `SELECT zoom_data FROM mystudio.events WHERE id='${id}'`,
      []
    );

    if (eventRet.rows[0].zoom_data) {
      console.log(`userId: ${userId}`);
      const zoom_del_ret = await deleteZoomMeeting(
        userId,
        eventRet.rows[0].zoom_data,
        packageId
      );
      console.log("zoom del :>> ", zoom_del_ret);
    }

    await client.end();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Event is deleted",
        input: event,
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

module.exports.update = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const client = new Pool(db_config);
  let query = [];
  const {
    userId,
    timezone,
    zoomData,
    eventId,
    classId,
    from_timestamp,
    to_timestamp,
    packageId,
    isPackage,
    other,
    name,
    packageName,
    location,
    price,
    availableSpaces,
    notes,
  } = JSON.parse(event.body);

  console.log(event.body);

  try {
    if (!isPackage) {
      query = `
      UPDATE mystudio.events SET 
        event_name = '${name.replace(/'/g, "''")}'
        ,class_id = '${classId.replace(/'/g, "''")}'
        ,from_timestamp = '${from_timestamp.replace(/'/g, "''")}'
        ,to_timestamp = '${to_timestamp.replace(/'/g, "''")}'  
        ${location ? `,location = '${location.replace(/'/g, "''")}'` : ``}
        ${other ? `,other = '${other.replace(/'/g, "''")}'` : ``}
        ,price = ${price}
        ,available_spaces = ${availableSpaces}
        ,notes = '${notes.replace(/'/g, "''")}'
        ,updated_at = ${moment().unix()}
      WHERE id = '${eventId}'
    `;
      console.log("no package", query);
      await client.query(query, []);
    } else {
      query = `
      UPDATE mystudio.events SET 
        event_name = '${name.replace(/'/g, "''")}'
        ,from_timestamp = '${from_timestamp.replace(/'/g, "''")}'
        ,to_timestamp = '${to_timestamp.replace(/'/g, "''")}'  
        ${location ? `,location = '${location.replace(/'/g, "''")}'` : ``}
        ${other ? `,other = '${other.replace(/'/g, "''")}'` : ``}
        ,notes = '${notes.replace(/'/g, "''")}'
        ,updated_at = ${moment().unix()}
      WHERE id = '${eventId}'
    `;
      console.log("package query for event", query);
      await client.query(query, []);

      query = `
      UPDATE mystudio.packages SET 
        name = '${packageName.replace(/'/g, "''")}'
        ,class_id = '${classId.replace(/'/g, "''")}'
        ,price = ${price}
        ,available_spaces = ${availableSpaces}
        ,updated_at = ${moment().unix()}
      WHERE id = '${packageId}'
    `;
      console.log("package query for package", query);
      await client.query(query, []);
    }

    // update the zoom meeting data - topic (e/p name), from_timestamp, to_timestamp
    //send email to customers about event update
    if (!packageId) {
      await sendEventChangeEmail(eventId, 1);
    }

    if (zoomData) {
      // update zoom meeting data
      const updateRet = await udpateMeeting(
        userId,
        timezone,
        zoomData,
        packageId ? packageName : name,
        from_timestamp,
        to_timestamp
      );
      console.log("updateRet :>> ", updateRet);
    }

    await client.end();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Event updated successfully",
        input: event,
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
