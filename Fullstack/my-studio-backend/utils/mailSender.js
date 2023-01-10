const sgMail = require("@sendgrid/mail");
const { Pool } = require("pg");
const { db_config } = require("../utils/credentials");
const moment = require("moment-timezone");
const { getPackageEventsByIdQuery } = require("./query");
const ical = require("ical-generator");

const { getEventByIdQuery, getSeriesByIdQuery } = require("../utils/query");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const email_types = ["Confirmation", "Updated", "Canceled"];
const email_templates = {
  individualEvent: "d-1713677a50a54b3ca61ee82c89ec9459",
  packageEvent: "d-951801e3ef8a474f8bed2f7979e57801",
  constactInst: "d-15eeab2dc8c84e8997b482b843a279e4",
  payoutRequest: "d-bf97b0116d924c7c9316c1b4937d6066",
  verifyCode: "d-3a0f5247aee9451c9f625af239ee6a9d",
};

const isNextDay = (from, to, timezone) => {
  const start_time = moment.utc(from).tz(timezone).format("HH:mm");
  const end_time = moment.utc(to).tz(timezone).format("HH:mm");
  return (
    moment.duration(
      moment(end_time, "HH:mm").diff(moment(start_time, "HH:mm"))
    ) <= 0
  );
};

const isEmailSubscripted = async (customer_id) => {
  const client = new Pool(db_config);
  const custRet = await client.query(
    `SELECT email_subscription FROM mystudio.customers WHERE id='${customer_id}'`
  );
  await client.end();
  if (!custRet.rowCount) return false;
  return Boolean(Number(custRet.rows[0].email_subscription));
};

const getICSValue = async (event_id, type) => {
  const types = ["CONFIRMED", "TENTATIVE", "CANCELLED"];
  try {
    const client = new Pool(db_config);
    const event_ret = await client.query(getEventByIdQuery(event_id), []);
    if (event_ret.rowCount == 0) return null;

    const {
      notes,
      name,
      created_at,
      location,
      zoomData,
      cName,
      uName,
      email,
      isPackage,
    } = event_ret.rows[0];

    if (!isPackage) {
      const cal = ical({ domain: "passtree.net", name: "iCal for passtree" });
      const { from, to } = event_ret.rows[0];
      const ics = cal.createEvent({
        start: moment.utc(from),
        end: moment.utc(to),
        summary: name,
        uid: event_id,
        stamp: moment.unix(created_at),
        status: types[type],
        description: location
          ? `Location: ${location}`
          : zoomData
          ? `Zoom: ${zoomData.join_url}`
          : notes,
        organizer: {
          name: uName,
          email: email,
          mailto: email,
        },
      });
      if (location) {
        ics.location(location);
      } else if (zoomData) {
        ics.url(zoomData.join_url);
      }
      ics.categories([{ name: cName }]);
      await client.end();
      return cal.toString();
    }

    //for the package
    const series_ret = await client.query(
      getSeriesByIdQuery(event_ret.rows[0].seriesId),
      []
    );
    if (!series_ret.rowCount) return null;

    let files = [];
    for (const ee of series_ret.rows) {
      const cal = ical({ domain: "passtree.net", name: "iCal for passtree" });
      const { from, to, eventId } = ee;
      const eTmp = {
        start: moment.utc(from),
        end: moment.utc(to),
        summary: name,
        uid: eventId,
        stamp: moment.unix(created_at),
        status: types[type],
        description: location
          ? `Location: ${location}`
          : zoomData
          ? `Zoom: ${zoomData.join_url}`
          : notes,
        organizer: {
          name: uName,
          email: email,
          mailto: email,
        },
      };

      if (location) {
        eTmp.location = location;
      } else if (zoomData) {
        eTmp.url = zoomData.join_url;
      }

      const ics = cal.createEvent(eTmp);
      ics.categories([{ name: cName }]);
      files.push(cal.toString());
    }
    await client.end();
    return files;
  } catch (err) {
    console.error(err);
    return null;
  }
};

