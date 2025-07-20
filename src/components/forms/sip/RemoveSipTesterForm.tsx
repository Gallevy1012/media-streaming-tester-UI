import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
} from '@mui/material';
import { Send as SendIcon, Security as SecurityIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { TextInput } from '../../common';
import { AuthDialog } from '../../auth';
import { ColoredJsonViewer } from '../../response';
import { useAuthenticatedRequest } from '../../../hooks/useAuthenticatedRequest';
import { useAuth } from '../../../hooks/useAuth';
import { sipTesterService } from '../../../services/sipTesterService';

interface RemoveSipTesterFormProps {
  onTestComplete?: (result: any) => void;
  onBack?: () => void;
}

interface RemoveSipTesterFormData {
  requestId: string;
  sipTesterId: string;
}

export const RemoveSipTesterForm: React.FC<RemoveSipTesterFormProps> = ({ onTestComplete, onBack }) => {
  const [formData, setFormData] = useState<RemoveSipTesterFormData>({
    requestId: '',
    sipTesterId: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const { state: authState } = useAuth();
  const { isAuthDialogOpen, closeAuthDialog, executeWithAuth } = useAuthenticatedRequest();

  const handleInputChange = (field: keyof RemoveSipTesterFormData) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const testResult = await executeWithAuth(async () => {
        if (!formData.requestId?.trim()) {
          throw new Error('Request ID is required');
        }
        if (!formData.sipTesterId?.trim()) {
          throw new Error('SIP Tester ID is required');
        }

        const response = await sipTesterService.removeSipTester({
          requestId: formData.requestId.trim(),
          sipTesterId: formData.sipTesterId.trim()
        });
        
        return response;
      });

      if (testResult) {
        setResult(testResult);
        onTestComplete?.(testResult);
      }
      
    } catch (error: any) {
      console.error('Remove SIP Tester Form Error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {onBack && (
              <Button
                variant="outlined"
                onClick={onBack}
                startIcon={<ArrowBackIcon />}
                size="small"
              >
                Back
              </Button>
            )}
            <Typography variant="h5" component="h2">
              Remove SIP Tester
            </Typography>
          </Box>
          {authState.isAuthenticated ? (
            <Chip 
              icon={<SecurityIcon />} 
              label={`Authenticated as ${authState.username}`} 
              color="success" 
              size="small" 
            />
          ) : (
            <Chip 
              icon={<SecurityIcon />} 
              label="Authentication required for testing" 
              color="warning" 
              size="small" 
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            <TextInput
              id="requestId"
              label="Request ID"
              value={formData.requestId}
              onChange={handleInputChange('requestId')}
              placeholder="Enter request ID"
              helperText="Unique identifier for this request"
              required
            />

            <TextInput
              id="sipTesterId"
              label="SIP Tester ID"
              value={formData.sipTesterId}
              onChange={handleInputChange('sipTesterId')}
              placeholder="Enter SIP Tester ID"
              helperText="UUID of the SIP tester to remove"
              required
            />
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {authState.isAuthenticated 
                ? 'Ready to remove SIP tester' 
                : 'Authentication will be requested when you remove the tester'
              }
            </Typography>
            
            <Button
              type="submit"
              variant="contained"
              color="error"
              size="large"
              startIcon={<SendIcon />}
              disabled={isLoading}
              sx={{ minWidth: 150 }}
            >
              {isLoading ? 'Removing...' : 'Remove Tester'}
            </Button>
          </Box>
        </form>

        <ColoredJsonViewer
          response={result}
          error={error}
          onBack={onBack}
          title="Remove SIP Tester Response"
        />
      </Paper>

      <AuthDialog
        open={isAuthDialogOpen}
        onClose={closeAuthDialog}
        onSuccess={handleAuthSuccess}
        title="Authentication Required for SIP Testing"
        message="Please sign in to remove SIP testers."
      />
    </Box>
  );
};
