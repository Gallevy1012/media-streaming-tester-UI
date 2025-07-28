import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { authService } from './authService';

class TesterHttpClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth header and use proxy for CORS
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Get auth token from localStorage or context
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = authService.getAuthHeader(token);
        }

        // Use proxy to avoid CORS issues: /api/media-streaming-tester/{tester}/{functionality}
        const proxyUrl = `/api/media-streaming-tester${config.url}`;

        console.log('Making MS-Tester request via proxy to:', proxyUrl);
        console.log('Request data:', config.data);

        config.url = proxyUrl;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('MS-Tester response:', response.data);
        return response;
      },
      (error) => {
        console.error('MS-Tester request failed:', error);

        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          throw new Error('Authentication expired. Please login again.');
        }

        // Format error message for user display
        let errorMessage = 'Request failed';
        if (error.response?.data) {
          // If server returns error details, use them
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else {
            errorMessage = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data, null, 2)}`;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Create a new error with formatted message and include response data
        const formattedError = new Error(errorMessage);
        (formattedError as any).response = error.response;
        (formattedError as any).status = error.response?.status;

        throw formattedError;
      }
    );
  }

  async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.delete(url);
    return response.data;
  }
}

export const testerHttpClient = new TesterHttpClient();
