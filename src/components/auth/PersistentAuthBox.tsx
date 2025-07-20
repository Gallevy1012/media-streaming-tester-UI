import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
  Logout as LogoutIcon 
} from '@mui/icons-material';
import { LoginForm } from '../auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';

export const PersistentAuthBox: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { state: authState, logout } = useAuth();

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleLogout = () => {
    logout();
    setIsExpanded(false);
  };

  const handleLoginSuccess = () => {
    setIsExpanded(false);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 100,
        left: 20,
        zIndex: 1000,
        maxWidth: 400,
      }}
    >
      <Paper elevation={4} sx={{ overflow: 'hidden' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            backgroundColor: authState.isAuthenticated 
              ? 'success.main' 
              : 'warning.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
          onClick={handleToggle}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            <Typography variant="subtitle2">
              {authState.isAuthenticated ? 'Authenticated' : 'Authentication'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {authState.isAuthenticated && (
              <Chip
                label={authState.username || 'User'}
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              />
            )}
            <IconButton size="small" sx={{ color: 'white' }}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Collapse in={isExpanded}>
          <Box sx={{ p: 2 }}>
            {authState.isAuthenticated ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Environment: <strong>{authState.environment === 'dev' ? 'Dev' : authState.environment}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Token expires: {authState.expirationTime?.toLocaleString() || 'Unknown'}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  fullWidth
                  size="small"
                >
                  Logout
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Sign in to access MS-Tester services. Your authentication will be used for all API requests.
                </Typography>
                <LoginForm onSuccess={handleLoginSuccess} />
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};
