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

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  environment: 'Dev',
  expirationTime: null,
  user: null,
  loginResponse: null,
};

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
      // Store token in localStorage for testerHttpClient
      console.log('Login successful:', action.payload);

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
      // Clear token from localStorage
      localStorage.removeItem('auth_token');

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

      // Calculate expiration time
      const expirationTime = new Date();
      expirationTime.setSeconds(expirationTime.getSeconds() + response.expires_in);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token: response.access_token,
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
