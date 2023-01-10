import React, {
  createContext,
  useEffect,
  useReducer,
  useState,
  useCallback
} from 'react';
import { Auth0Client } from '@auth0/auth0-spa-js';
import SplashScreen from 'src/components/SplashScreen';
import { auth0Config } from 'src/config';
import axios from 'src/utils/axiosApiGateway';
import firebase from 'src/lib/firebase';

import { getCurrentTimeZone } from 'src/utils/timezones';

let auth0Client = null;

const initialAuthState = {
  isAuthenticated: false,
  isInitialised: false,
  user: null
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'INITIALISE': {
      const { isAuthenticated, user } = action.payload;

      return {
        ...state,
        isAuthenticated,
        isInitialised: true,
        user
      };
    }
    case 'LOGIN': {
      const { user } = action.payload;

      return {
        ...state,
        isAuthenticated: true,
        user
      };
    }
    case 'UPDATE': {
      const { user } = action.payload;

      return {
        ...state,
        user
      };
    }
    case 'LOGOUT': {
      return {
        ...state,
        isAuthenticated: false,
        user: null
      };
    }
    case 'UPDATE_USER_AVATAR': {
      const { user } = action.payload;
      return {
        ...state,
        user: {
          ...state.user,
          ...user
        }
      };
    }
    default: {
      return { ...state };
    }
  }
};