module.exports.sendVerificationCode = async (name, email, code) => {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_SERNDER_EMAIL,
      templateId: email_templates.verifyCode,
      dynamic_template_data: {
        name,
        code,
      },
    };
    const resultSent = await sgMail.send(msg);
    console.log("sent payout request email :>> ", resultSent);
    return verifyCode;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports.sendEventEmail = async (
  event_id,
  type,
  receiver_email,
  customerId,
  confirm_number
) => {
  if (!(await isEmailSubscripted(customerId))) return;

  const client = new Pool(db_config);
  console.log("receiver email :>> ", receiver_email);
  try {
    const query = `SELECT * FROM mystudio.events WHERE id='${event_id}'`;

    const e_result = await client.query(query, []);
    if (!e_result.rowCount) return false;
    const {
      event_name,
      from_timestamp,
      to_timestamp,
      location,
      zoom_data,
      currency,
      available_spaces,
      price,
    } = e_result.rows[0];
    const c_result = await client.query(
      `SELECT timezone FROM mystudio.customers WHERE id='${customerId}'`,
      []
    );
    const { timezone } = c_result.rows[0];
    console.log("customerId :>> ", customerId);

    const msg = {
      to: receiver_email,
      from: process.env.SENDGRID_SERNDER_EMAIL,
      templateId: email_templates.individualEvent,
      dynamic_template_data: {
        subject: event_name + " - " + email_types[type],
        name: event_name,
        date: moment(from_timestamp).format("dddd MMM D, YYYY"),
        time:
          moment
            .utc(from_timestamp)
            .tz(timezone.split(" ")[0])
            .format("hh:mm A") +
          " - " +
          moment
            .utc(to_timestamp)
            .tz(timezone.split(" ")[0])
            .format("hh:mm A") +
          (isNextDay(from_timestamp, to_timestamp, timezone.split(" ")[0])
            ? " +1 day"
            : ""),
        timezone,
        location,
        zoom_link: zoom_data ? zoom_data.start_url : null,
        join_url: zoom_data ? zoom_data.start_url.split("?")[0] : null,
        price:
          Number(price).toLocaleString("en-US", {
            style: "currency",
            currency: currency,
          }) +
          " " +
          currency,
        available_spaces,
        confirm_number,
        purchase_date: moment().tz(timezone.split(" ")[0]).format("YYYY-MM-DD"),
      },
    };

    const ics_ret = await getICSValue(event_id, 0);
    console.log("ics_ret :>> ", ics_ret);

    if (ics_ret && typeof ics_ret == "string") {
      const buff = new Buffer(ics_ret);
      const base64data = buff.toString("base64");
      msg.attachments = [
        {
          content: base64data,
          filename: `event-${event_id}.ics`,
          type: "application/ics",
          disposition: "attachment",
        },
      ];
    }

    const resultSent = await sgMail.send(msg);
    console.log("sendgrid sent result :>> ", resultSent);
    await client.end();

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports.sendPackageEmail = async (
  package_id,
  type,
  receiver_email,
  customerId,
  confirm_number
) => {
  if (!(await isEmailSubscripted(customerId))) return;

  const client = new Pool(db_config);
  console.log("receiver package email :>> ", receiver_email);
  try {
    const query = getPackageEventsByIdQuery(package_id);
    console.log("query sendpackageemail", query);
    const p_results = await client.query(query, []);
    console.log("count of result :>> ", p_results.rowCount);

    if (!p_results.rowCount) return false;
    const {
      name,
      from_timestamp,
      to_timestamp,
      currency,
      available_spaces,
      price,
    } = p_results.rows[0];

    const c_result = await client.query(
      `SELECT timezone FROM mystudio.customers WHERE id='${customerId}'`,
      []
    );
    const { timezone } = c_result.rows[0];

    let events = [];
    for (let i = 0; i < p_results.rowCount; i++) {
      events.push({
        ...p_results.rows[i],
        timezone,
        date: moment(p_results.rows[i].from_timestamp).format(
          "dddd MMM D, YYYY"
        ),
        time:
          moment
            .utc(p_results.rows[i].from_timestamp)
            .tz(timezone.split(" ")[0])
            .format("hh:mm A") +
          " - " +
          moment
            .utc(p_results.rows[i].to_timestamp)
            .tz(timezone.split(" ")[0])
            .format("hh:mm A") +
          (isNextDay(from_timestamp, to_timestamp, timezone.split(" ")[0])
            ? " +1 day"
            : ""),
        zoom_link: p_results.rows[i].zoom_data
          ? p_results.rows[i].zoom_data.start_url
          : null,
        join_url: p_results.rows[i].zoom_data
          ? p_results.rows[i].zoom_data.start_url.split("?")[0]
          : null,
      });
    }

    const msg = {
      to: receiver_email,
      from: process.env.SENDGRID_SERNDER_EMAIL,
      templateId: email_templates.packageEvent,
      dynamic_template_data: {
        subject: name + " - " + email_types[type],
        name: name,
        start_date: moment(from_timestamp).format("dddd MMM D, YYYY"),
        end_date: moment(
          p_results.rows[p_results.rowCount - 1].from_timestamp
        ).format("dddd MMM D, YYYY"),
        price:
          Number(price).toLocaleString("en-US", {
            style: "currency",
            currency: currency,
          }) +
          " " +
          currency,
        available_spaces,
        events_number: p_results.rowCount,
        purchase_date: moment().tz(timezone.split(" ")[0]).format("YYYY-MM-DD"),
        events,
        confirm_number,
      },
    };

    const ics_ret = await getICSValue(package_id, 0);
    console.log("ics_ret :>> ", ics_ret);

    if (ics_ret && ics_ret.length !== 0) {
      const attach = [];
      for (let ii = 0; ii < ics_ret.length; ii++) {
        const buff = new Buffer(ics_ret[ii]);
        const base64data = buff.toString("base64");

        attach.push({
          content: base64data,
          filename: `package-${package_id}-${ii}.ics`,
          type: "application/ics",
          disposition: "attachment",
        });
      }
      msg.attachments = attach;
    }

    const resultSent = await sgMail.send(msg);
    console.log("package sent result :>> ", resultSent);
    await client.end();

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports.sendEventChangeEmail = async (
  event_id,
  type,
  customerId = null,
  instEmail = null
) => {
  const client = new Pool(db_config);
  try {
    let query = `SELECT * FROM mystudio.events WHERE id='${event_id}'`;

    console.log("query :>> ", query);
    const e_result = await client.query(query, []);
    if (!e_result.rowCount) return false;
    const {
      event_name,
      from_timestamp,
      to_timestamp,
      location,
      zoom_data,
      available_spaces,
      price,
      currency,
    } = e_result.rows[0];

    //get customers who purchased this events
    query = `SELECT email, timezone FROM mystudio.customers WHERE id ${
      customerId
        ? `= '${customerId}'`
        : `in (SELECT customer_id FROM mystudio.passes WHERE event_id='${event_id}')`
    }`;

    const c_result = await client.query(query, []);
    for (let i = 0; i < c_result.rowCount; i++) {
      const { timezone, email } = c_result.rows[i];
      console.log("customer email :>> ", email);

      const msg = {
        to: email,
        from: process.env.SENDGRID_SERNDER_EMAIL,
        templateId: email_templates.individualEvent,
        dynamic_template_data: {
          subject: event_name + " - " + email_types[type],
          name: event_name,
          date: moment(from_timestamp).format("dddd MMM D, YYYY"),
          time:
            moment
              .utc(from_timestamp)
              .tz(timezone.split(" ")[0])
              .format("hh:mm A") +
            " - " +
            moment
              .utc(to_timestamp)
              .tz(timezone.split(" ")[0])
              .format("hh:mm A") +
            (isNextDay(from_timestamp, to_timestamp, timezone.split(" ")[0])
              ? " +1 day"
              : ""),
          timezone,
          location,
          zoom_link: zoom_data ? zoom_data.join_url : null,
          join_url: zoom_data ? zoom_data.join_url.split("?")[0] : null,
          available_spaces,
          credit:
            price &&
            Number(price).toLocaleString("en-US", {
              style: "currency",
              currency,
            }) +
              " " +
              currency,
        },
      };

      const ics_ret = await getICSValue(event_id, type == 2 ? 2 : 0);
      console.log("icsStr :>> ", ics_ret);

      if (ics_ret && typeof ics_ret == "string") {
        const buff = new Buffer(ics_ret);
        const base64data = buff.toString("base64");
        msg.attachments = [
          {
            content: base64data,
            filename: `event-${event_id}.ics`,
            type: "application/ics",
            disposition: "attachment",
          },
        ];
      }

      if (await isEmailSubscripted(customerId)) {
        await sgMail.send(msg);
      }

      if (instEmail && !i) {
        const instRet = await client.query(
          `SELECT email_subscription FROM mystudio.users WHERE email='${instEmail}'`,
          []
        );
        if (instRet.rows[0].email_subscription) {
          await sgMail.send({ ...msg, to: instEmail });
        }
      }
    }

    await client.end();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports.sendPackageUpdateEmail = async (
  package_id,
  type,
  customer_id = null,
  instEmail = null
) => {
  try {
    const client = new Pool(db_config);
    let query = `SELECT email, timezone FROM mystudio.customers WHERE id ${
      customer_id
        ? `= '${customer_id}'`
        : `in (SELECT customer_id FROM mystudio.passes 
      WHERE event_id in (SELECT id FROM mystudio.events WHERE package_id='${package_id}'))`
    }`;
    const c_result = await client.query(query, []);

    query = getPackageEventsByIdQuery(package_id);
    const p_results = await client.query(query, []);
    if (!p_results.rowCount) return false;

    const {
      name,
      from_timestamp,
      to_timestamp,
      available_spaces,
      currency,
      price,
    } = p_results.rows[0];

    for (let ii = 0; ii < c_result.rowCount; ii++) {
      const { timezone, email } = c_result.rows[ii];
      console.log("customer email :>> ", email);
      let events = [];
      for (let i = 0; i < p_results.rowCount; i++) {
        events.push({
          ...p_results.rows[i],
          timezone,
          date: moment(p_results.rows[i].from_timestamp).format(
            "dddd MMM D, YYYY"
          ),
          time:
            moment
              .utc(p_results.rows[i].from_timestamp)
              .tz(timezone.split(" ")[0])
              .format("hh:mm A") +
            " - " +
            moment
              .utc(p_results.rows[i].to_timestamp)
              .tz(timezone.split(" ")[0])
              .format("hh:mm A") +
            (isNextDay(from_timestamp, to_timestamp, timezone.split(" ")[0])
              ? " +1 day"
              : ""),
          zoom_link: p_results.rows[i].zoom_data
            ? p_results.rows[i].zoom_data.start_url
            : null,
          join_url: p_results.rows[i].zoom_data
            ? p_results.rows[i].zoom_data.start_url.split("?")[0]
            : null,
        });
      }

      const msg = {
        to: email,
        from: process.env.SENDGRID_SERNDER_EMAIL,
        templateId: email_templates.packageEvent,
        dynamic_template_data: {
          subject: name + " - " + email_types[type],
          name: name,
          start_date: moment(from_timestamp).format("dddd MMM D, YYYY"),
          end_date: moment(
            p_results.rows[p_results.rowCount - 1].from_timestamp
          ).format("dddd MMM D, YYYY"),
          available_spaces,
          events_number: p_results.rowCount,
          events,
          credit:
            price &&
            Number(price).toLocaleString("en-US", {
              style: "currency",
              currency,
            }) +
              " " +
              currency,
        },
      };

      const ics_ret = await getICSValue(package_id, type == 2 ? 2 : 0);
      console.log("icsStr :>> ", ics_ret);

      if (ics_ret && ics_ret.length !== 0) {
        const attach = [];
        for (let ii = 0; ii < ics_ret.length; ii++) {
          const buff = new Buffer(ics_ret[ii]);
          const base64data = buff.toString("base64");

          attach.push({
            content: base64data,
            filename: `package-${package_id}-${ii}.ics`,
            type: "application/ics",
            disposition: "attachment",
          });
        }
        msg.attachments = attach;
      }
      if (await isEmailSubscripted(customer_id)) {
        await sgMail.send(msg);
      }

      await sgMail.send(msg);
      if (instEmail && !ii) {
        const instRet = await client.query(
          `SELECT email_subscription FROM mystudio.users WHERE email='${instEmail}'`,
          []
        );
        if (instRet.rows[0].email_subscription) {
          await sgMail.send({ ...msg, to: instEmail });
        }
      }
    }

    await client.end();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports.sendContactMsgInst = async (
  name,
  email,
  cust_name,
  cust_email,
  message
) => {
  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_SERNDER_EMAIL,
      templateId: email_templates.constactInst,
      dynamic_template_data: {
        subject: `You have been contacted from the customer.`,
        name,
        cust_name,
        cust_email,
        message,
      },
    };

    console.log("msg :>> ", msg);
    const resultSent = await sgMail.send(msg);
    console.log("sent contact msg to instructor :>> ", resultSent);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports.sendPayoutRequestEmail = async (
  name,
  email,
  amount,
  message
) => {
  try {
    const msg = {
      to: "payouts@passtree.net",
      from: process.env.SENDGRID_SERNDER_EMAIL,
      templateId: email_templates.payoutRequest,
      dynamic_template_data: {
        name,
        email,
        amount,
        message,
      },
    };
    console.log("msg :>> ", msg);
    const resultSent = await sgMail.send(msg);
    console.log("sent payout request email :>> ", resultSent);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
