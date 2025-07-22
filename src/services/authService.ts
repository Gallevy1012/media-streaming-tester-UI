import axios from 'axios';
import type { LoginCredentials, AuthResponse } from '../types';

class AuthService {
  private getEnvironmentBaseUrl(environment: string): string {
    const environmentMap: Record<string, string> = {
      'dev': 'na1.dev.nice-incontact.com',
      'test': 'na1.test.nice-incontact.com',
      'perf-wcx': 'na1.perf-wcx.nice-incontact.com',
    };

    return `https://${environmentMap[environment] || environmentMap['Dev']}`;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const requestBody = {
        email: credentials.email,
        password: credentials.password,
      };

      // Use proxy for CORS handling
      const url = '/api/public/authentication/v1/login';

      console.log('Making login request to:', url);

      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      console.log('Login response:', response.data);

      // Store the token for tester requests
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      // Store environment info for later use
      if (response.data.access_token) {
        localStorage.setItem('auth_environment', credentials.environment);
      }

      return response.data;
    } catch (error) {
        console.error('Login failed:', error);
      // Log the complete error for debugging
      console.error('Authentication error details:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorResponse: axios.isAxiosError(error) ? error.response : null,
        errorCode: axios.isAxiosError(error) ? error.code : null,
        credentials: { email: credentials.email, environment: credentials.environment },
        requestUrl: '/public/authentication/v1/login'
      });

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid email or password');
        } else if (error.response?.status === 400) {
          throw new Error('Invalid request. Please check your credentials.');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please try again.');
        } else if (!error.response) {
          throw new Error('Network error. Please check your internet connection.');
        } else {
          throw new Error(`Authentication failed: ${error.response.statusText}`);
        }
      }
      throw new Error('Authentication failed. Please try again.');
    }
  }

  isTokenValid(token: string | null, expirationTime: Date | null): boolean {
    if (!token || !expirationTime) {
      return false;
    }

    return new Date() < expirationTime;
  }

  getAuthHeader(token: string): string {
    return `Bearer ${token}`;
  }

  getCurrentEnvironment(): string {
    return localStorage.getItem('auth_environment') || 'Dev';
  }

  getTesterBaseUrl(): string {
    const environment = this.getCurrentEnvironment();
    return this.getEnvironmentBaseUrl(environment);
  }
}

export const authService = new AuthService();
