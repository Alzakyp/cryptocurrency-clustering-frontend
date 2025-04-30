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

// New method to get cryptocurrencies by dataset ID
export const getCryptocurrenciesByDataset = (datasetId) => 
  axiosInstance.get(`/crypto/?dataset_id=${datasetId}`);

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
      'Content-Type': 'multipart/form-data'
    }
  });

export const exportCsv = () => 
  axiosInstance.get('/crypto/export', {
    responseType: 'blob'
  });

// Dataset API calls
export const getAllDatasets = () =>
  axiosInstance.get('/dataset/');

export const getDataset = (id) =>
  axiosInstance.get(`/dataset/${id}`);

export const uploadDataset = (formData) =>
  axiosInstance.post('/dataset/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

export const updateDataset = (id, data) =>
  axiosInstance.put(`/dataset/${id}`, data);

export const deleteDataset = (id) =>
  axiosInstance.delete(`/dataset/${id}`);

export const importFromDataset = (id) =>
  axiosInstance.post(`/dataset/${id}/import`);

export const getDatasetContent = (id) =>
  axiosInstance.get(`/dataset/${id}/content`, {
    responseType: 'blob'
  });

export const previewDataset = (id) =>
  axiosInstance.get(`/dataset/${id}/preview`);

export default axiosInstance;