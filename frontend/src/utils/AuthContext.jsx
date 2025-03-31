import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from './axiosInstance';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await axiosInstance.get('v1/user/me/');
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error("Error loading user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem('access')) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axiosInstance.post('login/', { email, password });
      if (res.status === 200) {
        console.log("Login response:", res.data);
        //save tokens
        localStorage.setItem('access', JSON.stringify(res.data.access));
        localStorage.setItem('refresh', JSON.stringify(res.data.refresh));

        try {
           //Fetch user profile with token now valid
          const userRes = await axiosInstance.get('v1/user/me/');
          const userData = userRes.data;
          console.log("userData:",userData)

          //Store in session
          sessionStorage.setItem('user', JSON.stringify(userData));

          toast.success('Login successful');
          navigate('/')
          window.location.reload();
        }catch (userErr){
          console.error('Error fetching user profile:', userErr);
          toast.error('User data fetch failed');
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error('Login failed. Please check your credentials.');
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh');
      await axiosInstance.post('v1/logout/', { refresh });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      sessionStorage.removeItem('user');
      setUser(null);
      navigate('/login');
      toast.warn('Logged out successfully');
    }
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};