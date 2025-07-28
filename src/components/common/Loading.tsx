import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Paper,
  Backdrop,
} from '@mui/material';

interface LoadingProps {
  message?: string;
  size?: number;
  overlay?: boolean;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  size = 40,
  overlay = false,
  fullScreen = false,
}) => {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={3}
      p={4}
      sx={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: fullScreen ? 0 : 3,
        border: fullScreen ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: fullScreen ? 'none' : '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CircularProgress 
          size={size} 
          thickness={4}
          sx={{
            color: 'primary.main',
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.7 },
              '100%': { opacity: 1 },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: size / 3,
          }}
        >
          ⚡
        </Box>
      </Box>
      <Typography 
        variant="body1" 
        color="text.secondary"
        sx={{ 
          fontWeight: 500,
          textAlign: 'center',
          animation: 'fadeInOut 2s ease-in-out infinite',
          '@keyframes fadeInOut': {
            '0%': { opacity: 0.7 },
            '50%': { opacity: 1 },
            '100%': { opacity: 0.7 },
          },
        }}
      >
        {message}
      </Typography>
      <Box
        sx={{
          width: 120,
          height: 4,
          borderRadius: 2,
          background: 'linear-gradient(90deg, #1976d2 0%, #42a5f5 50%, #1976d2 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s linear infinite',
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '200% 0' },
            '100%': { backgroundPosition: '-200% 0' },
          },
        }}
      />
    </Box>
  );

  if (fullScreen) {
    return (
      <Backdrop 
        open 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1, 
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(66, 165, 245, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {content}
      </Backdrop>
    );
  }

  if (overlay) {
    return (
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        sx={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(5px)',
          zIndex: 1000,
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};
