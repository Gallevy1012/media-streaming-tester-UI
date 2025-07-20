import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { LoginForm } from './LoginForm';
import { useAuth } from '../../hooks/useAuth';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  message?: string;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({
  open,
  onClose,
  onSuccess,
  title = 'Authentication Required',
  message = 'Please sign in to send requests to the MS-Tester service.',
}) => {
  const { state } = useAuth();

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  // Auto-close dialog if user is authenticated
  React.useEffect(() => {
    if (state.isAuthenticated && open) {
      handleSuccess();
    }
  }, [state.isAuthenticated, open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'grey.500' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        </Box>
        
        <LoginForm compact onSuccess={handleSuccess} />
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
