import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Paper,
  Alert,
} from '@mui/material';
import {
  Person as PersonIcon,
  Computer as EnvironmentIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose }) => {
  const { state } = useAuth();

  if (!state.isAuthenticated) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon />
            Profile
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            You need to authenticate to view your profile information.
          </Alert>
          <Typography variant="body1" color="text.secondary">
            Please sign in to access your profile details and authentication information.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon />
          User Profile
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={3}>
          {/* User Information */}
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Username
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {state.username || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={2}>
                <EnvironmentIcon color="primary" />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Environment
                  </Typography>
                  <Chip
                    label={state.environment}
                    size="small"
                    color={state.environment === 'perf-wcx' ? 'error' : 'primary'}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Token Information */}
          {state.loginResponse && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Token Information
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Access Token
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {state.loginResponse.access_token}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Token Type
                  </Typography>
                  <Typography variant="body1">
                    {state.loginResponse.token_type}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Expires In
                  </Typography>
                  <Typography variant="body1">
                    {state.loginResponse.expires_in} seconds
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {/* Authentication Response Details */}
          {state.loginResponse && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Full Authentication Response
              </Typography>
              <Box
                sx={{
                  bgcolor: 'grey.50',
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                <pre style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(state.loginResponse, null, 2)}
                </pre>
              </Box>
            </Paper>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
