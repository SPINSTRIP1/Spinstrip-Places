/**
 * API Configuration with Redux Auth Integration
 *
 * This module sets up axios with automatic token injection and refresh handling
 * using Redux store directly instead of hooks.
 */

import axios, { AxiosInstance, AxiosResponse } from "axios";
import { SERVER_URL } from "@/constants";

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: SERVER_URL,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    return Promise.reject(error);
  },
);

// Export the configured axios instance
export default api;
