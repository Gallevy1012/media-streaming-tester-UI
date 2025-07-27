import React, { useState } from 'react';
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
import { TextInput, Dropdown, NumberInput } from '../../common';
import { AuthDialog } from '../../auth';
import { ColoredJsonViewer } from '../../response';
import { useAuthenticatedRequest } from '../../../hooks/useAuthenticatedRequest';
import { useAuth } from '../../../hooks/useAuth';
import { useTester } from '../../../contexts/TesterContext';
import { mediaTesterService } from '../../../services/mediaTesterService';
import { useNavigate } from 'react-router-dom';
import type { TesterRole, TransportProtocol, MediaSourceType, ChannelType, MediaCodec } from '../../../types';

interface MediaFormProps {
  functionId: string;
  onTestComplete?: (result: any) => void;
}

export const MediaTestForm: React.FC<MediaFormProps> = ({ functionId, onTestComplete }) => {
  const navigate = useNavigate();
  const { addTester } = useTester();

  const [formData, setFormData] = useState(() => {
    switch (functionId) {
      case 'create-media-tester':
        return {
          requestId: '',
          // SipTesterConfig
          testerKeyName: '',
          testerRole: 'DEFAULT_CLIENT' as TesterRole,
          ip: '',
          port: 5060,
          transportProtocol: 'UDP' as TransportProtocol,
          alias: '',
          mediaSourceType: 'SIP' as MediaSourceType,
          saveDialog: true,
          isStateless: false,
          imrRequesterId: null as number | null,
          // MediaTesterConfig specific
          rtpSendingPorts: [] as number[],
          rtpReceivingPorts: [] as number[],
          streamsDuration: 'PT30S',
          channelSsrcs: [] as number[],
          sipSessionExpiration: null as number | null,
          isGlobalIpReceiver: false,
          isLocalRun: false,
        };
      case 'send-media-invite':
        return {
          mediaTesterId: '',
          destinationUri: '',
          fromUri: '',
          channelType: 'MONO' as ChannelType,
          channels: [{
            mediaType: 'AUDIO',
            port: 42000,
            codec: 'PCMU' as MediaCodec,
            payloadType: 0,
          }],
          autoStartRtp: true,
          rtpDurationMs: 30000,
          customHeaders: {} as Record<string, string>,
        };
      default:
        return {};
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { state: authState } = useAuth();
  const { isAuthDialogOpen, closeAuthDialog, executeWithAuth } = useAuthenticatedRequest();

  // Port validation function
  const validatePort = (port: number, field: string): string | null => {
    if (field === 'port') {
      // SIP tester port range
      if (port < 42000 || port > 62000) {
        return 'SIP port must be between 42000-62000';
      }
    } else {
      // RTP/Media tester port range
      if (port < 42000 || port > 62000) {
        return 'RTP/Media port must be between 42000-62000';
      }
    }
    return null;
  };

  const handleInputChange = (field: string) => (value: any) => {
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Validate ports
    if ((field === 'port' || field === 'channels.0.port') && typeof value === 'number') {
      const portError = validatePort(value, field);
      if (portError) {
        setValidationErrors(prev => ({ ...prev, [field]: portError }));
      }
    }

    if (field.includes('.')) {
      const parts = field.split('.');
      setFormData(prev => {
        const newData = { ...prev } as any;
        let current = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return newData;
      });
    } else if (field.endsWith('Ports') || field.endsWith('Ssrcs')) {
      // Handle array inputs for ports and SSRCs
      const values = value.split(',').map((v: string) => parseInt(v.trim())).filter((v: number) => !isNaN(v));

      // Validate port ranges for array inputs
      if (field.endsWith('Ports')) {
        const invalidPorts = values.filter((port: number) => {
          const error = validatePort(port, field);
          return error !== null;
        });
        if (invalidPorts.length > 0) {
          setValidationErrors(prev => ({
            ...prev,
            [field]: `Invalid ports: ${invalidPorts.join(', ')}. RTP/Media ports must be between 42000-62000`
          }));
        }
      }

      setFormData(prev => ({ ...prev, [field]: values }));
    } else if (field === 'customSessionExpiration' || field === 'imrRequesterId' || field === 'sipSessionExpiration') {
      setFormData(prev => ({
        ...prev,
        [field]: value === '' || value === null || value === undefined ? null : Number(value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
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
    // Don't clear result to allow viewing previous response while sending new request

    const testResult = await executeWithAuth(async () => {
      let response;

      switch (functionId) {
        case 'create-media-tester':
          response = await mediaTesterService.createMediaTester({
            requestId: formData.requestId || `media-test-${Date.now()}`,
            config: {
              sipTesterConfig: {
                testerKeyName: formData.testerKeyName || '',
                testerRole: formData.testerRole || 'DEFAULT_CLIENT',
                listeningAddress: {
                  ip: formData.ip || '',
                  port: formData.port || 5060,
                  transportProtocol: formData.transportProtocol || 'UDP',
                  alias: formData.alias || '',
                },
                mediaSourceType: formData.mediaSourceType,
                saveDialog: true,
                isStateless: formData.isStateless,
                imrRequesterId: formData.imrRequesterId || undefined,
              },
              rtpSendingPorts: formData.rtpSendingPorts || [],
              rtpReceivingPorts: formData.rtpReceivingPorts || [],
              streamsDuration: formData.streamsDuration || 'PT30S',
              channelSsrcs: formData.channelSsrcs || [],
              sipSessionExpiration: formData.sipSessionExpiration || undefined,
              isGlobalIpReceiver: formData.isGlobalIpReceiver,
              isLocalRun: formData.isLocalRun,
            },
          });

          // Add to tester management system
          if (response && response.mediaTesterId) {
            addTester('media-tester', response, {
              requestId: formData.requestId,
            });
          }
          break;
        case 'send-media-invite':
          response = await mediaTesterService.sendMediaInvite({
            mediaTesterId: formData.mediaTesterId || '',
            destinationUri: formData.destinationUri || '',
            fromUri: formData.fromUri || '',
            mediaConfig: {
              channelType: formData.channelType || 'MONO',
              channels: formData.channels || [],
              autoStartRtp: formData.autoStartRtp,
              rtpDurationMs: formData.rtpDurationMs,
            },
            customHeaders: (formData.customHeaders && Object.keys(formData.customHeaders).length > 0) ? formData.customHeaders : undefined,
          });
          break;
        default:
          throw new Error(`Unknown function: ${functionId}`);
      }

      return response;
    });

    if (testResult) {
      setResult(testResult);
      onTestComplete?.(testResult);
    }

    setIsLoading(false);
  };

  const handleAuthSuccess = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleBack = () => {
    navigate('/media-tester');
  };

  const getFunctionTitle = () => {
    switch (functionId) {
      case 'create-media-tester': return 'Create Media Tester';
      case 'send-media-invite': return 'Send Media INVITE';
      default: return 'Media Function';
    }
  };

  const renderFormFields = () => {
    switch (functionId) {
      case 'create-media-tester':
        return (
          <>
            <TextInput
              id="requestId"
              label="Media Tester Request ID"
              value={formData.requestId}
              onChange={handleInputChange('requestId')}
              placeholder="Auto-generated if empty"
              helperText="Unique identifier for this media tester request"
            />

            <Typography variant="h6" sx={{ gridColumn: '1 / -1', mt: 2, mb: 1 }}>
              SIP Tester Configuration
            </Typography>

            <TextInput
              id="testerKeyName"
              label="Tester Key Name (Optional)"
              value={formData.testerKeyName}
              onChange={handleInputChange('testerKeyName')}
              placeholder="my-media-tester"
              helperText="Optional custom key name for the tester"
            />

            <Dropdown
              id="testerRole"
              label="Tester Role"
              value={formData.testerRole || 'DEFAULT_CLIENT'}
              onChange={handleInputChange('testerRole')}
              options={[
                { value: 'DEFAULT_CLIENT', label: 'Default Client' },
                { value: 'DEFAULT_SERVER', label: 'Default Server' },
                { value: 'AVAYA_SBC', label: 'Avaya SBC' },
                { value: 'CISCO_SBC', label: 'Cisco SBC' },
                { value: 'TEAMS_SBC', label: 'Teams SBC' },
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
              helperText="IP address for the tester to listen on"
            />

            <NumberInput
              id="port"
              label="Port"
              value={formData.port || 5060}
              onChange={handleInputChange('port')}
              min={5000}
              max={6000}
              required
              error={validationErrors.port || ''}
              helperText={validationErrors.port || "Port number for SIP communication (42000-62000)"}
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
              label="Alias (Optional)"
              value={formData.alias}
              onChange={handleInputChange('alias')}
              placeholder="media.example.com"
              helperText="Optional alias for the communication address"
            />

            <Typography variant="h6" sx={{ gridColumn: '1 / -1', mt: 2, mb: 1 }}>
              Media Configuration
            </Typography>

            <TextInput
              id="rtpSendingPorts"
              label="RTP Sending Ports (comma-separated)"
              value={formData.rtpSendingPorts?.join(', ') || ''}
              onChange={handleInputChange('rtpSendingPorts')}
              placeholder="42004, 42006, 42008"
              error={validationErrors.rtpSendingPorts || ''}
              helperText={validationErrors.rtpSendingPorts || "Ports for sending RTP streams (42000-62000)"}
            />

            <TextInput
              id="rtpReceivingPorts"
              label="RTP Receiving Ports (comma-separated)"
              value={formData.rtpReceivingPorts?.join(', ') || ''}
              onChange={handleInputChange('rtpReceivingPorts')}
              placeholder="42005, 42007, 42009"
              error={validationErrors.rtpReceivingPorts || ''}
              helperText={validationErrors.rtpReceivingPorts || "Ports for receiving RTP streams (42000-62000)"}
            />

            <TextInput
              id="streamsDuration"
              label="Streams Duration"
              value={formData.streamsDuration}
              onChange={handleInputChange('streamsDuration')}
              required
              placeholder="PT30S"
              helperText="Duration in ISO 8601 format (e.g., PT30S for 30 seconds)"
            />

            <TextInput
              id="channelSsrcs"
              label="Channel SSRCs (comma-separated)"
              value={formData.channelSsrcs?.join(', ') || ''}
              onChange={handleInputChange('channelSsrcs')}
              placeholder="12345, 12346"
              helperText="Synchronization Source identifiers for channels (1-2 values)"
            />

            <NumberInput
              id="sipSessionExpiration"
              label="SIP Session Expiration (Optional)"
              value={formData.sipSessionExpiration || ''}
              onChange={handleInputChange('sipSessionExpiration')}
              min={1}
              placeholder="Leave empty for default"
              helperText="SIP session expiration time in seconds"
            />

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Additional Options
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isStateless}
                      onChange={(e) => handleInputChange('isStateless')(e.target.checked)}
                    />
                  }
                  label="Stateless Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isGlobalIpReceiver}
                      onChange={(e) => handleInputChange('isGlobalIpReceiver')(e.target.checked)}
                    />
                  }
                  label="Global IP Receiver"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isLocalRun}
                      onChange={(e) => handleInputChange('isLocalRun')(e.target.checked)}
                    />
                  }
                  label="Local Run"
                />
              </Box>
            </Box>
          </>
        );

      case 'send-media-invite':
        return (
          <>
            <TextInput
              id="mediaTesterId"
              label="Media Tester ID"
              value={formData.mediaTesterId}
              onChange={handleInputChange('mediaTesterId')}
              required
              placeholder="media-tester-123"
              helperText="ID of the media tester instance"
            />

            <TextInput
              id="destinationUri"
              label="Destination URI"
              value={formData.destinationUri}
              onChange={handleInputChange('destinationUri')}
              required
              placeholder="sip:user@example.com"
              helperText="SIP URI of the destination"
            />

            <TextInput
              id="fromUri"
              label="From URI"
              value={formData.fromUri}
              onChange={handleInputChange('fromUri')}
              required
              placeholder="sip:caller@example.com"
              helperText="SIP URI of the caller"
            />

            <Dropdown
              id="channelType"
              label="Channel Type"
              value={formData.channelType || 'MONO'}
              onChange={handleInputChange('channelType')}
              options={[
                { value: 'MONO', label: 'Mono' },
                { value: 'STEREO', label: 'Stereo' },
              ]}
              required
              helperText="Type of audio channel"
            />

            <Typography variant="h6" sx={{ gridColumn: '1 / -1', mt: 2, mb: 1 }}>
              Channel Configuration
            </Typography>

            <TextInput
              id="mediaType"
              label="Media Type"
              value={formData.channels?.[0]?.mediaType || ''}
              onChange={handleInputChange('channels.0.mediaType')}
              required
              placeholder="AUDIO"
              helperText="Type of media (audio/video)"
            />

            <NumberInput
              id="channelPort"
              label="Channel Port"
              value={formData.channels?.[0]?.port || ''}
              onChange={handleInputChange('channels.0.port')}
              min={42000}
              max={62000}
              required
              error={validationErrors['channels.0.port'] || ''}
              helperText={validationErrors['channels.0.port'] || "Port for media channel (42000-62000)"}
            />

            <Dropdown
              id="codec"
              label="Codec"
              value={formData.channels?.[0]?.codec || ''}
              onChange={handleInputChange('channels.0.codec')}
              options={[
                { value: 'PCMU', label: 'PCMU (G.711 μ-law)' },
                { value: 'PCMA', label: 'PCMA (G.711 A-law)' },
                { value: 'G729', label: 'G.729' },
                { value: 'DEFAULT', label: 'Default' },
              ]}
              required
              helperText="Audio codec to use"
            />

            <NumberInput
              id="payloadType"
              label="Payload Type"
              value={formData.channels?.[0]?.payloadType || ''}
              onChange={handleInputChange('channels.0.payloadType')}
              min={0}
              max={127}
              required
              helperText="RTP payload type"
            />

            <NumberInput
              id="rtpDurationMs"
              label="RTP Duration (ms)"
              value={formData.rtpDurationMs || ''}
              onChange={handleInputChange('rtpDurationMs')}
              placeholder="30000"
              helperText="Duration of RTP streaming in milliseconds"
            />

            <Box sx={{ gridColumn: '1 / -1' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoStartRtp}
                    onChange={(e) => handleInputChange('autoStartRtp')(e.target.checked)}
                  />
                }
                label="Auto Start RTP"
              />
            </Box>
          </>
        );

      default:
        return (
          <Alert severity="error">
            Unknown function: {functionId}
          </Alert>
        );
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
        >
          Back to Functions
        </Button>
        <Typography variant="h4" component="h1">
          {getFunctionTitle()}
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" component="h2">
            Media Tester Configuration
          </Typography>
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
            {renderFormFields()}
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {authState.isAuthenticated
                ? 'Ready to send test requests'
                : 'Authentication will be requested when you start the test'
              }
            </Typography>

            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              disabled={isLoading || Object.values(validationErrors).some(error => error)}
              sx={{ minWidth: 150 }}
            >
              {isLoading ? 'Sending...' : 'Send Request'}
            </Button>
          </Box>
        </form>

        <ColoredJsonViewer
          response={result}
          error={error}
          onBack={() => {
            setResult(null);
            setError(null);
          }}
          title="Media Tester Response"
        />
      </Paper>

      <AuthDialog
        open={isAuthDialogOpen}
        onClose={closeAuthDialog}
        onSuccess={handleAuthSuccess}
        title="Authentication Required for Media Testing"
        message="Please sign in to send Media test requests to the MS-Tester service."
      />
    </Box>
  );
};
