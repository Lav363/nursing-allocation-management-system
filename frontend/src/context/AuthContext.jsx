import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from LocalStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { token: jwtToken, user: userData } = response.data;
      
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(jwtToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Login request failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check credentials.' 
      };
    }
  };

  // Register handler
  const register = async (name, email, password, role, specialization) => {
    try {
      const response = await api.post('/api/auth/register', { 
        name, 
        email, 
        password, 
        role, 
        specialization 
      });
      const { token: jwtToken, user: userData } = response.data;

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed.' 
      };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Update profile handler (specialization for nurse)
  const updateProfile = async (specialization) => {
    try {
      const response = await api.put('/api/auth/profile', { specialization });
      const updatedUser = { ...user, specialization };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, message: response.data.message };
    } catch (error) {
      console.error('Profile update failed:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update profile.' 
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
