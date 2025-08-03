import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Send as SendIcon, Security as SecurityIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { TextInput, Dropdown, NumberInput, MultiSelect } from '../../common';
import { AuthDialog } from '../../auth';
import { ColoredJsonViewer } from '../../response';
import { useAuthenticatedRequest } from '../../../hooks/useAuthenticatedRequest';
import { useAuth } from '../../../hooks/useAuth';
import { useTester } from '../../../contexts/TesterContext';
import { sipTesterService, setSipTesterAddFunction, setSipTesterRemoveFunction, setSipTesterAddDialogIdFunction } from '../../../services/sipTesterService';
import type { TesterRole, TransportProtocol, MediaSourceType, MediaCodec } from '../../../types';

interface CreateSipTesterFormProps {
  onTestComplete?: (result: any) => void;
  onBack?: () => void;
}

interface CreateSipTesterFormData {
  requestId: string;
  useDefaultHandlers?: boolean;
  customSessionExpiration?: number | null;
  testerKeyName?: string;
  testerRole?: TesterRole;
  ip?: string;
  port?: number;
  transportProtocol?: TransportProtocol;
  alias?: string;
  mediaSourceType?: MediaSourceType;
  unsupportedCodecs?: MediaCodec[];
  saveDialog?: boolean;
  isStateless?: boolean;
  imrRequesterId?: number | null;
  automaticSourceAddressesGeneration?: boolean;
}

