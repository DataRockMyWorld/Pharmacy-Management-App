// axiosInstance.js

import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';

const baseUrl = 'http://localhost:8000/api/';

// Axios instance
const axiosInstance = axios.create({
  baseURL: baseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach tokens dynamically
axiosInstance.interceptors.request.use(async (req) => {
  // Dynamically fetch tokens from localStorage
  const access = localStorage.getItem('access') ? JSON.parse(localStorage.getItem('access')) : null;
  const refresh = localStorage.getItem('refresh') ? JSON.parse(localStorage.getItem('refresh')) : null;

  if (access) {
    const decoded = jwtDecode(access);
    const isExpired = dayjs.unix(decoded.exp).diff(dayjs()) < 1;

    if (!isExpired) {
      req.headers.Authorization = `Bearer ${access}`;
    } else if (refresh) {
      try {
        const response = await axios.post(`${baseUrl}token/refresh/`, { refresh });
        const new_access = response.data.access;

        // Store new access token
        localStorage.setItem('access', JSON.stringify(new_access));

        // Update request header
        req.headers.Authorization = `Bearer ${new_access}`;
      } catch (err) {
        console.error('Refresh failed:', err);
        await handleLogout();
      }
    }
  }

  return req;
}, (error) => Promise.reject(error));

// Handle logout cleanup
const handleLogout = async () => {
  const refresh = localStorage.getItem('refresh') ? JSON.parse(localStorage.getItem('refresh')) : null;
  try {
    await axios.post(`${baseUrl}v1/logout/`, { refresh });
  } catch (err) {
    console.warn('Logout error:', err);
  }
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  sessionStorage.removeItem('user');
};

export default axiosInstance;
