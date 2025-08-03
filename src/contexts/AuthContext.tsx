/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, LoginCredentials, Environment, AuthResponse } from '../types';
import { authService } from '../services/authService';


export interface AuthContextType {
  state: AuthState;
  user: AuthState['user'];
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isTokenExpiring: () => boolean;
  getTimeUntilExpiration: () => number;
}

interface AuthProviderProps {
  children: ReactNode;
}

const loadStateFromStorage = (): AuthState => {
  const defaultState: AuthState = {
    isAuthenticated: false,
    token: null,
    environment: 'Dev',
    expirationTime: null,
    user: null,
    loginResponse: null,
  };

  try {
    const savedToken = localStorage.getItem('auth_token');
    const savedExpirationTime = localStorage.getItem('auth_expiration');
    const savedUsername = localStorage.getItem('auth_username');
    const savedEnvironment = localStorage.getItem('auth_environment') as Environment;
    const savedLoginResponse = localStorage.getItem('auth_login_response');

    if (savedToken && savedExpirationTime && savedUsername) {
      const expirationTime = new Date(savedExpirationTime);
      // Check if token is still valid
      if (expirationTime > new Date()) {
        return {
          isAuthenticated: true,
          token: savedToken,
          environment: savedEnvironment || 'Dev',
          expirationTime,
          user: {
            username: savedUsername,
            environment: savedEnvironment || 'Dev',
          },
          username: savedUsername,
          loginResponse: savedLoginResponse ? JSON.parse(savedLoginResponse) : null,
        };
      } else {
        // Token expired, clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_expiration');
        localStorage.removeItem('auth_username');
        localStorage.removeItem('auth_environment');
        localStorage.removeItem('auth_login_response');
      }
    }
  } catch (error) {
    console.warn('Error loading auth state from localStorage:', error);
    // Clear potentially corrupted data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_expiration');
    localStorage.removeItem('auth_username');
    localStorage.removeItem('auth_environment');
    localStorage.removeItem('auth_login_response');
  }

  return defaultState;
};

const initialState: AuthState = loadStateFromStorage();

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { token: string; expirationTime: Date; username: string; environment: Environment; loginResponse: AuthResponse } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_ENVIRONMENT'; payload: Environment };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isAuthenticated: false,
      };
    case 'LOGIN_SUCCESS':
      try {
        // Validate that expirationTime is a valid Date object
        if (!action.payload.expirationTime || !(action.payload.expirationTime instanceof Date) || isNaN(action.payload.expirationTime.getTime())) {
          console.error('Invalid expiration time received:', action.payload.expirationTime);
          return {
            ...state,
            isAuthenticated: false,
            error: 'Invalid token expiration time',
          };
        }

        // Store token in localStorage for persistence
        localStorage.setItem('auth_token', action.payload.token);
        localStorage.setItem('auth_expiration', action.payload.expirationTime.toISOString());
        localStorage.setItem('auth_username', action.payload.username);
        localStorage.setItem('auth_environment', action.payload.environment);
        localStorage.setItem('auth_login_response', JSON.stringify(action.payload.loginResponse));

        return {
          ...state,
          isAuthenticated: true,
          token: action.payload.token,
          expirationTime: action.payload.expirationTime,
          username: action.payload.username,
          environment: action.payload.environment,
          loginResponse: action.payload.loginResponse,
          user: {
            username: action.payload.username,
            environment: action.payload.environment,
          },
        };
      } catch (error) {
        console.error('Error in LOGIN_SUCCESS:', error);
        return {
          ...state,
          isAuthenticated: false,
          error: 'Failed to process login response',
        };
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        expirationTime: null,
        username: undefined,
        user: null,
      };
    case 'LOGOUT':
      // Clear all auth data from localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_expiration');
      localStorage.removeItem('auth_username');
      localStorage.removeItem('auth_environment');
      localStorage.removeItem('auth_login_response');

      return {
        ...initialState,
        environment: state.environment,
      };
    case 'SET_ENVIRONMENT':
      return {
        ...state,
        environment: action.payload,
      };
    default:
      return state;
  }
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const response = await authService.login(credentials);

      // Calculate expiration time using the correct field from the API response
      const expirationTime = new Date();
      const tokenExpirationSec = response.tokenExpirationTimeSec || response.expires_in || 3600; // fallback to 1 hour
      expirationTime.setSeconds(expirationTime.getSeconds() + tokenExpirationSec);

      // Validate that we have a valid date
      if (isNaN(expirationTime.getTime())) {
        console.error('Invalid expiration time:', tokenExpirationSec);
        throw new Error('Invalid token expiration time received from server');
      }

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token: response.token || response.access_token || '', // Use the correct token field with fallback
          expirationTime,
          username: credentials.email,
          environment: credentials.environment,
          loginResponse: response,
        },
      });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const isTokenExpiring = useCallback((): boolean => {
    if (!state.expirationTime) return false;

    const now = new Date();
    const timeUntilExpiration = state.expirationTime.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    return timeUntilExpiration <= fiveMinutes;
  }, [state.expirationTime]);

  const getTimeUntilExpiration = useCallback((): number => {
    if (!state.expirationTime) return 0;

    const now = new Date();
    const timeUntilExpiration = state.expirationTime.getTime() - now.getTime();

    return Math.max(0, timeUntilExpiration);
  }, [state.expirationTime]);

  const value: AuthContextType = {
    state,
    user: state.user,
    isLoading: false, // Add loading state management if needed
    login,
    logout,
    isTokenExpiring,
    getTimeUntilExpiration,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
