"use strict";

const { Pool } = require("pg");
const moment = require("moment");
const { uploadFile } = require("../utils/uploadFile");

const { db_config } = require("../utils/credentials");

module.exports.create = async (event, context, callback) => {
  const client = new Pool(db_config);
  let query = [];
  const {
    id,
    userId,
    name,
    difficulty,
    category,
    equipment,
    atAGlance,
    images,
  } = JSON.parse(event.body);

  console.log(event.body);

  let _images = `'{}'`;
  if (images !== null && images.length !== 0) {
    _images = "ARRAY[";
    for (let i = 0; i < images.length; i++) {
      _images += `'${images[i]}'`;
      if (i !== images.length - 1) _images += ",";
    }
    _images += "]";
  }

  query = `
    INSERT INTO mystudio.classes (id, user_id, name, difficulty, category, equipment, at_a_glance, images, created_at) VALUES (
      '${id}'
      ,'${userId}'
      ,'${name.replace(/'/g, "''")}'
      ,'${difficulty.replace(/'/g, "''")}'
      ,'${category.replace(/'/g, "''")}'     
      ,'${equipment.replace(/'/g, "''")}'  
      ,'${atAGlance.replace(/'/g, "''")}'
      ,${_images} 
      ,${moment().unix()})
  `;
  console.log(query);
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
      input: event,
    }),
  };

  callback(null, response);
};

module.exports.update = async (event, context, callback) => {
  const client = new Pool(db_config);
  let query = [];
  const {
    update: { name, difficulty, category, equipment, atAGlance, images },
    classId,
  } = JSON.parse(event.body);

  console.log(event.body);

  let _images = "ARRAY[";
  for (let i = 0; i < images.length; i++) {
    _images += `'${images[i]}'`;
    if (i !== images.length - 1) _images += ",";
  }
  _images += "]";

  query = `
    UPDATE mystudio.classes SET 
      name = '${name.replace(/'/g, "''")}'
      ,difficulty = '${difficulty.replace(/'/g, "''")}'
      ,category = '${category.replace(/'/g, "''")}'  
      ,equipment = '${equipment.replace(/'/g, "''")}'
      ,at_a_glance = '${atAGlance.replace(/'/g, "''")}'
      ,images = ${_images}
      ,updated_at = ${moment().unix()}
    WHERE id = '${classId}'
  `;

  console.log(query);
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
      input: event,
    }),
  };

  callback(null, response);
};

module.exports.get_all = async (event, context, callback) => {
  const client = new Pool(db_config);
  let query = [];
  const { id } = JSON.parse(event.body);
  console.log("get all classes, user_id :>> ", id);
  query = `SELECT 
    id
    ,user_id AS "userId"
    ,name
    ,category
    ,difficulty
    ,equipment
    ,images
    ,at_a_glance AS "atAGlance"
    ,created_at AS "createdAt"
    ,updated_at AS "updatedAt"
    ,deleted_at AS "deletedAt"
  FROM mystudio.classes WHERE user_id = '${id}'`;
  const results = await client.query(query, []);
  await client.end();
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify({
      message: results.rows,
      input: event,
    }),
  };

  callback(null, response);
};

module.exports.delete = async (event, context, callback) => {
  const client = new Pool(db_config);
  let query = [];
  const { id } = JSON.parse(event.body);
  console.log(`delete the class id=${id}`);
  try {
    // check if there are open events.
    const utcNow = moment.utc().format("YYYY-MM-DD HH:mm");
    console.log(`current utc time=${utcNow}`);

    query = `SELECT id FROM mystudio.events WHERE from_timestamp < '${utcNow}' AND to_timestamp > '${utcNow}' 
            AND (class_id='${id}' OR package_id IN (SELECT id FROM mystudio.packages WHERE class_id='${id}'))`;

    const activeEventsRet = await client.query(query, []);
    console.log(`active events=${activeEventsRet.rowCount}`);

    if (activeEventsRet.rowCount) {
      await client.end();
      const response = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify({
          message: "This class has active events!",
          status: false,
        }),
      };

      callback(null, response);
    } else {
      query = `
      UPDATE mystudio.classes SET deleted_at = ${moment().unix()} where id = '${id}'
    `;
      console.log(query);
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
          status: true,
        }),
      };

      callback(null, response);
    }
  } catch (err) {
    console.log("Failed to delete class", err);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};

module.exports.uploadClassImage = async (event, context, callback) => {
  try {
    const { file } = JSON.parse(event.body);

    const link = await uploadFile(file);
    console.log("image link from S3", link);

    const response = {
      statusCode: 200,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-credentials": true,
      },
      body: JSON.stringify({
        message: "images is uploaded successfully",
        link,
      }),
    };
    callback(null, response);
  } catch (err) {
    console.log("Failed to uploadClassImage", err);
    const error = {
      statusCode: 400,
      body: JSON.stringify({
        message: new Error(err.message),
      }),
    };
    callback(error);
  }
};
