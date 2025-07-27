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
import { TextInput, Dropdown, NumberInput } from '../../common';
import { AuthDialog } from '../../auth';
import { ColoredJsonViewer } from '../../response';
import { SipComparatorEditor } from '../sip/SipComparatorEditor';
import { useAuthenticatedRequest } from '../../../hooks/useAuthenticatedRequest';
import { useAuth } from '../../../hooks/useAuth';
import { useTester } from '../../../contexts/TesterContext';
import { mediaTesterService, setMediaTesterAddFunction, setMediaTesterRemoveFunction, setMediaTesterAddDialogIdFunction } from '../../../services/mediaTesterService';
import type { TesterRole, TransportProtocol, MediaSourceType, MediaCodec, ChannelType } from '../../../types';

interface MediaTestFormProps {
  functionId?: string;
  onTestComplete?: (result: any) => void;
  onBack?: () => void;
}

interface MediaFormData {
  // Common fields
  requestId?: string;
  mediaTesterId?: string;
  testerId?: string; // For RTP-style queries
  dialogId?: string;
  timeout?: number;
  sipComparator?: any;

  // Create media tester fields
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
  rtpSendingPorts?: number[];
  rtpReceivingPorts?: number[];
  streamsDuration?: string;
  channelSsrcs?: number[];
  sipSessionExpiration?: number | null;
  isGlobalIpReceiver?: boolean;
  isLocalRun?: boolean;

  // Send invite fields
  destinationAddress?: {
    ip: string;
    port: number;
    transportProtocol: TransportProtocol;
    alias?: string;
  };
  fromUri?: string;
  channelType?: ChannelType;
  autoStartRtp?: boolean;
  rtpDurationMs?: number;
  customHeaders?: Record<string, string>;

  // SDP configuration (from SIP tester)
  sdp?: {
    sessionVersion: number;
    sessionName: string;
    sessionInformation?: string;
    origin: {
      userName: string;
      sessionId: string;
      sessionVersion: number;
      networkType: 'IN';
      addressType: 'IP4' | 'IP6';
      ip: string;
    };
    connection: {
      networkType: 'IN';
      addressType: 'IP4' | 'IP6';
      ip: string;
    };
    timing: {
      startTime: number;
      stopTime: number;
    };
    channels: Array<{
      mediaType: string;
      port: number;
      transportProtocol?: string;
      connectionAddress?: string;
      bandwidthType?: string;
      bandwidth?: number;
      label?: string;
      packetTime?: number;
      maxPacketTime?: number;
      channelState: 'SEND' | 'RECEIVE' | 'SEND_AND_RECEIVE' | 'INACTIVE';
      attributes?: Record<string, any>;
    }>;
  };

  // RTP query fields
  interactionKey?: string;
  ssrc?: number[];
}