const AuthContext = createContext({
  ...initialAuthState,
  method: 'Auth0',
  loginWithPopup: () => Promise.resolve(),
  logout: () => {}
});

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialAuthState);

  const loginFirebase = async email => {
    const fbPassword = email + process.env.REACT_APP_FIREBASE_PROJECT_ID;
    const fb_user = await firebase
      .auth()
      .signInWithEmailAndPassword(email, fbPassword);
    return fb_user.user.uid;
  };

  const loginWithPopup = async options => {
    await auth0Client.loginWithPopup(options);

    const isAuthenticated = await auth0Client.isAuthenticated();

    if (isAuthenticated) {
      const user = await auth0Client.getUser();
      user.timezone = getCurrentTimeZone();
      // Here you should extract the complete user profile to make it available in your entire app.
      // The auth state only provides basic information.
      let user_profile = '';
      try {
        console.log('login user: from Auth0', user);
        const response = await axios.post('/set_user', user);
        user_profile = response.data.message[0];

        user_profile.fuid = await loginFirebase(user_profile.email);
        console.log('fuid :>> ', user_profile.fuid);
      } catch (err) {
        console.error(err);
      }

      dispatch({
        type: 'LOGIN',
        payload: {
          user: {
            id: user.sub,
            fuid: user_profile.fuid,
            avatar: user_profile.avatar,
            email: user_profile.email,
            name: user_profile.name,
            username: user_profile.username,
            phone: user_profile.phone,
            bio: user_profile.bio,
            businessName: user_profile.businessName,
            certificates: user_profile.certificates,
            balance: user_profile.balance,
            currency: user_profile.currency,
            public_profile_handle: user_profile.public_profile_handle,
            zoomPlan: user_profile.zoomPlan,
            googlePlaceId: user_profile.googlePlaceId,
            address: user_profile.address,
            timezone: user_profile.timezone,
            createdAt: user_profile.createdAt,
            emailSubscription: user_profile.emailSubscription,
            updatedAt: user_profile.updatedAt,
            emailVerified: user_profile.emailVerified
          }
        }
      });
    }
  };

  const logout = () => {
    auth0Client.logout();

    dispatch({
      type: 'LOGOUT'
    });
  };

  const updateUser = async user_profile => {
    console.log(user_profile);

    const isAuthenticated = await auth0Client.isAuthenticated();

    if (isAuthenticated) {
      try {
        const response = await axios.post('/update_user', {
          ...user_profile
        });

        dispatch({
          type: 'LOGIN',
          payload: {
            user: {
              ...state.user,
              ...response.data.body
            }
          }
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const uploadProfilePhoto = async (userID, photoFile) => {
    let user_profile = null;
    try {
      const response = await axios.post('/uploadAvatar', {
        userID,
        photoFile
      });
      user_profile = response.data.message[0];
    } catch (err) {
      console.info('err', err);
    }

    if (user_profile) {
      dispatch({
        type: 'UPDATE_USER_AVATAR',
        payload: {
          user: {
            ...state.user,
            avatar: user_profile?.avatar
          }
        }
      });
    }
    return user_profile;
  };

  const removeProfilePhoto = async userID => {
    let user_profile = '';
    try {
      const response = await axios.post('/uploadAvatar', {
        userID,
        photoFile: null
      });
      user_profile = response.data.message[0];
    } catch (err) {
      console.info('err', err);
    }
    console.log('remove photo :>> ', user_profile.avatar);
    dispatch({
      type: 'UPDATE_USER_AVATAR',
      payload: {
        user: {
          ...state.user,
          avatar: user_profile.avatar
        }
      }
    });
  };

  const updateUserSetting = async (currency, timezone, subscription) => {
    try {
      await axios.post('/update_user_setting', {
        id: state.user.id,
        currency,
        timezone,
        subscription
      });
      dispatch({
        type: 'LOGIN',
        payload: {
          user: {
            ...state.user,
            currency,
            timezone
          }
        }
      });
    } catch (e) {
      console.error('e updateUserSetting', e);
    }
  };

  const zoomAccountSetting = async (zoomAuthCode, redirectURI) => {
    try {
      const result = await axios.post('/set_zoom_account', {
        zoomAuthCode,
        userId: state.user.id,
        redirectURI
      });
      console.log('zoom api called :>> ', result.data.body);
      dispatch({
        type: 'LOGIN',
        payload: {
          user: {
            ...state.user,
            zoomPlan: result.data.body ? result.data.body.zoomAccountPlan : null
          }
        }
      });
    } catch (e) {
      console.error('e zoom account Setting', e);
    }
  };

  const verifyAccount = async code => {
    try {
      const result = await axios.post('/verify_account', {
        userId: state.user.id,
        code
      });
      dispatch({
        type: 'UPDATE',
        payload: {
          user: {
            ...state.user,
            emailVerified: result.data.status
          }
        }
      });
      return result.data.status;
    } catch (e) {
      console.error('e zoom account Setting', e);
    }
  };

  const discntZoomAcnt = async userId => {
    try {
      await axios.post('/discnt_zoom_acnt', {
        userId
      });

      dispatch({
        type: 'LOGIN',
        payload: {
          user: {
            ...state.user,
            zoomPlan: null
          }
        }
      });
    } catch (e) {
      console.error('e zoom account Setting', e);
    }
  };

  useEffect(() => {
    const initialise = async () => {
      try {
        auth0Client = new Auth0Client({
          redirect_uri: window.location.origin,
          ...auth0Config
        });

        await auth0Client.checkSession();

        const isAuthenticated = await auth0Client.isAuthenticated();

        console.log(`reloading..., authed=${isAuthenticated}`);
        if (isAuthenticated) {
          const user = await auth0Client.getUser();

          // Here you should extract the complete user profile to make it available in your entire app.
          // The auth state only provides basic information.

          let user_profile = '';
          try {
            const response = await axios.post('/set_user', user);
            console.info('user', user);
            user_profile = response.data.message[0];

            console.log('user_profile :>> ', user_profile);

            user_profile.fuid = await loginFirebase(user_profile.email);
            console.log('fuid :>> ', user_profile.fuid);
          } catch (err) {
            console.error(err);
          }

          dispatch({
            type: 'INITIALISE',
            payload: {
              isAuthenticated,
              user: {
                id: user.sub,
                fuid: user_profile.fuid,
                avatar: user_profile.avatar,
                email: user_profile.email,
                name: user_profile.name,
                username: user_profile.username,
                phone: user_profile.phone,
                bio: user_profile.bio,
                businessName: user_profile.businessName,
                certificates: user_profile.certificates,
                balance: user_profile.balance,
                currency: user_profile.currency,
                public_profile_handle: user_profile.public_profile_handle,
                googlePlaceId: user_profile.googlePlaceId,
                address: user_profile.address,
                zoomPlan: user_profile.zoomPlan,
                timezone: user_profile.timezone,
                emailSubscription: user_profile.emailSubscription,
                createdAt: user_profile.createdAt,
                updatedAt: user_profile.updatedAt,
                emailVerified: user_profile.emailVerified
              }
            }
          });
        } else {
          dispatch({
            type: 'INITIALISE',
            payload: {
              isAuthenticated,
              user: null
            }
          });
        }
      } catch (err) {
        console.error(err);
        dispatch({
          type: 'INITIALISE',
          payload: {
            isAuthenticated: false,
            user: null
          }
        });
      }
    };

    initialise();
  }, []);

  if (!state.isInitialised) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        method: 'Auth0',
        loginWithPopup,
        logout,
        updateUser,
        uploadProfilePhoto,
        removeProfilePhoto,
        updateUserSetting,
        zoomAccountSetting,
        discntZoomAcnt,
        verifyAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
