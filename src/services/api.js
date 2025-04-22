import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add interceptor to add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API calls
export const loginAdmin = (credentials) => 
  axiosInstance.post('/auth/login', credentials);

// Cryptocurrency API calls
export const getAllCryptocurrencies = () => 
  axiosInstance.get('/crypto/');

export const getCryptocurrency = (id) => 
  axiosInstance.get(`/crypto/${id}`);

export const createCryptocurrency = (data) => 
  axiosInstance.post('/crypto/', data);

export const updateCryptocurrency = (id, data) => 
  axiosInstance.put(`/crypto/${id}`, data);

export const deleteCryptocurrency = (id) => 
  axiosInstance.delete(`/crypto/${id}`);

export const importCsv = (formData) => 
  axiosInstance.post('/crypto/import', formData, {
    headers: {
      
    }
  });

export const exportCsv = () => 
  axiosInstance.get('/crypto/export', {
    responseType: 'blob'
  });

export default axiosInstance;