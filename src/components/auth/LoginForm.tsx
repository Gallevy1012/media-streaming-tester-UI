import React, { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Alert,
  TextField,
  MenuItem,
} from '@mui/material';
import { Loading } from '../common';
import { useAuth } from '../../hooks/useAuth';
import type { LoginCredentials } from '../../types';

interface LoginFormProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  compact = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    environment: 'dev',
  });
  const { login } = useAuth();

  const handleInputChange = (field: keyof LoginCredentials) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(formData);
      onSuccess?.();
    } catch (err) {
      console.error('Login error in component:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      {!compact && (
        <Box mb={3} textAlign="center">
          <Typography variant="h5" component="h2" gutterBottom>
            Authentication Required
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please sign in to access the testing tools
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={onSubmit}>
        <TextField
          id="email"
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleInputChange('email')}
          disabled={isLoading}
          required
          fullWidth
          autoComplete="email"
          size="small"
          sx={{ mb: 2 }}
        />

        <TextField
          id="password"
          name="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleInputChange('password')}
          disabled={isLoading}
          required
          fullWidth
          autoComplete="current-password"
          size="small"
          sx={{ mb: 2 }}
        />

        <TextField
          id="environment"
          name="environment"
          label="Environment"
          select
          value={formData.environment}
          onChange={handleInputChange('environment')}
          disabled={isLoading}
          required
          fullWidth
          size="small"
          sx={{ mb: 3 }}
        >
          <MenuItem value="dev">Development</MenuItem>
          <MenuItem value="test">Test</MenuItem>
          <MenuItem value="perf-wcx">Performance</MenuItem>
        </TextField>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="medium"
          disabled={isLoading}
          sx={{ mb: 1 }}
        >
          {isLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <Loading size={20} message="" />
              <span>Authenticating...</span>
            </Box>
          ) : (
            'Sign In'
          )}
        </Button>
      </Box>
    </Box>
  );
};
