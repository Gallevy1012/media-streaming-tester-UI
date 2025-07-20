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

interface SendSipByeFormProps {
  onTestComplete?: (result: any) => void;
  onBack?: () => void;
}

interface SendSipByeFormData {
  testerId: string;
  dialogId: string;
}

export const SendSipByeForm: React.FC<SendSipByeFormProps> = ({ onTestComplete, onBack }) => {
  const [formData, setFormData] = useState<SendSipByeFormData>({
    testerId: '',
    dialogId: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const { state: authState } = useAuth();
  const { isAuthDialogOpen, closeAuthDialog, executeWithAuth } = useAuthenticatedRequest();

  const handleInputChange = (field: keyof SendSipByeFormData) => (value: string) => {
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
        if (!formData.testerId?.trim()) {
          throw new Error('Tester ID is required');
        }
        if (!formData.dialogId?.trim()) {
          throw new Error('Dialog ID is required');
        }

        // TODO: Implement sendBye in sipTesterService
        const response = await sipTesterService.sendBye({
          testerId: formData.testerId.trim(),
          dialogId: formData.dialogId.trim()
        });
        
        return response;
      });

      if (testResult) {
        setResult(testResult);
        onTestComplete?.(testResult);
      }
      
    } catch (error: any) {
      console.error('Send SIP BYE Form Error:', error);
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
              Send SIP BYE
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
              id="testerId"
              label="Tester ID"
              value={formData.testerId}
              onChange={handleInputChange('testerId')}
              placeholder="Enter Tester ID"
              helperText="UUID of the SIP tester"
              required
            />

            <TextInput
              id="dialogId"
              label="Dialog ID"
              value={formData.dialogId}
              onChange={handleInputChange('dialogId')}
              placeholder="Enter Dialog ID"
              helperText="ID of the dialog to terminate"
              required
            />
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {authState.isAuthenticated 
                ? 'Ready to send SIP BYE' 
                : 'Authentication will be requested when you send the BYE'
              }
            </Typography>
            
            <Button
              type="submit"
              variant="contained"
              color="warning"
              size="large"
              startIcon={<SendIcon />}
              disabled={isLoading}
              sx={{ minWidth: 150 }}
            >
              {isLoading ? 'Sending...' : 'Send BYE'}
            </Button>
          </Box>
        </form>

        <ColoredJsonViewer
          response={result}
          error={error}
          onBack={onBack}
          title="Send SIP BYE Response"
        />
      </Paper>

      <AuthDialog
        open={isAuthDialogOpen}
        onClose={closeAuthDialog}
        onSuccess={handleAuthSuccess}
        title="Authentication Required for SIP Testing"
        message="Please sign in to send SIP BYE requests."
      />
    </Box>
  );
};
