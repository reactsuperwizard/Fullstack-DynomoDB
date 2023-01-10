const { Pool } = require("pg");
const { db_config, zoom_setting } = require("../utils/credentials");
const qs = require("qs");
const axios = require("axios");
const jwt_decode = require("jwt-decode");
const moment = require("moment-timezone");
const base64 = require("base-64");

module.exports.createZoomMeeting = async (
  userId,
  eventMeta,
  packageName,
  frequency,
  days,
  event_count
) => {
  try {
    console.log(`frequency:${frequency}, days: ${days}`);
    const client = new Pool(db_config);
    let query = `SELECT zoom_refresh_token, zoom_account_plan, timezone FROM mystudio.users WHERE id='${userId}'`;
    let meetingData = null;
    const userRet = await client.query(query, []);
    if (userRet.rowCount !== 0 && userRet.rows[0].zoom_refresh_token) {
      const {
        timezone,
        zoom_refresh_token,
        zoom_account_plan,
      } = userRet.rows[0];

      console.log("zoom_account_plan :>> ", zoom_account_plan);

      let payload = qs.stringify({
        grant_type: "refresh_token",
        refresh_token: zoom_refresh_token,
      });

      console.log(
        "data for getting access token from refresh token:>> ",
        payload
      );

      const result = await axios.post("https://zoom.us/oauth/token", payload, {
        headers: {
          Authorization: `Basic ${base64.encode(
            zoom_setting.clientId + ":" + zoom_setting.clientSecret
          )}`,
        },
      });

      const { access_token, refresh_token } = result.data;
      const { uid } = jwt_decode(access_token);
      console.log("uid :>> ", uid);

      const requestBody = {
        topic: Boolean(packageName) ? packageName : eventMeta[2],
        type: frequency == "norepeat" ? 2 : 8,
        start_time: moment
          .utc(eventMeta[0])
          .tz(timezone.split(" ")[0])
          .format(),
        duration: moment(eventMeta[1]).diff(eventMeta[0], "minutes"),
        timezone: timezone.split(" ")[0],
        settings: {
          waiting_room: true,
          approval_type: 2,
          mute_upon_entry: true,
        },
      };

      //recurrence setting for series/package events
      if (frequency != "norepeat") {
        let recurrence = null;
        if (frequency == "daily") {
          recurrence = {
            type: 1,
            end_times: event_count,
          };
        } else if (days) {
          let weekly_days = "";
          for (let i = 0; i < 7; i++) {
            if (days[i] && weekly_days != "") weekly_days += ",";
            if (days[i]) {
              const d = (i + 2) % 7;
              weekly_days += d ? d : 7;
            }
          }
          recurrence = {
            type: 2,
            weekly_days,
            end_times: event_count,
          };
        }
        if (recurrence) {
          requestBody.recurrence = recurrence;
        }

        console.log("recurrences :>> ", recurrence);
        if (zoom_account_plan && zoom_account_plan != 1) {
          //zoom_account_plan: 1 => free plan account
          requestBody.settings.registration_type = Boolean(packageName) ? 1 : 2;
          requestBody.settings.registrants_email_notification = true;
          requestBody.settings.approval_type = 1;
          requestBody.settings.allow_multiple_devices = false;
        }
      } else if (zoom_account_plan && zoom_account_plan != 1) {
        requestBody.settings.approval_type = 0;
        requestBody.settings.registrants_email_notification = true;
        requestBody.settings.allow_multiple_devices = false;
      }

      console.log("final requestbody:>> ", requestBody);
      const meetingRet = await axios({
        method: "POST",
        url: `https://api.zoom.us/v2/users/${uid}/meetings`,
        data: requestBody,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      meetingData = meetingRet.data;

      query = `UPDATE mystudio.users SET zoom_refresh_token='${refresh_token}' WHERE id='${userId}'`;

      await client.query(query, []);
    }

    await client.end();
    return meetingData ? { ...meetingData, meeting_id: meetingData.id } : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

module.exports.regCustomerToZoom = async (
  customer_email,
  customer_name,
  inst_username,
  zoom_data,
  package_id
) => {
  try {
    const client = new Pool(db_config);
    let query = [];
    query = `SELECT zoom_refresh_token, zoom_account_plan FROM mystudio.users WHERE username='${inst_username}'`;
    const inst_ret = await client.query(query, []);
    if (inst_ret.rowCount == 0)
      return { error: "Not found User!", reg_data: null };

    const { zoom_refresh_token, zoom_account_plan } = inst_ret.rows[0];
    if (!zoom_refresh_token || zoom_account_plan == 1)
      return {
        error: "Failed due to user has free zoom account type.",
        reg_data: null,
      };

    let payload = qs.stringify({
      grant_type: "refresh_token",
      refresh_token: zoom_refresh_token,
    });

    const ret_tokens = await axios.post(
      "https://zoom.us/oauth/token",
      payload,
      {
        headers: {
          Authorization: `Basic ${base64.encode(
            zoom_setting.clientId + ":" + zoom_setting.clientSecret
          )}`,
        },
      }
    );

    const { access_token, refresh_token } = ret_tokens.data;
    console.log("access_token :>> ", access_token);
    query = `UPDATE mystudio.users SET zoom_refresh_token='${refresh_token}' WHERE username='${inst_username}'`;
    await client.query(query, []);

    const register_url = `https://api.zoom.us/v2/meetings/${
      zoom_data.meeting_id
    }/registrants${
      !package_id && Boolean(zoom_data.occurrence_id)
        ? `?occurrence_ids=${zoom_data.occurrence_id}`
        : ``
    }`;

    console.log("register_url :>> ", register_url);

    const rep_meeting = await axios({
      method: "POST",
      url: register_url,
      data: {
        email: customer_email,
        first_name: customer_name,
      },
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    await client.end();

    return { reg_data: rep_meeting.data, error: null };
  } catch (error) {
    return { error: error.response.data.message, reg_data: null };
  }
};

module.exports.deleteZoomMeeting = async (user_id, zoom_data, packageId) => {
  try {
    const client = new Pool(db_config);
    let query = [];
    query = `SELECT zoom_refresh_token, zoom_account_plan FROM mystudio.users WHERE id='${user_id}'`;
    console.log("query :>> ", query);

    const inst_ret = await client.query(query, []);
    if (inst_ret.rowCount == 0) return false;

    const { zoom_refresh_token, zoom_account_plan } = inst_ret.rows[0];
    if (!zoom_refresh_token || zoom_account_plan == 0) return false;

    let payload = qs.stringify({
      grant_type: "refresh_token",
      refresh_token: zoom_refresh_token,
    });

    const ret_tokens = await axios.post(
      "https://zoom.us/oauth/token",
      payload,
      {
        headers: {
          Authorization: `Basic ${base64.encode(
            zoom_setting.clientId + ":" + zoom_setting.clientSecret
          )}`,
        },
      }
    );

    const { access_token, refresh_token } = ret_tokens.data;
    console.log("access_token :>> ", access_token);
    query = `UPDATE mystudio.users SET zoom_refresh_token='${refresh_token}' WHERE id='${user_id}'`;
    await client.query(query, []);

    const rep_meeting = await axios.delete(
      `https://api.zoom.us/v2/meetings/${zoom_data.meeting_id}?schedule_for_reminder=true&cancel_meeting_reminder=true` +
        (!packageId && Boolean(zoom_data.occurrence_id)
          ? `&occurrence_id=${zoom_data.occurrence_id}`
          : ""),
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    await client.end();
    return !rep_meeting.data ? true : false;
  } catch (error) {
    console.error(error);
    return false;
  }
};

module.exports.cancelRegister = async (
  instUname,
  customer_id,
  zoom_data,
  zoom_registant_id,
  packageId
) => {
  try {
    const client = new Pool(db_config);
    let query = [];
    query = `SELECT zoom_refresh_token, zoom_account_plan FROM mystudio.users WHERE username='${instUname}'`;
    console.log("query :>> ", query);

    const inst_ret = await client.query(query, []);
    if (inst_ret.rowCount == 0) return false;

    const { zoom_refresh_token, zoom_account_plan } = inst_ret.rows[0];
    if (!zoom_refresh_token || zoom_account_plan == 0) return false;

    let payload = qs.stringify({
      grant_type: "refresh_token",
      refresh_token: zoom_refresh_token,
    });

    const ret_tokens = await axios.post(
      "https://zoom.us/oauth/token",
      payload,
      {
        headers: {
          Authorization: `Basic ${base64.encode(
            zoom_setting.clientId + ":" + zoom_setting.clientSecret
          )}`,
        },
      }
    );

    const { access_token, refresh_token } = ret_tokens.data;
    console.log("access_token :>> ", access_token);
    query = `UPDATE mystudio.users SET zoom_refresh_token='${refresh_token}' WHERE username='${instUname}'`;
    await client.query(query, []);

    query = `SELECT email from mystudio.customers WHERE id='${customer_id}'`;
    const custEmailRet = await client.query(query, []);
    console.log(
      `email: ${custEmailRet.rows[0].email}, zoom registant id: ${zoom_registant_id}`
    );

    const cancelRegUrl =
      `https://api.zoom.us/v2/meetings/${zoom_data.meeting_id}/registrants/status` +
      (!packageId && Boolean(zoom_data.occurrence_id)
        ? `?occurrence_id=${zoom_data.occurrence_id}`
        : "");
    console.log("cancelRegUrl :>> ", cancelRegUrl);
    const cancelRet = await axios.put(
      cancelRegUrl,
      {
        action: "deny",
        registrants: [
          { id: zoom_registant_id, email: custEmailRet.rows[0].email },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    await client.end();

    return cancelRet.data;
  } catch (error) {
    console.error(error.data.message);
    return false;
  }
};

module.exports.udpateMeeting = async (
  userId,
  timezone,
  zoom_data,
  topic,
  start_time,
  end_time
) => {
  try {
    const client = new Pool(db_config);
    let query = [];
    query = `SELECT zoom_refresh_token, zoom_account_plan FROM mystudio.users WHERE id='${userId}'`;
    console.log("query :>> ", query);

    const inst_ret = await client.query(query, []);
    if (inst_ret.rowCount == 0) return false;

    const { zoom_refresh_token, zoom_account_plan } = inst_ret.rows[0];
    if (!zoom_refresh_token || zoom_account_plan == 0) return false;

    let payload = qs.stringify({
      grant_type: "refresh_token",
      refresh_token: zoom_refresh_token,
    });

    const ret_tokens = await axios.post(
      "https://zoom.us/oauth/token",
      payload,
      {
        headers: {
          Authorization: `Basic ${base64.encode(
            zoom_setting.clientId + ":" + zoom_setting.clientSecret
          )}`,
        },
      }
    );

    const { access_token, refresh_token } = ret_tokens.data;
    console.log("access_token :>> ", access_token);
    query = `UPDATE mystudio.users SET zoom_refresh_token='${refresh_token}' WHERE id='${userId}'`;
    await client.query(query, []);

    const updateUrl =
      `https://api.zoom.us/v2/meetings/${zoom_data.meeting_id}` +
      (Boolean(zoom_data.occurrence_id)
        ? `?occurrence_id=${zoom_data.occurrence_id}`
        : "");

    console.log("updateUrl :>> ", updateUrl);

    console.log("topic :>> ", topic);
    const updateRet = await axios.patch(
      updateUrl,
      {
        topic,
        start_time: moment.utc(start_time).tz(timezone.split(" ")[0]).format(),
        duration: moment(end_time).diff(start_time, "minutes"),
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    await client.end();

    return updateRet.data;
  } catch (error) {
    console.error(error);
    return false;
  }
};