export const MediaTestForm: React.FC<MediaTestFormProps> = ({ functionId = 'create-media-tester', onTestComplete, onBack }) => {
  const [formData, setFormData] = useState<MediaFormData>(() => {
    switch (functionId) {
      case 'remove-media-tester':
        return {
          requestId: '',
          mediaTesterId: '',
        };

      case 'send-invite':
        return {
          mediaTesterId: '',
          destinationAddress: {
            ip: '127.0.0.1',
            port: 62000,
            transportProtocol: 'UDP' as TransportProtocol,
            alias: '',
          },
          fromUri: 'sip:media-tester@localhost',
          channelType: 'MONO' as ChannelType,
          autoStartRtp: true,
          rtpDurationMs: 30000,
          customHeaders: {},
          sdp: {
            sessionVersion: 1,
            sessionName: 'Media Test Session',
            sessionInformation: '',
            origin: {
              userName: 'media-test',
              sessionId: Date.now().toString(),
              sessionVersion: 1,
              networkType: 'IN' as const,
              addressType: 'IP4' as const,
              ip: '127.0.0.1',
            },
            connection: {
              networkType: 'IN' as const,
              addressType: 'IP4' as const,
              ip: '127.0.0.1',
            },
            timing: {
              startTime: 0,
              stopTime: 0,
            },
            channels: [{
              mediaType: 'AUDIO',
              port: 62000,
              transportProtocol: 'RTP_AVP',
              connectionAddress: '',
              label: '',
              packetTime: 20,
              maxPacketTime: 20,
              channelState: 'SEND_AND_RECEIVE',
              attributes: {},
            }],
          },
        };

      case 'send-bye':
        return {
          mediaTesterId: '',
          dialogId: '',
        };

      case 'get-dialog-details':
        return {
          testerId: '',
          dialogId: '',
        };

      case 'got-incoming-requests':
      case 'got-incoming-responses':
      case 'sent-outgoing-requests':
      case 'sent-outgoing-responses':
        return {
          testerId: '',
          dialogId: '',
          timeout: 5000,
          sipComparator: {},
        };

      case 'resolve-receiver-query':
      case 'resolve-sender-query':
        return {
          testerId: '',
          interactionKey: '',
          ssrc: [],
        };

      default: // create-media-tester
        return {
          requestId: '',
          testerKeyName: 'media-tester-default',
          testerRole: 'DEFAULT_CLIENT' as TesterRole,
          ip: '127.0.0.1',
          port: 5060,
          transportProtocol: 'UDP' as TransportProtocol,
          alias: 'media-alias',
          mediaSourceType: 'SIP' as MediaSourceType,
          unsupportedCodecs: [] as MediaCodec[],
          saveDialog: true,
          isStateless: false,
          imrRequesterId: null,
          rtpSendingPorts: [62000, 62002],
          rtpReceivingPorts: [62000, 62002],
          streamsDuration: 'PT30S',
          channelSsrcs: [],
          sipSessionExpiration: null,
          isGlobalIpReceiver: false,
          isLocalRun: false,
        };
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { state: authState } = useAuth();
  const { addTester, removeTesterByTesterId, addDialogId } = useTester();
  const { isAuthDialogOpen, closeAuthDialog, executeWithAuth } = useAuthenticatedRequest();

  const getFunctionTitle = () => {
    switch (functionId) {
      case 'remove-media-tester': return 'Remove Media Tester';
      case 'send-invite': return 'Send Media INVITE';
      case 'send-bye': return 'Send Media BYE';
      case 'get-dialog-details': return 'Get Dialog Details';
      case 'got-incoming-requests': return 'Query Incoming Requests';
      case 'got-incoming-responses': return 'Query Incoming Responses';
      case 'sent-outgoing-requests': return 'Query Sent Requests';
      case 'sent-outgoing-responses': return 'Query Sent Responses';
      case 'resolve-receiver-query': return 'Resolve Receiver Query';
      case 'resolve-sender-query': return 'Resolve Sender Query';
      default: return 'Media Tester Configuration';
    }
  };

  // Initialize media tester service with context functions
  useEffect(() => {
    setMediaTesterAddFunction(addTester);
    setMediaTesterRemoveFunction(removeTesterByTesterId);
    setMediaTesterAddDialogIdFunction(addDialogId);
  }, [addTester, removeTesterByTesterId, addDialogId]);

  // Port validation function
  const validatePort = (port: number): string | null => {
    if (port < 42000 || port > 62000) {
      return 'Port must be between 42000-62000';
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
      [field]: field === 'sipSessionExpiration' || field === 'imrRequesterId'
        ? (value === '' || value === null || value === undefined ? null : Number(value))
        : value
    }));
  };

  const handleSipComparatorChange = (value: any) => {
    setFormData(prev => ({
      ...prev,
      sipComparator: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // // Check for validation errors
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
        if (functionId === 'remove-media-tester') {
          if (!formData.requestId?.trim()) {
            throw new Error('Request ID is required');
          }
          if (!formData.mediaTesterId?.trim()) {
            throw new Error('Media Tester ID is required');
          }

          return await mediaTesterService.removeMediaTester({
            requestId: formData.requestId.trim(),
            mediaTesterId: formData.mediaTesterId.trim(),
          });

        } else if (functionId === 'send-invite') {
          if (!formData.mediaTesterId?.trim()) {
            throw new Error('Media Tester ID is required');
          }
          if (!formData.destinationAddress?.ip?.trim()) {
            throw new Error('Destination IP is required');
          }

          return await mediaTesterService.sendInvite({
            mediaTesterId: formData.mediaTesterId.trim(),
            destinationUri: `sip:${formData.destinationAddress.ip}:${formData.destinationAddress.port}`,
            fromUri: formData.fromUri || 'sip:media-tester@localhost',
            mediaConfig: {
              channelType: formData.channelType || 'MONO',
              channels: formData.sdp?.channels?.map(ch => ({
                mediaType: ch.mediaType.toLowerCase(),
                port: ch.port,
                codec: 'PCMU' as MediaCodec,
                payloadType: 0,
              })) || [],
              autoStartRtp: formData.autoStartRtp,
              rtpDurationMs: formData.rtpDurationMs,
            },
            customHeaders: formData.customHeaders,
          });

        } else if (functionId === 'send-bye') {
          if (!formData.mediaTesterId?.trim()) {
            throw new Error('Media Tester ID is required');
          }
          if (!formData.dialogId?.trim()) {
            throw new Error('Dialog ID is required');
          }

          return await mediaTesterService.sendBye({
            testerId: formData.mediaTesterId.trim(),
            dialogId: formData.dialogId.trim(),
          });

        } else if (functionId === 'get-dialog-details') {
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.dialogId?.trim()) {
            throw new Error('Dialog ID is required');
          }

          return await mediaTesterService.getDialogDetails({
            testerId: formData.testerId.trim(),
            dialogId: formData.dialogId.trim(),
          });

        } else if (functionId === 'got-incoming-requests') {
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.dialogId?.trim()) {
            throw new Error('Dialog ID is required');
          }

          return await mediaTesterService.gotIncomingRequests({
            sipQueryRequests: [{
              testerId: formData.testerId.trim(),
              dialogId: formData.dialogId.trim(),
              sipComparator: formData.sipComparator || {},
              timeout: formData.timeout || 5000,
            }]
          });

        } else if (functionId === 'got-incoming-responses') {
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.dialogId?.trim()) {
            throw new Error('Dialog ID is required');
          }

          return await mediaTesterService.gotIncomingResponses({
            sipQueryRequests: [{
              testerId: formData.testerId.trim(),
              dialogId: formData.dialogId.trim(),
              sipComparator: formData.sipComparator || {},
              timeout: formData.timeout || 5000,
            }]
          });

        } else if (functionId === 'sent-outgoing-requests') {
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.dialogId?.trim()) {
            throw new Error('Dialog ID is required');
          }

          return await mediaTesterService.sentOutgoingRequests({
            sipQueryRequests: [{
              testerId: formData.testerId.trim(),
              dialogId: formData.dialogId.trim(),
              sipComparator: formData.sipComparator || {},
              timeout: formData.timeout || 5000,
            }]
          });

        } else if (functionId === 'sent-outgoing-responses') {
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.dialogId?.trim()) {
            throw new Error('Dialog ID is required');
          }

          return await mediaTesterService.sentOutgoingResponses({
            sipQueryRequests: [{
              testerId: formData.testerId.trim(),
              dialogId: formData.dialogId.trim(),
              sipComparator: formData.sipComparator || {},
              timeout: formData.timeout || 5000,
            }]
          });

        } else if (functionId === 'resolve-receiver-query') {
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.interactionKey?.trim()) {
            throw new Error('Interaction Key is required');
          }

          return await mediaTesterService.resolveReceiverQuery({
            rtpTesterId: formData.testerId.trim(),
            interactionKey: formData.interactionKey.trim(),
            ssrc: formData.ssrc?.[0] || 0,
            rtpQuery: 'IS_SAME_SSRC',
            timeoutMs: 5000,
          });

        } else if (functionId === 'resolve-sender-query') {
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.interactionKey?.trim()) {
            throw new Error('Interaction Key is required');
          }

          return await mediaTesterService.resolveSenderQuery({
            rtpTesterId: formData.testerId.trim(),
            interactionKey: formData.interactionKey.trim(),
            ssrc: formData.ssrc?.[0] || 0,
            rtpQuery: 'IS_SAME_SSRC',
            timeoutMs: 5000,
          });

        } else {
          // Create Media Tester
          if (!formData.requestId?.trim()) {
            throw new Error('Media Tester Request ID is required');
          }
          if (!formData.testerKeyName?.trim()) {
            throw new Error('Tester Key Name is required');
          }
          if (!formData.ip?.trim()) {
            throw new Error('IP Address is required');
          }
          if (!formData.alias?.trim()) {
            throw new Error('Alias is required');
          }

          const config = {
            sipTesterConfig: {
              testerKeyName: formData.testerKeyName.trim(),
              testerRole: formData.testerRole || 'DEFAULT_CLIENT',
              listeningAddress: {
                ip: formData.ip.trim(),
                port: formData.port || 5060,
                transportProtocol: formData.transportProtocol || 'UDP',
                alias: formData.alias.trim(),
              },
              mediaSourceType: formData.mediaSourceType || 'SIP',
              unsupportedCodecs: formData.unsupportedCodecs || [],
              saveDialog: true,
              isStateless: formData.isStateless || false,
              imrRequesterId: formData.imrRequesterId || undefined,
            },
            rtpSendingPorts: formData.rtpSendingPorts || [],
            rtpReceivingPorts: formData.rtpReceivingPorts || [],
            streamsDuration: formData.streamsDuration || 'PT30S',
            channelSsrcs: formData.channelSsrcs || [],
            sipSessionExpiration: formData.sipSessionExpiration || undefined,
            isGlobalIpReceiver: formData.isGlobalIpReceiver || false,
            isLocalRun: formData.isLocalRun || false,
          };

          return await mediaTesterService.createMediaTester({
            requestId: formData.requestId.trim(),
            config,
          });
        }
      });

      if (testResult) {
        setResult(testResult);
        onTestComplete?.(testResult);
      }

    } catch (error: any) {
      console.error('Media Test Form Error:', error);
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
              {getFunctionTitle()}
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
            {/* Common form sections based on function type */}
            {functionId === 'remove-media-tester' && (
              <>
                <TextInput
                  id="requestId"
                  label="Request ID"
                  value={formData.requestId || ''}
                  onChange={handleInputChange('requestId')}
                  placeholder="Enter request ID"
                  helperText="Unique identifier for this request"
                  required
                />

                <TextInput
                  id="mediaTesterId"
                  label="Media Tester ID"
                  value={formData.mediaTesterId || ''}
                  onChange={handleInputChange('mediaTesterId')}
                  placeholder="Enter Media Tester ID"
                  helperText="UUID of the media tester to remove"
                  required
                />
              </>
            )}

            {functionId === 'send-invite' && (
              <>
                <TextInput
                  id="mediaTesterId"
                  label="Media Tester ID"
                  value={formData.mediaTesterId || ''}
                  onChange={handleInputChange('mediaTesterId')}
                  placeholder="Enter Media Tester ID"
                  helperText="UUID of the media tester"
                  required
                />

                <TextInput
                  id="fromUri"
                  label="From URI"
                  value={formData.fromUri || ''}
                  onChange={handleInputChange('fromUri')}
                  placeholder="sip:media-tester@localhost"
                  helperText="SIP From URI"
                  required
                />

                <Typography variant="h6" sx={{ gridColumn: '1 / -1', mt: 2, mb: 1 }}>
                  Destination Address
                </Typography>

                <TextInput
                  id="destinationIp"
                  label="Destination IP"
                  value={formData.destinationAddress?.ip || ''}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    destinationAddress: {
                      ...prev.destinationAddress!,
                      ip: value
                    }
                  }))}
                  placeholder="192.168.1.100"
                  helperText="IP address of the destination"
                  required
                />

                <NumberInput
                  id="destinationPort"
                  label="Destination Port"
                  value={formData.destinationAddress?.port || 5060}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    destinationAddress: {
                      ...prev.destinationAddress!,
                      port: Number(value)
                    }
                  }))}
                  min={5000}
                  max={6000}
                  helperText="Port number of the destination"
                  required
                />

                <Typography variant="h6" sx={{ gridColumn: '1 / -1', mt: 2, mb: 1 }}>
                  Media Configuration
                </Typography>

                <Dropdown
                  id="channelType"
                  label="Channel Type"
                  value={formData.channelType || 'MONO'}
                  onChange={handleInputChange('channelType')}
                  options={[
                    { value: 'MONO', label: 'Mono' },
                    { value: 'STEREO', label: 'Stereo' },
                  ]}
                  helperText="Audio channel configuration"
                  required
                />

                <NumberInput
                  id="rtpDurationMs"
                  label="RTP Duration (ms)"
                  value={formData.rtpDurationMs || 30000}
                  onChange={handleInputChange('rtpDurationMs')}
                  helperText="Duration for RTP streaming in milliseconds"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.autoStartRtp || false}
                      onChange={(e) => handleInputChange('autoStartRtp')(e.target.checked)}
                    />
                  }
                  label="Auto Start RTP"
                  sx={{ gridColumn: '1 / -1' }}
                />
              </>
            )}

            {functionId === 'send-bye' && (
              <>
                <TextInput
                  id="mediaTesterId"
                  label="Media Tester ID"
                  value={formData.mediaTesterId || ''}
                  onChange={handleInputChange('mediaTesterId')}
                  placeholder="Enter Media Tester ID"
                  helperText="UUID of the media tester"
                  required
                />

                <TextInput
                  id="dialogId"
                  label="Dialog ID"
                  value={formData.dialogId || ''}
                  onChange={handleInputChange('dialogId')}
                  placeholder="Enter Dialog ID"
                  helperText="Identifier of the SIP dialog"
                  required
                />
              </>
            )}

            {(functionId === 'got-incoming-requests' || functionId === 'got-incoming-responses' ||
              functionId === 'sent-outgoing-requests' || functionId === 'sent-outgoing-responses') && (
              <>
                <TextInput
                  id="testerId"
                  label="Tester ID"
                  value={formData.testerId || ''}
                  onChange={handleInputChange('testerId')}
                  placeholder="Enter Tester ID (UUID)"
                  helperText="UUID of the tester"
                  required
                />

                <TextInput
                  id="dialogId"
                  label="Dialog ID"
                  value={formData.dialogId || ''}
                  onChange={handleInputChange('dialogId')}
                  placeholder="Enter Dialog ID"
                  helperText="Identifier of the SIP dialog"
                  required
                />

                <NumberInput
                  id="timeout"
                  label="Timeout (ms)"
                  value={formData.timeout || 5000}
                  onChange={handleInputChange('timeout')}
                  helperText="Query timeout in milliseconds"
                  required
                />

                <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    SIP Comparator Configuration
                  </Typography>

                  <SipComparatorEditor
                    value={formData.sipComparator || {}}
                    onChange={handleSipComparatorChange}
                  />
                </Box>
              </>
            )}

            {(functionId === 'resolve-receiver-query' || functionId === 'resolve-sender-query') && (
              <>
                <TextInput
                  id="testerId"
                  label="Tester ID"
                  value={formData.testerId || ''}
                  onChange={handleInputChange('testerId')}
                  placeholder="Enter Tester ID (UUID)"
                  helperText="UUID of the RTP tester"
                  required
                />

                <TextInput
                  id="interactionKey"
                  label="Interaction Key"
                  value={formData.interactionKey || ''}
                  onChange={handleInputChange('interactionKey')}
                  placeholder="Enter interaction key"
                  helperText="Interaction key for the RTP session"
                  required
                />

                <TextInput
                  id="ssrc"
                  label="SSRC (Optional)"
                  value={formData.ssrc?.join(',') || ''}
                  onChange={(value) => {
                    const ssrcArray = value ? value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : [];
                    handleInputChange('ssrc')(ssrcArray);
                  }}
                  placeholder="12345,67890"
                  helperText="Comma-separated list of SSRC values"
                />
              </>
            )}

            {functionId === 'get-dialog-details' && (
              <>
                <TextInput
                  id="testerId"
                  label="Tester ID"
                  value={formData.testerId || ''}
                  onChange={handleInputChange('testerId')}
                  placeholder="Enter Tester ID (UUID)"
                  helperText="UUID of the tester"
                  required
                />

                <TextInput
                  id="dialogId"
                  label="Dialog ID"
                  value={formData.dialogId || ''}
                  onChange={handleInputChange('dialogId')}
                  placeholder="Enter Dialog ID"
                  helperText="Identifier of the SIP dialog"
                  required
                />
              </>
            )}

            {functionId === 'create-media-tester' && (
              <>
                <TextInput
                  id="requestId"
                  label="Media Tester Request ID"
                  value={formData.requestId || ''}
                  onChange={handleInputChange('requestId')}
                  placeholder="Enter request ID"
                  helperText="Unique identifier for this media tester"
                  required
                />

                <TextInput
                  id="testerKeyName"
                  label="Tester Key Name"
                  value={formData.testerKeyName || ''}
                  onChange={handleInputChange('testerKeyName')}
                  placeholder="media-tester-key"
                  helperText="Unique key name for the tester"
                  required
                />

                <Dropdown
                  id="testerRole"
                  label="Tester Role"
                  value={formData.testerRole || 'DEFAULT_CLIENT'}
                  onChange={handleInputChange('testerRole')}
                  options={[
                    { value: 'DEFAULT_CLIENT', label: 'Default Client' },
                    { value: 'DEFAULT_SERVER', label: 'Default Server' },
                  ]}
                  helperText="Role of the media tester"
                  required
                />

                <TextInput
                  id="ip"
                  label="IP Address"
                  value={formData.ip || ''}
                  onChange={handleInputChange('ip')}
                  placeholder="127.0.0.1"
                  helperText="IP address for the media tester"
                  required
                />

                <NumberInput
                  id="port"
                  label="Port"
                  value={formData.port || 5060}
                  onChange={handleInputChange('port')}
                  min={5000}
                  max={6000}
                  helperText="listening port number (SIP)"
                  required
                />

                <TextInput
                  id="alias"
                  label="Alias"
                  value={formData.alias || ''}
                  onChange={handleInputChange('alias')}
                  placeholder="media-tester-alias"
                  helperText="Alias for the communication address"
                  required
                />

                <TextInput
                  id="rtpSendingPorts"
                  label="RTP Sending Ports"
                  value={formData.rtpSendingPorts?.join(',') || ''}
                  onChange={(value) => {
                    const ports = value ? value.split(',').map(p => parseInt(p.trim())).filter(n => !isNaN(n)) : [];
                    handleInputChange('rtpSendingPorts')(ports);
                  }}
                  placeholder="62000,62002"
                  helperText="Comma-separated list of RTP sending ports"
                  required
                />

                <TextInput
                  id="rtpReceivingPorts"
                  label="RTP Receiving Ports"
                  value={formData.rtpReceivingPorts?.join(',') || ''}
                  onChange={(value) => {
                    const ports = value ? value.split(',').map(p => parseInt(p.trim())).filter(n => !isNaN(n)) : [];
                    handleInputChange('rtpReceivingPorts')(ports);
                  }}
                  placeholder="62000,62002"
                  helperText="Comma-separated list of RTP receiving ports"
                  required
                />

                <TextInput
                  id="streamsDuration"
                  label="Streams Duration"
                  value={formData.streamsDuration || ''}
                  onChange={handleInputChange('streamsDuration')}
                  placeholder="PT30S"
                  helperText="Duration in ISO 8601 format (e.g., PT30S for 30 seconds)"
                />

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Configuration Options
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
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
                          checked={formData.isGlobalIpReceiver || false}
                          onChange={(e) => handleInputChange('isGlobalIpReceiver')(e.target.checked)}
                        />
                      }
                      label="Global IP Receiver"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isLocalRun || false}
                          onChange={(e) => handleInputChange('isLocalRun')(e.target.checked)}
                        />
                      }
                      label="Local Run"
                    />
                  </Box>
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {authState.isAuthenticated
                ? 'Ready to send media tester requests'
                : 'Authentication will be requested when you start the test'
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
              {isLoading ? 'Sending...' : 'Send Request'}
            </Button>
          </Box>
        </form>

        <ColoredJsonViewer
          response={result}
          error={error}
          onBack={onBack}
          title="Media Tester Response"
        />
      </Paper>

      <AuthDialog
        open={isAuthDialogOpen}
        onClose={closeAuthDialog}
        onSuccess={handleAuthSuccess}
        title="Authentication Required for Media Testing"
        message="Please sign in to send media test requests to the MS-Tester service."
      />
    </Box>
  );
};
