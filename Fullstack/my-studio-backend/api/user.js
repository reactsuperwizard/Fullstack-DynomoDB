"use strict";

const { Pool } = require("pg");
const aws = require("aws-sdk");
const qs = require("qs");
const axios = require("axios");
const jwt_decode = require("jwt-decode");

const { uploadFile } = require("../utils/uploadFile");
const { createFirebaseUser, changeUserInfo } = require("../utils/firebaseAPI");

const { db_config, aws_config, zoom_setting } = require("../utils/credentials");

const config = new aws.Config(aws_config);

const {
  sendPayoutRequestEmail,
  sendVerificationCode,
} = require("../utils/mailSender");

aws.config.update(config);

module.exports.uploadAvatar = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    const client = new Pool(db_config);
    const { photoFile, userID } = JSON.parse(event.body);
    console.log("upload Avatar userID :>> ", userID);
    let link = null;
    if (photoFile) {
      link = await uploadFile(photoFile);
    }
    let query = [];
    console.log("link", link);
    if (link === null) {
      query = `
      UPDATE mystudio.users SET
        avatar = NULL
        ,updated_at = now()
      WHERE id = '${userID}'`;
    } else {
      query = `
        UPDATE mystudio.users SET
          avatar = '${link}'
          ,updated_at = now()
        WHERE id = '${userID}'`;
    }
    await client.query(query, []);

    query = `SELECT 
      id 
      ,name
      ,email
      ,phone_number as "phone"
      ,address
      ,google_place_id as "googlePlaceId"
      ,bio
      ,avatar
      ,timezone
      ,balance
      ,currency
      ,public_profile_handle
      ,business_name AS "businessName"
      ,certificates
      ,created_at AS "createdAt"
      ,updated_at AS "updatedAt"
    FROM mystudio.users WHERE id = '${userID}'`;

    const result = await client.query(query, []);

    await client.end();

    await changeUserInfo(
      userID,
      result.rows[0].email,
      result.rows[0].name,
      result.rows[0].avatar,
      false
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

module.exports.set = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const client = new Pool(db_config);
  let query = [];
  const { sub, email, name, picture, timezone, nickname, family_name } =
    JSON.parse(event.body);

  console.log("nickname :>> ", nickname);
  console.log("family_name :>> ", family_name);

  query = `SELECT 1 FROM mystudio.users WHERE id = '${sub}'`;
  const results1 = await client.query(query, []);
  if (results1.rowCount == 0) {
    const basic_name = name.toLowerCase().replace(" ", "-");
    query = `SELECT count(username) FROM mystudio.users WHERE username LIKE '${basic_name}%'`;
    const result_name = await client.query(query, []);
    const username =
      result_name.rows[0].count !== "0"
        ? basic_name + "-" + result_name.rows[0].count
        : basic_name;
    console.log("username :>> ", username);

    const verifyCode = Math.floor(100000 + Math.random() * 900000);
    await sendVerificationCode(name, email, verifyCode);
    console.log("verify code", verifyCode);
    // if (picture.includes("gravatar.com")) {
    //   query = `INSERT INTO mystudio.users (id, name, email, avatar, timezone, created_at, username) VALUES ('${sub}','${name}','${email}', NULL,'${timezone}', NOW(), '${username}')`;
    // } else {
    query = `INSERT INTO mystudio.users (id, name, email, avatar, timezone, created_at, username, email_verified, verify_code) VALUES ('${sub}','${name}','${email}', '${picture}','${timezone}', NOW(),'${username}', ${sub.includes('auth0') ? 0 : 1}, '${verifyCode}')`;
    // }
    //send verification code to the user

    await client.query(query, []);
  }

  query = `SELECT 
    id 
    ,name
    ,username
    ,email
    ,phone_number as "phone"
    ,address
    ,google_place_id as "googlePlaceId"
    ,bio
    ,avatar
    ,timezone
    ,balance
    ,currency
    ,public_profile_handle
    ,business_name AS "businessName"
    ,certificates
    ,zoom_account_plan AS "zoomPlan"
    ,email_subscription AS "emailSubscription"
    ,created_at AS "createdAt"
    ,updated_at AS "updatedAt"
    ,email_verified AS "emailVerified"
   FROM mystudio.users WHERE id = '${sub}'`;
  const results2 = await client.query(query, []);
  await client.end();
  //create firebase user
  await createFirebaseUser({ ...results2.rows[0], avatar: picture });

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

module.exports.update = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const client = new Pool(db_config);
  let query = [];
  try {
    const {
      id,
      name,
      phone,
      bio,
      businessName,
      certificates,
      address,
      googlePlaceId,
    } = JSON.parse(event.body);

    query = `SELECT name, username FROM mystudio.users WHERE id='${id}'`;

    const result_check = await client.query(query, []);
    let username = result_check.rows[0].username;
    const basic_name = name.toLowerCase().replace(" ", "-");
    if (result_check.rows[0].username != basic_name) {
      query = `SELECT count(username) FROM mystudio.users WHERE username LIKE '${basic_name}%'`;
      const result_name = await client.query(query, []);
      console.log("name", name);
      username =
        result_name.rows[0].count !== "0"
          ? basic_name + "-" + result_name.rows[0].count
          : basic_name;
      console.log("updated username :>> ", username);
    }
    query = `
      UPDATE mystudio.users SET 
        name = '${name ? name.replace(/'/g, "''") : ""}'
        ,phone_number = '${phone}'
        ,bio = '${bio ? bio.replace(/'/g, "''") : ""}'    
        ,business_name = '${businessName ? businessName.replace(/'/g, "''") : ""
      }'
        ,certificates = '${certificates ? certificates.replace(/'/g, "''") : ""
      }'
        ,address = '${address ? address.replace(/'/g, "''") : ""}'
        ,google_place_id = '${googlePlaceId ? googlePlaceId.replace(/'/g, "''") : ""
      }'
        ,updated_at = now()
        ,username='${username}'
      WHERE id = '${id}'
    `;
    const results = await client.query(query, []);

    if (result_check.rows[0].username != basic_name) {
      query = `SELECT email, avatar FROM mystudio.users WHERE id='${id}'`;
      const userInfo = await client.query(query, []);
      await changeUserInfo(
        id,
        userInfo.rows[0].email,
        name,
        userInfo.rows[0].avatar,
        false
      );
    }

    await client.end();
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        body: {
          name,
          phone,
          bio,
          businessName,
          certificates,
          address,
          googlePlaceId,
          username,
        },
        input: event,
      }),
    };

    callback(null, response);
  } catch (err) {
    console.log("Failed to update the user settting", err);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.updateUserSettings = async (event, context, callback) => {
  const client = new Pool(db_config);
  let query = [];
  const { id, currency, timezone, subscription } = JSON.parse(event.body);
  query = `
    UPDATE mystudio.users SET 
      currency = '${currency.replace(/'/g, "''")}'
      ,timezone = '${timezone}'
      ,email_subscription = ${subscription ? 1 : 0}
      ,updated_at = now()
    WHERE id = '${id}'
  `;
  try {
    const results = await client.query(query, []);
    await client.end();
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: results,
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

module.exports.setZoomAccount = async (event, context, callback) => {
  try {
    const client = new Pool(db_config);

    const { zoomAuthCode, userId, redirectURI } = JSON.parse(event.body);

    console.log("zoom account auth data :>> ", event.body);

    const payload = qs.stringify({
      client_id: zoom_setting.clientId,
      client_secret: zoom_setting.clientSecret,
      code: zoomAuthCode,
      redirect_uri: redirectURI,
      grant_type: "authorization_code",
    });

    console.log("zoom_setting :>> ", payload);
    const result = await axios.post("https://zoom.us/oauth/token", payload, {
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    const { access_token, refresh_token } = result.data;
    console.log("access token :>> ", access_token);
    const { aid, uid } = jwt_decode(access_token);

    console.log("aid :>> ", aid);

    let zoom_account_plan = 1;
    try {
      const planRet = await axios({
        method: "GET",
        url: `https://api.zoom.us/v2/users/${uid}`,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      console.log("zoom account plan :>> ", planRet.data);
      zoom_account_plan = planRet.data ? planRet.data.type : 1;
    } catch (error) {
      console.log("get plan error :>> ", error.response.data);
    }

    const query = `
    UPDATE mystudio.users SET 
      zoom_account_id = '${aid}',
      zoom_user_id = '${uid}',
      zoom_refresh_token = '${refresh_token}',
      zoom_account_plan = ${zoom_account_plan}
    WHERE id = '${userId}'
  `;

    console.log("update query :>> ", query);
    await client.query(query, []);

    await client.end();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        body: {
          zoomAccountPlan: zoom_account_plan,
        },
        status: true,
      }),
    };
    callback(null, response);
  } catch (err) {
    console.error("error in axios zoom token api", err.message);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.discntZoomAccount = async (event, context, callback) => {
  try {
    const client = new Pool(db_config);

    const { userId } = JSON.parse(event.body);

    const query = `
    UPDATE mystudio.users SET 
      zoom_account_id = NULL,
      zoom_user_id = NULL,
      zoom_refresh_token = NULL,
      zoom_account_plan = NULL
    WHERE id = '${userId}'
  `;

    console.log("delete zoom account query :>> ", query);
    await client.query(query, []);

    await client.end();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Zoom account is disconnected!",
        status: true,
      }),
    };
    callback(null, response);
  } catch (err) {
    console.error("error in disconnecting zoom account", err.message);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.deauthrizeZoomAccount = async (event, context, callback) => {
  try {
    const client = new Pool(db_config);

    const {
      payload: { user_id },
    } = JSON.parse(event.body);

    const query = `
    UPDATE mystudio.users SET 
      zoom_account_id = NULL,
      zoom_user_id = NULL,
      zoom_refresh_token = NULL,
      zoom_account_plan = NULL
    WHERE zoom_user_id = '${user_id}'
  `;

    console.log("delete zoom account query :>> ", query);
    await client.query(query, []);

    await client.end();

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Zoom account is deauthrized by the zoom!",
        status: true,
      }),
    };
    callback(null, response);
  } catch (err) {
    console.error("error in deauthrizing zoom account", err.message);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.sendPayoutRequest = async (event, context, callback) => {
  const { name, email, amount, message } = JSON.parse(event.body);
  try {
    await sendPayoutRequestEmail(name, email, amount, message);
    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Sent payout request successfully.",
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

module.exports.getStudio = async (event, context, callback) => {
  try {
    const client = new Pool(db_config);
    const query = `SELECT 
    id 
    ,name
    ,bio
    ,avatar
    ,username
    ,business_name AS "businessName"
    ,certificates
    ,created_at AS "createdAt"
    ,updated_at AS "updatedAt"
  FROM mystudio.users`;
    const studioRet = await client.query(query);

    const response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        body: studioRet.rows,
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

module.exports.verifyAccount = async (event, context, callback) => {
  const { userId, code } = JSON.parse(event.body);
  try {
    console.log(`userId:${userId}, code: ${code}`);
    const client = new Pool(db_config);
    const code_ret = await client.query(
      `SELECT verify_code FROM mystudio.users WHERE id='${userId}'`
    );
    const verified = code_ret.rowCount && code_ret.rows[0].verify_code == code;
    if (verified) {
      await client.query(
        `UPDATE mystudio.users set email_verified = 1 WHERE id='${userId}'`
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