export const CreateSipTesterForm: React.FC<CreateSipTesterFormProps> = ({ onTestComplete, onBack }) => {
  const [formData, setFormData] = useState<CreateSipTesterFormData>({
    requestId: '',
    useDefaultHandlers: true,
    customSessionExpiration: null,
    testerKeyName: 'sip-tester-default',
    testerRole: 'AVAYA_SBC' as TesterRole,
    ip: '127.0.0.1',
    port: 5060,
    transportProtocol: 'UDP' as TransportProtocol,
    alias: `default-alias-${new Date().toISOString().replace(/[:.-]/g, '').slice(0, 15)}`,
    mediaSourceType: 'SIP' as MediaSourceType,
    unsupportedCodecs: [] as MediaCodec[],
    saveDialog: true,
    isStateless: false,
    imrRequesterId: null,
    automaticSourceAddressesGeneration: true,
  });

  // Effect to handle automatic source address generation
  useEffect(() => {
    if (formData.automaticSourceAddressesGeneration) {
      setFormData(prev => ({ ...prev, ip: '0.0.0.0' }));
    }
  }, [formData.automaticSourceAddressesGeneration]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { state: authState } = useAuth();
  const { addTester, removeTesterByTesterId, addDialogId } = useTester();
  const { isAuthDialogOpen, closeAuthDialog, executeWithAuth } = useAuthenticatedRequest();

  // Initialize SIP service with addTester function
  useEffect(() => {
    console.log('CreateSipTesterForm useEffect running - setting up functions');
    console.log('addTester:', !!addTester);
    console.log('addDialogId:', !!addDialogId);
    setSipTesterAddFunction(addTester);
    setSipTesterRemoveFunction(removeTesterByTesterId);
    setSipTesterAddDialogIdFunction(addDialogId);
    console.log('CreateSipTesterForm: All functions set');
  }, [addTester, removeTesterByTesterId, addDialogId]);

  // Port validation function
  const validatePort = (port: number): string | null => {
    if (port < 42000 || port > 62000) {
      return 'SIP port must be between 42000-62000';
    }
    return null;
  };

  const handleInputChange = (field: string) => (value: any) => {
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Validate port
    if (field === 'port' && typeof value === 'number') {
      const portError = validatePort(value);
      if (portError) {
        setValidationErrors(prev => ({ ...prev, [field]: portError }));
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: field === 'customSessionExpiration' || field === 'imrRequesterId'
        ? (value === '' || value === null || value === undefined ? null : Number(value))
        : value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Check for validation errors
    // const hasErrors = Object.values(validationErrors).some(error => error);
    // if (hasErrors) {
    //   setError('Please fix validation errors before submitting');
    //   return;
    // }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const testResult = await executeWithAuth(async () => {
        // Create SIP Tester
        if (!formData.testerKeyName?.trim()) {
          throw new Error('Tester Key Name is required');
        }
        if (!formData.ip?.trim()) {
          throw new Error('IP Address is required');
        }
        if (!formData.alias?.trim()) {
          throw new Error('Alias is required');
        }

        // Build the request with clean structure
        const config: any = {
          testerKeyName: formData.testerKeyName.trim(),
          testerRole: formData.testerRole,
          listeningAddress: {
            ip: formData.ip.trim(),
            port: formData.port,
            transportProtocol: formData.transportProtocol,
            alias: formData.alias.trim(),
          },
          mediaSourceType: formData.mediaSourceType,
          unsupportedCodecs: formData.unsupportedCodecs,
          saveDialog: true,
          isStateless: formData.isStateless,
          automaticSourceAddressesGeneration: formData.automaticSourceAddressesGeneration,
        };

        // Add optional fields only if they have values
        if (formData.imrRequesterId) {
          config.imrRequesterId = formData.imrRequesterId;
        }

        const requestPayload: any = {
          requestId: formData.requestId.trim() || `sip-test-${Date.now()}`,
          config,
          useDefaultHandlers: formData.useDefaultHandlers,
        };

        // Add optional fields only if they have values
        if (formData.customSessionExpiration) {
          requestPayload.customSessionExpiration = formData.customSessionExpiration;
        }

        console.log('Sending SIP tester request:', JSON.stringify(requestPayload, null, 2));

        const response = await sipTesterService.createSipTester(requestPayload);

        console.log('SIP tester response received:', JSON.stringify(response, null, 2));

        return response;
      });

      if (testResult) {
        setResult(testResult);
        onTestComplete?.(testResult);
      }

    } catch (error: any) {
      console.error('Create SIP Tester Form Error:', error);
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
            <Button
              variant="outlined"
              onClick={onBack || (() => window.history.back())}
              startIcon={<ArrowBackIcon />}
              size="small"
            >
              Back
            </Button>
            <Typography variant="h5" component="h2">
              Create SIP Tester
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
              placeholder="Auto-generated if empty"
              helperText="Unique identifier for this request - Auto-generated if empty"
            />

            <Dropdown
              id="testerRole"
              label="Tester Role"
              value={formData.testerRole || 'AVAYA_SBC'}
              onChange={handleInputChange('testerRole')}
              options={[
                { value: 'AVAYA_SBC', label: 'Avaya SBC' },
                { value: 'CISCO_SBC', label: 'Cisco SBC' },
                { value: 'TEAMS_SBC', label: 'Teams SBC' },
                { value: 'RECORDER', label: 'Recorder' },
                { value: 'SUPERVISOR', label: 'Supervisor' },
                { value: 'RTIG', label: 'RTIG' },
                { value: 'ESFU', label: 'ESFU' },
                { value: 'SIP_LB', label: 'SIP-LB' },
                { value: 'VRSP', label: 'VRSP' },
              ]}
              required
              helperText="Role of the SIP tester"
            />

            <TextInput
              id="ip"
              label="IP Address"
              value={formData.ip}
              onChange={handleInputChange('ip')}
              required
              placeholder="192.168.1.100"
              helperText="IP address for the SIP tester to listen on"
              disabled={formData.automaticSourceAddressesGeneration}
            />

            <TextInput
              id="port"
              label="Port"
              value={formData.port?.toString() || ''}
              onChange={(value) => {
                if (value === '') {
                  handleInputChange('port')('');
                  return;
                }

                if (!/^\d+$/.test(value)) {
                  return;
                }

                const numValue = parseInt(value, 10);
                if (!isNaN(numValue)) {
                  handleInputChange('port')(numValue);
                }
              }}
              required
              helperText={validationErrors.port || "Enter port number between 5000-6000"}
              placeholder="5060"
            />

            <Dropdown
              id="transportProtocol"
              label="Transport Protocol"
              value={formData.transportProtocol || 'UDP'}
              onChange={handleInputChange('transportProtocol')}
              options={[
                { value: 'UDP', label: 'UDP' },
                { value: 'TCP', label: 'TCP' },
              ]}
              required
              helperText="Transport protocol for SIP messages"
            />

            <TextInput
              id="alias"
              label="Alias"
              value={formData.alias}
              onChange={handleInputChange('alias')}
              required
              placeholder="sip.example.com"
              helperText="Alias for the communication address (need to be unique)"
            />

            <TextInput
              id="testerKeyName"
              label="Tester Key Name"
              value={formData.testerKeyName}
              onChange={handleInputChange('testerKeyName')}
              required
              placeholder="my-sip-tester"
              helperText="Custom key name for the tester"
            />

            <Dropdown
              id="mediaSourceType"
              label="Media Source Type"
              value={formData.mediaSourceType || 'SIP'}
              onChange={handleInputChange('mediaSourceType')}
              options={[
                { value: 'SIP', label: 'SIP' },
                { value: 'DMCC', label: 'DMCC' },
              ]}
              helperText="Type of media source"
            />

            <MultiSelect
              id="unsupportedCodecs"
              label="Unsupported Codecs (Optional)"
              values={formData.unsupportedCodecs || []}
              onChange={handleInputChange('unsupportedCodecs')}
              options={[
                { value: 'PCMU', label: 'PCMU (G.711 μ-law)' },
                { value: 'PCMA', label: 'PCMA (G.711 A-law)' },
                { value: 'G729', label: 'G.729' },
                { value: 'DEFAULT', label: 'Default' },
              ]}
              helperText="Select codecs to mark as unsupported"
            />

            <NumberInput
              id="customSessionExpiration"
              label="Custom Session Expiration (Optional)"
              value={formData.customSessionExpiration || ''}
              onChange={handleInputChange('customSessionExpiration')}
              min={1}
              placeholder="Leave empty for default"
              helperText="Custom session expiration time in seconds"
            />

            <NumberInput
              id="imrRequesterId"
              label="IMR Requester ID (Optional)"
              value={formData.imrRequesterId || ''}
              onChange={handleInputChange('imrRequesterId')}
              min={1}
              placeholder="Leave empty if not needed"
              helperText="Optional IMR requester identifier"
            />

            <Box sx={{ gridColumn: { md: '1 / -1' } }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Configuration Options
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.useDefaultHandlers || false}
                      onChange={(e) => handleInputChange('useDefaultHandlers')(e.target.checked)}
                    />
                  }
                  label="Use Default Handlers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isStateless || false}
                      onChange={(e) => handleInputChange('isStateless')(e.target.checked)}
                    />
                  }
                  label="Stateless Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.automaticSourceAddressesGeneration || false}
                      onChange={(e) => handleInputChange('automaticSourceAddressesGeneration')(e.target.checked)}
                    />
                  }
                  label="Automatic Source Addresses Generation"
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {authState.isAuthenticated
                ? 'Ready to create SIP tester'
                : 'Authentication will be requested when you create the tester'
              }
            </Typography>

            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              disabled={isLoading}
              sx={{ minWidth: 150 }}
            >
              {isLoading ? 'Creating...' : 'Create Tester'}
            </Button>
          </Box>
        </form>

        <ColoredJsonViewer
          response={result}
          error={error}
          onBack={onBack}
          title="Create SIP Tester Response"
        />
      </Paper>

      <AuthDialog
        open={isAuthDialogOpen}
        onClose={closeAuthDialog}
        onSuccess={handleAuthSuccess}
        title="Authentication Required for SIP Testing"
        message="Please sign in to create SIP testers."
      />
    </Box>
  );
};
