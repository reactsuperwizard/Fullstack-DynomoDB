module.exports.getRoomIdByCustomerId = (customerId) => `select DISTINCT (CASE
    WHEN ee.package_id IS NULL THEN ee.id ELSE pp.id  END) AS "roomId" from mystudio.events ee left join mystudio.packages pp on pp.id=ee.package_id
    where ee.id in (select event_id from mystudio.passes where customer_id='${customerId}')`;

module.exports.getRoomIdByUserId = (
  userId
) => `select DISTINCT (CASE WHEN ee.package_id IS NULL THEN ee.id ELSE pp.id END) AS "roomId" from mystudio.events ee left join mystudio.packages pp on pp.id=ee.package_id
  where (case when (ee.class_id IS NULL) then pp.class_id else ee.class_id END) in (select id from mystudio.classes where user_id='${userId}')`;

module.exports.getAllEventsQuery = (
  fromTime,
  userId,
  orderby,
  limit
) => `SELECT 
  e.id AS "eventId",
  e.event_name AS "name",
  e.from_timestamp AS "from",
  e.to_timestamp AS "to",
  e.notes AS "notes",
  e.location AS "location",
  e.zoom_link AS "zoomLink",
  e.zoom_data AS "zoomData",
  e.other AS "other",
  (CASE
    WHEN e.class_id IS NULL THEN pp.price
    ELSE e.price
  END) AS "price",
  (CASE
    WHEN e.class_id IS NULL THEN pp.available_spaces
    ELSE e.available_spaces
  END) AS "availableSpaces",
  (CASE
    WHEN e.class_id IS NULL THEN pp.class_id
    ELSE e.class_id
  END) AS "classId",
  (CASE
    WHEN e.class_id IS NULL THEN pp.sold_tickets
    ELSE e.sold_tickets
  END) AS "soldTickets",
  (CASE
    WHEN e.class_id IS NULL THEN pp.fees
    ELSE e.fees
  END) AS "fees",
  e.currency AS "currency",
  pp.id AS "packageId",
  pp.name AS "packageName",
  e.created_at AS "createdAt",
  e.updated_at AS "updatedAt",
  e.deleted_at AS "deletedAt",
  e.event_series_id AS "seriesId",  
  e.is_package AS "isPackage"
  FROM mystudio.events e LEFT JOIN mystudio.packages pp ON e.package_id=pp.id INNER JOIN mystudio.classes cc ON cc.id=(case when (e.class_id IS NULL) then pp.class_id else e.class_id END)
  ${
    fromTime
      ? `WHERE e.to_timestamp >= '${fromTime}' AND cc.user_id = '${userId}' ORDER BY e.${orderby}`
      : `WHERE cc.user_id = '${userId}' ORDER BY e.${orderby}`
  } ${limit ? `LIMIT ${limit}` : ``}`;

module.exports.getEventByIdQuery = (eventId) => `SELECT 
  e.event_name AS "name",
  e.from_timestamp AS "from",
  e.to_timestamp AS "to",
  e.notes AS "notes",  
  (CASE
    WHEN e.class_id IS NULL THEN pp.price
    ELSE e.price
  END) AS "price",
  (CASE
    WHEN e.class_id IS NULL THEN pp.sold_tickets
    ELSE e.sold_tickets
  END) AS "soldTickets",
  (CASE
    WHEN e.class_id IS NULL THEN pp.available_spaces
    ELSE e.available_spaces
  END) AS "available_spaces",
  (CASE
    WHEN e.class_id IS NULL THEN pp.class_id
    ELSE e.class_id
  END) AS "classId",
  e.currency AS "currency", 
  e.zoom_data AS "zoomData", e.location AS "location", e.other AS "other",
  pp.id AS "packageId",
  pp.name AS "packageName",
  e.created_at AS "created_at",
  e.updated_at AS "updated_at",
  e.deleted_at AS "deleted_at",
  e.event_series_id AS "seriesId",
  e.is_package AS "isPackage",
  cc.name AS "cName",
  cc.category AS "category",
  cc.at_a_glance AS "at_a_glance",
  cc.difficulty AS "difficulty",
  cc.images AS "images",
  cc.equipment AS "equipment",
  uu.name AS "uName",
  uu.avatar AS "avatar",
  uu.email AS "email",
  uu.certificates AS "certificates",
  uu.bio AS "bio",
  uu.username AS "userHandler",
  ps.transaction_date AS "transDate",
  ps.stripe_transaction_id AS "transId"
  FROM mystudio.events e LEFT JOIN mystudio.packages pp ON e.package_id=pp.id 
  INNER JOIN mystudio.classes cc ON cc.id=(case when (e.class_id IS NULL) then pp.class_id else e.class_id END)
  INNER JOIN mystudio.users uu ON cc.user_id=uu.id 
  LEFT JOIN mystudio.passes ps ON ps.event_id=e.id
  WHERE e.id = '${eventId}' OR e.package_id='${eventId}'`;

