const moment = require("moment");
const { Pool } = require("pg");
const { db_config } = require("./credentials");
var admin = require("firebase-admin");
const { firebase_confg } = require("./credentials");
const { getRoomIdByCustomerId, getRoomIdByUserId } = require("./query");

admin.initializeApp({
  credential: admin.credential.cert(firebase_confg),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
var rtDB = admin.database();

module.exports.createChatRoom = async ({
  room_id,
  room_title,
  is_package,
  user_id,
  user_avatar,
  username,
  user_email,
}) => {
  console.log("Creating chatroom...");
  try {
    const fb_user = await admin.auth().getUserByEmail(user_email);

    console.log(`fbuser: ${fb_user.uid}`);

    return await rtDB.ref(`/chatroom/${room_id}`).set({
      messages: [
        {
          uid: user_id,
          fuid: fb_user.uid,
          message: `Welcome to ${room_title}!`,
          timestamp: moment().unix(),
        },
      ],
      members: {
        [fb_user.uid]: {
          name: username,
          photo_url: user_avatar,
          uid: user_id,
          role: "instructor",
        },
      },
      meta: {
        room_title,
        is_package,
      },
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.createFirebaseUser = async ({ id, avatar, name, email }) => {
  console.log("Creating firebaseuser...", id, avatar, name, email);
  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log("firebase user is already existed:", user.uid);
    return user.uid;
  } catch (e) {
    console.log("firebase user not found code", e.code);
    if (e.code === "auth/user-not-found") {
      const password = email + process.env.FIREBASE_PROJECT_ID;
      console.log("pwd :>> ", password);
      const created_user = await admin.auth().createUser({
        email,
        emailVerified: true,
        password,
        displayName: name,
        photoURL: avatar,
        disabled: false,
      });
      console.log("firebase user created :>> ", created_user.uid);
      //add the first notification data

      await rtDB.ref(`/notification/${created_user.uid}`).set([
        {
          timestamp: moment().unix(),
          title: "Account created",
          body:
            "Your passtree.net account has been successfully created. Please verify your email address.",
          read: false,
        },
      ]);

      return created_user.uid;
    }
  }
};

module.exports.addChatroomMember = async (
  room_id,
  customerId,
  email,
  name,
  user_avatar
) => {
  try {
    const fb_user = await admin.auth().getUserByEmail(email);

    return await rtDB.ref(`/chatroom/${room_id}/members/${fb_user.uid}`).set({
      name,
      photo_url: user_avatar,
      uid: customerId,
      role: "customer",
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.addNewNotification = async (email, title, body, meta = null) => {
  try {
    const fb_user = await admin.auth().getUserByEmail(email);
    console.log("instructor fuid :>> ", fb_user.uid);
    const timestamp = moment().unix();

    const newMsgRef = await rtDB.ref(`/notification/${fb_user.uid}`).push();

    await newMsgRef.set({
      title,
      body,
      read: false,
      timestamp,
      meta,
    });
  } catch (error) {
    console.error(error);
  }
};

module.exports.changeUserInfo = async (
  userId,
  email,
  name,
  user_avatar,
  isCustomer
) => {
  const client = new Pool(db_config);
  try {
    const fb_user = await admin.auth().getUserByEmail(email);
    let result = [];
    if (isCustomer) {
      result = await client.query(getRoomIdByCustomerId(userId), []);
    } else {
      result = await client.query(getRoomIdByUserId(userId), []);
    }

    await client.end();

    for (let d of result.rows) {
      await rtDB.ref(`/chatroom/${d.roomId}/members/${fb_user.uid}`).set({
        name,
        photo_url: user_avatar,
        uid: userId,
        role: isCustomer ? "customer" : "instructor",
      });
    }
  } catch (error) {
    console.error(error);
  }
};

function deleteUser(uid) {
  admin
    .auth()
    .deleteUser(uid)
    .then(function () {
      console.log("Successfully deleted user", uid);
    })
    .catch(function (error) {
      console.log("Error deleting user:", error);
    });
}

function getAllUsers(nextPageToken) {
  admin
    .auth()
    .listUsers(100, nextPageToken)
    .then(function (listUsersResult) {
      listUsersResult.users.forEach(function (userRecord) {
        uid = userRecord.toJSON().uid;
        deleteUser(uid);
      });
      if (listUsersResult.pageToken) {
        getAllUsers(listUsersResult.pageToken);
      }
    })
    .catch(function (error) {
      console.log("Error listing users:", error);
    });
}

module.exports.deleteUsers = async () => {
  getAllUsers();
};
