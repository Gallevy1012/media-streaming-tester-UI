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
      className="no-page-transition"
      sx={{
        position: 'fixed',
        top: { xs: 100, sm: 20 },
        left: { xs: 10, sm: 20 },
        zIndex: 1300, // Higher z-index to ensure it stays above other components
        maxWidth: { xs: 'calc(100vw - 20px)', sm: 380 },
        minWidth: { xs: 280, sm: 320 },
        width: { xs: 'calc(100vw - 20px)', sm: 'auto' },
        // Prevent any layout shifts
        transform: 'translateZ(0)', // Force hardware acceleration
        willChange: 'auto',
      }}
    >
      <Paper 
        elevation={0}
        sx={{ 
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2.5,
            background: authState.isAuthenticated
              ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              background: authState.isAuthenticated
                ? 'linear-gradient(135deg, #1b5e20 0%, #388e3c 100%)'
                : 'linear-gradient(135deg, #1565c0 0%, #2196f3 100%)',
              transform: 'scale(1.02)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              transition: 'left 0.6s ease-in-out',
            },
            '&:hover::before': {
              left: '100%',
            },
          }}
          onClick={handleToggle}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 1 }}>
            <Box
              sx={{
                p: 0.5,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: authState.isAuthenticated ? 'none' : 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.1)', opacity: 0.8 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
            >
              <SecurityIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  letterSpacing: '0.5px',
                }}
              >
                {authState.isAuthenticated ? '🔐 Authenticated' : '🔓 Sign In Required'}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  opacity: 0.9,
                  fontSize: '0.75rem',
                  display: 'block',
                  lineHeight: 1,
                }}
              >
                {authState.isAuthenticated ? 'Ready to test' : 'Click to authenticate'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, zIndex: 1 }}>
            {authState.isAuthenticated && (
              <Chip
                label={authState.username || 'User'}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.35)',
                  },
                }}
              />
            )}
            <IconButton 
              size="small" 
              sx={{ 
                color: 'white',
                background: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'rotate(180deg)',
                },
                transition: 'all 0.3s ease-in-out',
              }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        {/* Content */}
        <Collapse in={isExpanded} timeout={400}>
          <Box sx={{ 
            p: 3,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 255, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
          }}>
            {authState.isAuthenticated ? (
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 2.5,
                  p: 2,
                  background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.05) 100%)',
                  borderRadius: 2,
                  border: '1px solid rgba(46, 125, 50, 0.1)',
                }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: 'success.main',
                    animation: 'pulse 2s infinite',
                  }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      color: 'success.dark',
                    }}
                  >
                    Connected to: <strong>{authState.environment === 'Dev' ? 'Dev' : authState.environment}</strong>
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 3,
                  p: 2,
                  background: 'rgba(25, 118, 210, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                }}>
                  <Typography variant="body2" color="primary.main" sx={{ fontWeight: 500 }}>
                    👤 Welcome back, <strong>{authState.username}</strong>!
                  </Typography>
                </Box>

                <Button
                  variant="outlined" 
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  fullWidth
                  size="medium"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    py: 1.2,
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(244, 67, 54, 0.05) 100%)',
                      borderColor: 'error.main',
                      color: 'error.main',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)',
                    },
                  }}
                >
                  Sign Out Securely
                </Button>
              </Box>
            ) : (
              <Box>
                <Box sx={{ 
                  mb: 3,
                  p: 2.5,
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)',
                  borderRadius: 2,
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 100,
                    height: 100,
                    background: 'radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                  }} />
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'primary.dark',
                      fontWeight: 500,
                      lineHeight: 1.6,
                      position: 'relative',
                      zIndex: 1,
                    }}
                  >
                    🔐 <strong>Secure Authentication Required</strong>
                    <br />
                    Sign in to access MS-Tester services and execute tests with full API access.
                  </Typography>
                </Box>
                <LoginForm onSuccess={handleLoginSuccess} />
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};