module.exports.getSeriesByIdQuery = (seriesId) => `SELECT 
  e.event_name AS "eventName",
  e.id AS "eventId",
  e.from_timestamp AS "from",
  e.to_timestamp AS "to",
  e.notes AS "notes",
  e.location AS "location",
  e.zoom_link AS "zoomLink",
  e.zoom_data AS "zoomData",
  e.other AS "other",
  e.currency AS "currency",
  e.sold_tickets AS "soldTickets",
  e.deleted_at AS "deletedAt",
  p.price AS "price",
  p.available_spaces AS "availableSpaces",
  p.class_id AS "classId",
  p.id AS "packageId",
  p.name AS "packageName"
  FROM mystudio.events e INNER JOIN mystudio.packages p ON e.package_id=p.id
  WHERE e.event_series_id='${seriesId}'
  ORDER BY e.from_timestamp
  `;

module.exports.getAllEventsCustomerQuery = (userId, fromTime) => `SELECT 
  ee.id AS "eventId", 
  pp.id AS "packageId", 
  (CASE
    WHEN ee.class_id IS NULL THEN pp.class_id
    ELSE ee.class_id
  END) AS "classId",
  (CASE
    WHEN ee.class_id IS NULL THEN pp.price
    ELSE ee.price
  END) AS "price",
  (CASE
    WHEN ee.class_id IS NULL THEN pp.available_spaces
    ELSE ee.available_spaces
  END) AS "availableSpaces",      
  ee.from_timestamp AS "from",
  ee.to_timestamp AS "to",
  ee.event_series_id AS "seriesId",
  ee.event_name AS "eventName",
  ee.deleted_at AS "deletedAt",
  ee.location AS "location",
  ee.zoom_data AS "zoomData",
  ee.other AS "other",
  ee.zoom_link AS "zoomLink",
  ee.currency AS "currency",
  ee.is_package AS "isPackage",
  pp.name AS "packageName",
  cc.name AS "className",
  uu.name AS "instructorName",
  uu.id AS "userId",
  uu.timezone AS "userTimezone",
  ps.transaction_status AS "transStatus"
    FROM mystudio.events ee LEFT JOIN mystudio.packages pp ON ee.package_id=pp.id 
  INNER JOIN mystudio.classes cc ON cc.id=(case when (ee.class_id IS NULL) then pp.class_id else ee.class_id END)
  INNER JOIN mystudio.users uu ON uu.id=cc.user_id
  INNER JOIN mystudio.passes ps ON ps.event_id=ee.id
  ${
    fromTime
      ? `WHERE ee.to_timestamp >= '${fromTime}' AND ps.customer_id='${userId}' AND ps.transaction_status='succeeded' ORDER BY ee.from_timestamp`
      : `WHERE ps.customer_id='${userId}' AND ps.transaction_status='succeeded' ORDER BY ee.from_timestamp`
  }
  `;

module.exports.getPackageEventsByIdQuery = (id) => `SELECT event_name,
    name,
    from_timestamp,
    to_timestamp,
    location,
    zoom_link,
    pp.currency AS "currency",
    pp.available_spaces AS "available_spaces",
    pp.price AS "price" 
    FROM mystudio.events e inner join mystudio.packages pp ON e.package_id=pp.id WHERE e.package_id='${id}' ORDER BY from_timestamp`;

module.exports.getLifeIncomeEvent = (id, currency) =>
  `SELECT SUM(e.price * e.sold_tickets * (1 - e.fees)) AS "lifeIncome"
      FROM mystudio.events e INNER JOIN mystudio.classes cc ON cc.id=e.class_id
      WHERE cc.user_id = '${id}' AND e.currency = '${currency}' AND e.deleted_at IS NULL`;

module.exports.getLifeIncomePackage = (id, currency) =>
  `SELECT SUM(pp.price * pp.sold_tickets * (1 - pp.fees)) AS "lifeIncome"
    FROM mystudio.packages pp INNER JOIN mystudio.classes cc ON cc.id=pp.class_id
    WHERE cc.user_id = '${id}' AND pp.currency = '${currency}' AND pp.deleted_at IS NULL`;

module.exports.getThisMonthIncomeEvent = (
  id,
  currency,
  firstday,
  lastday
) => `SELECT SUM(e.price * e.sold_tickets * (1 - e.fees)) AS "thisIncome",
        SUM(e.sold_tickets) AS "thisPasses"
        FROM mystudio.events e INNER JOIN mystudio.classes cc ON cc.id=e.class_id
        WHERE cc.user_id = '${id}' AND e.currency = '${currency}' AND e.deleted_at IS NULL AND
              e.id in (SELECT event_id FROM mystudio.passes WHERE  transaction_date > ${firstday} AND transaction_date < ${lastday} AND transaction_status='succeeded')`;

module.exports.getThisMonthIncomePackage = (
  id,
  currency,
  firstday,
  lastday
) => `SELECT SUM(pp.price * pp.sold_tickets * (1 - pp.fees)) AS "thisIncome", SUM(pp.sold_tickets) AS "thisPasses"
      FROM mystudio.packages pp INNER JOIN mystudio.classes cc ON cc.id=pp.class_id WHERE cc.user_id = '${id}' AND pp.currency = '${currency}' AND pp.deleted_at IS NULL
      AND pp.id in (select package_id from mystudio.events where id in (select event_id from mystudio.passes where transaction_date > ${firstday} AND transaction_date < ${lastday} AND transaction_status='succeeded' ))`;
