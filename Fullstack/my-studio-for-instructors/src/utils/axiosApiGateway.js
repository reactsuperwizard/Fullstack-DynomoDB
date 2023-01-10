import axios from 'axios';

const axiosInstance = axios.create({
  baseURL:
    process.env.REACT_APP_BUILD_ENV == 'local'
      ? process.env.REACT_APP_API_EP_LOCAL
      : process.env.REACT_APP_API_EP_LIVE
});

export default axiosInstance;
