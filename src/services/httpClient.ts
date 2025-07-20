import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  timestamp: Date;
  success: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  timestamp: Date;
}

class HttpClient {
  private instance: AxiosInstance;

  constructor(baseURL: string = '', timeout: number = 30000) {
    this.instance = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.instance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error)
    );
  }

  private async handleRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await requestFn();

      return {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date(),
        success: true,
      };
    } catch (error) {
      throw {
        message: this.getErrorMessage(error),
        status: this.getErrorStatus(error),
        code: this.getErrorCode(error),
        timestamp: new Date(),
      } as ApiError;
    }
  }

  private getErrorMessage(error: unknown): string {
    // Handle axios errors
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as {
        response?: {
          data?: { message?: string; error?: string };
          status?: number;
        };
        code?: string;
        message?: string;
      };

      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
      
      if (axiosError.response?.data?.error) {
        return axiosError.response.data.error;
      }
      
      if (axiosError.code === 'ECONNABORTED') {
        return 'Request timeout. Please try again.';
      }
      
      if (axiosError.code === 'ECONNREFUSED') {
        return 'Unable to connect to the server. Please check if the MS-tester service is running.';
      }
      
      if (!axiosError.response) {
        return 'Network error. Please check your connection.';
      }
      
      switch (axiosError.response.status) {
        case 400:
          return 'Bad request. Please check your input.';
        case 401:
          return 'Unauthorized. Please log in again.';
        case 403:
          return 'Forbidden. You do not have permission to perform this action.';
        case 404:
          return 'Not found. The requested resource does not exist.';
        case 500:
          return 'Internal server error. Please try again later.';
        case 502:
          return 'Bad gateway. The server is temporarily unavailable.';
        case 503:
          return 'Service unavailable. Please try again later.';
        default:
          return `Request failed with status ${axiosError.response.status}`;
      }
    }
    
    // Handle other errors
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }

  private getErrorStatus(error: unknown): number | undefined {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as { response?: { status?: number } };
      return axiosError.response?.status;
    }
    return undefined;
  }

  private getErrorCode(error: unknown): string | undefined {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const axiosError = error as { code?: string };
      return axiosError.code;
    }
    return undefined;
  }

  // HTTP Methods
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.instance.get<T>(url, config));
  }

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.instance.post<T>(url, data, config));
  }

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.instance.put<T>(url, data, config));
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.instance.patch<T>(url, data, config));
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleRequest(() => this.instance.delete<T>(url, config));
  }

  // Utility methods
  setBaseURL(baseURL: string): void {
    this.instance.defaults.baseURL = baseURL;
  }

  setTimeout(timeout: number): void {
    this.instance.defaults.timeout = timeout;
  }

  setAuthToken(token: string): void {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.instance.defaults.headers.common['Authorization'];
  }
}

// Create and export a default instance
export const httpClient = new HttpClient();

export { HttpClient };
export default HttpClient;

