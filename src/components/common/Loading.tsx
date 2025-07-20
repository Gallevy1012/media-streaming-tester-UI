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
      gap={2}
      p={3}
    >
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  if (fullScreen) {
    return (
      <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: '#fff' }}>
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
        bgcolor="rgba(255, 255, 255, 0.8)"
        zIndex={1}
      >
        <Paper elevation={3}>
          {content}
        </Paper>
      </Box>
    );
  }

  return content;
};
