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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Send as SendIcon, Security as SecurityIcon, ArrowBack as ArrowBackIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { TextInput, Dropdown, NumberInput, MultiSelect } from '../../common';
import { AuthDialog } from '../../auth';
import { ColoredJsonViewer } from '../../response';
import { SipComparatorEditor } from './SipComparatorEditor';
import { useAuthenticatedRequest } from '../../../hooks/useAuthenticatedRequest';
import { useAuth } from '../../../hooks/useAuth';
import { useTester } from '../../../contexts/TesterContext';
import { sipTesterService, setSipTesterAddFunction, setSipTesterRemoveFunction, setSipTesterAddDialogIdFunction } from '../../../services/sipTesterService';
import type { TesterRole, TransportProtocol, MediaSourceType, MediaCodec } from '../../../types';

interface SipTestFormProps {
  functionId?: string;
  onTestComplete?: (result: any) => void;
  onBack?: () => void;
}

interface SipFormData {
  // Common fields
  requestId: string;
  testerId?: string;  // Changed back to testerId
  interactionKey?: string;

  // Create tester specific fields
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

  // Dialog details specific fields
  dialogId?: string;  // For get-dialog-details function

  // SIP Query specific fields
  timeout?: number;
  sipComparator?: {
    [key: string]: any; // Dynamic fields based on checkboxes
  };

  // Send Invite specific fields
  destinationAddress?: {
    ip: string;
    port: number;
    transportProtocol: TransportProtocol;
    alias?: string;
  };
  customHeaders?: Record<string, string>;
  sendInviteWithSdp?: boolean;
  sdp?: {
    sessionVersion: number;
    origin: {
      userName: string;
      sessionId: string;
      sessionVersion: number;
      networkType: 'IN';
      addressType: 'IP4' | 'IP6';
      ip: string;
    };
    sessionName: string;
    sessionInformation?: string;
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
      transportProtocol: string;
      connectionAddress?: string;
      label?: string;
      packetTime?: number;
      maxPacketTime?: number;
      channelState?: 'SEND' | 'RECEIVE' | 'SEND_AND_RECEIVE' | 'INACTIVE';
      attributes?: Record<string, string>;
    }>;
  };
}

export const SipTestForm: React.FC<SipTestFormProps> = ({ functionId = 'create-tester', onTestComplete, onBack }) => {
  const [formData, setFormData] = useState<SipFormData>(() => {
    switch (functionId) {
      case 'remove-tester':
        return {
          requestId: '',
          testerId: '',
        };
      case 'send-invite':
        return {
          requestId: '',
          testerId: '',
          sendInviteWithSdp: true,
          destinationAddress: {
            ip: '',
            port: 62000,
            transportProtocol: 'UDP' as TransportProtocol,
            alias: '',
          },
          customHeaders: {},
          sdp: {
            sessionVersion: 1,
            origin: {
              userName: 'test',
              sessionId: '1234567890',
              sessionVersion: 1,
              networkType: 'IN' as const,
              addressType: 'IP4' as const,
              ip: '127.0.0.1',
            },
            sessionName: 'Test Session',
            sessionInformation: '',
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
      case 'get-dialog-details':
        return {
          requestId: '',
          testerId: '',
          dialogId: '',
        };
      case 'got-incoming-requests':
      case 'got-incoming-responses':
      case 'sent-outgoing-requests':
      case 'sent-outgoing-responses':
        return {
          requestId: '',
          testerId: '',
          dialogId: '',
          timeout: 5,
          sipComparator: {},
        };
      default: // create-tester
        return {
          // CreateSipTesterRequest fields
          requestId: '',
          useDefaultHandlers: true,
          customSessionExpiration: null,

          // SipTesterConfig fields
          testerKeyName: 'sip-tester-default',
          testerRole: 'AVAYA_SBC' as TesterRole,

          // CommunicationAddress fields
          ip: '127.0.0.1',
          port: 5060,
          transportProtocol: 'UDP' as TransportProtocol,
          alias: `default-alias-${new Date().toISOString().replace(/[:.-]/g, '').slice(0, 15)}`,

          // Additional SipTesterConfig fields
          mediaSourceType: 'SIP' as MediaSourceType,
          unsupportedCodecs: [] as MediaCodec[],
          saveDialog: true,
          isStateless: false,
          imrRequesterId: null,
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
      case 'create-tester': return 'Create SIP Tester';
      case 'remove-tester': return 'Remove SIP Tester';
      case 'send-invite': return 'Send SIP INVITE';
      case 'get-dialog-details': return 'Get Dialog Details';
      case 'got-incoming-requests': return 'Query Incoming Requests';
      case 'got-incoming-responses': return 'Query Incoming Responses';
      case 'sent-outgoing-requests': return 'Query Sent Requests';
      case 'sent-outgoing-responses': return 'Query Sent Responses';
      default: return 'SIP Tester Configuration';
    }
  };

  // Initialize SIP service with addTester function
  useEffect(() => {
    console.log('SipTestForm useEffect running - setting up functions');
    console.log('addTester:', !!addTester);
    console.log('addDialogId:', !!addDialogId);
    setSipTesterAddFunction(addTester);
    setSipTesterRemoveFunction(removeTesterByTesterId);
    setSipTesterAddDialogIdFunction(addDialogId);
    console.log('SipTestForm: All functions set');
  }, [addTester, removeTesterByTesterId, addDialogId]);

  // Port validation function
  const validatePort = (port: number): string | null => {
    if (port < 42000 || port > 62000) {
      return 'SIP port must be between 42000-62000';
    }
    return null;
  };

  // Media channel port validation function
  const validateMediaPort = (port: number): string | null => {
    if (port < 42000 || port > 62000) {
      return 'Media port must be between 42000-62000';
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

  const handleSipComparatorChange = (value: any) => {
    setFormData(prev => ({
      ...prev,
      sipComparator: value
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

    // Additional validation for send-invite function
    if (functionId === 'send-invite') {
      // Validate destination port
      if (formData.destinationAddress?.port) {
        const destPortError = validatePort(formData.destinationAddress.port);
        if (destPortError) {
          setError(`Destination ${destPortError}`);
          return;
        }
      }

      // Validate media channel ports
      if (formData.sdp?.channels) {
        for (let i = 0; i < formData.sdp.channels.length; i++) {
          const channel = formData.sdp.channels[i];
          if (channel.port) {
            const mediaPortError = validateMediaPort(channel.port);
            if (mediaPortError) {
              setError(`Channel ${i + 1}: ${mediaPortError}`);
              return;
            }
          }
        }
      }
    }

    setIsLoading(true);
    setError(null);
    setResult(null); // Clear previous result

    try {
      const testResult = await executeWithAuth(async () => {
        if (functionId === 'remove-tester') {
          // Remove SIP Tester
          if (!formData.requestId?.trim()) {
            throw new Error('Request ID is required');
          }
          if (!formData.testerId?.trim()) {
            throw new Error('SIP Tester ID is required');
          }

          const response = await sipTesterService.removeSipTester({
            requestId: formData.requestId.trim(),
            sipTesterId: formData.testerId.trim()
          });

          return response;
        } else if (functionId === 'send-invite') {
          // Send INVITE
          if (!formData.testerId?.trim()) {
            throw new Error('SIP Tester ID is required');
          }
          if (!formData.destinationAddress?.ip?.trim()) {
            throw new Error('Destination IP is required');
          }

          const requestData: any = {
            testerId: formData.testerId.trim(),
            destinationAddress: {
              ip: formData.destinationAddress.ip.trim(),
              port: formData.destinationAddress.port,
              transportProtocol: formData.destinationAddress.transportProtocol,
              alias: formData.destinationAddress.alias?.trim(),
            },
            customHeaders: formData.customHeaders || {},
          };

          if (formData.sendInviteWithSdp && formData.sdp) {
            requestData.sdp = formData.sdp;
          }

          const response = await sipTesterService.sendInvite(requestData);

          return response;
        } else if (functionId === 'get-dialog-details') {
          // Get Dialog Details
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.dialogId?.trim()) {
            throw new Error('Dialog ID is required');
          }

          const response = await sipTesterService.getDialogDetails({
            testerId: formData.testerId.trim(),
            dialogId: formData.dialogId.trim(),
          });

          return response;
        } else if (functionId === 'got-incoming-requests') {
          // Query Got Incoming Requests
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.dialogId?.trim()) {
            throw new Error('Dialog ID is required');
          }

          const response = await sipTesterService.gotIncomingRequests({
            sipQueryRequests: [
              {
                testerId: formData.testerId.trim(),
                dialogId: formData.dialogId.trim(),
                sipComparator: formData.sipComparator || {},
                timeout: formData.timeout || 5,
              }
            ]
          });

          return response;
        } else if (functionId === 'got-incoming-responses') {
          // Query Got Incoming Responses
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.dialogId?.trim()) {
            throw new Error('Dialog ID is required');
          }

          const response = await sipTesterService.gotIncomingResponses({
            sipQueryRequests: [
              {
                testerId: formData.testerId.trim(),
                dialogId: formData.dialogId.trim(),
                sipComparator: formData.sipComparator || {},
                timeout: formData.timeout || 5,
              }
            ]
          });

          return response;
        } else if (functionId === 'sent-outgoing-requests') {
          // Query Sent Outgoing Requests
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.dialogId?.trim()) {
            throw new Error('Dialog ID is required');
          }

          const response = await sipTesterService.sentOutgoingRequests({
            sipQueryRequests: [
              {
                testerId: formData.testerId.trim(),
                dialogId: formData.dialogId.trim(),
                sipComparator: formData.sipComparator || {},
                timeout: formData.timeout || 5,
              }
            ]
          });

          return response;
        } else if (functionId === 'sent-outgoing-responses') {
          // Query Sent Outgoing Responses
          if (!formData.testerId?.trim()) {
            throw new Error('Tester ID is required');
          }
          if (!formData.dialogId?.trim()) {
            throw new Error('Dialog ID is required');
          }

          const response = await sipTesterService.sentOutgoingResponses({
            sipQueryRequests: [
              {
                testerId: formData.testerId.trim(),
                dialogId: formData.dialogId.trim(),
                sipComparator: formData.sipComparator || {},
                timeout: formData.timeout || 5,
              }
            ]
          });

          return response;
      } else {
        // Create SIP Tester (existing logic)
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
      }
    });

    if (testResult) {
      setResult(testResult);
      onTestComplete?.(testResult);
    }

  } catch (error: any) {
    console.error('SIP Test Form Error:', error);
    // Display error in UI
    setError(error.message || 'An unexpected error occurred');
  } finally {
    setIsLoading(false);
  }
  };

  const handleAuthSuccess = () => {
    // Retry the request after successful authentication
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
            {functionId === 'remove-tester' && (
              <>
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
                  id="testerId"
                  label="SIP Tester ID"
                  value={formData.testerId || ''}
                  onChange={handleInputChange('testerId')}
                  placeholder="Enter SIP Tester ID"
                  helperText="UUID of the SIP tester to remove"
                  required
                />
              </>
            )}

            {functionId === 'send-invite' && (
              <>
                <TextInput
                  id="testerId"
                  label="SIP Tester ID"
                  value={formData.testerId || ''}
                  onChange={handleInputChange('testerId')}
                  placeholder="Enter SIP Tester ID"
                  helperText="UUID of the SIP tester"
                  required
                />

                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
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
                  helperText="Port number of the destination (5000-6000)"
                  required
                />

                <Dropdown
                  id="destinationTransportProtocol"
                  label="Transport Protocol"
                  value={formData.destinationAddress?.transportProtocol || 'UDP'}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    destinationAddress: {
                      ...prev.destinationAddress!,
                      transportProtocol: value as TransportProtocol
                    }
                  }))}
                  options={[
                    { value: 'UDP', label: 'UDP' },
                    { value: 'TCP', label: 'TCP' },
                    { value: 'TLS', label: 'TLS' },
                  ]}
                  required
                  helperText="Transport protocol for SIP communication"
                />

                <TextInput
                  id="destinationAlias"
                  label="Destination Alias (Optional)"
                  value={formData.destinationAddress?.alias || ''}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    destinationAddress: {
                      ...prev.destinationAddress!,
                      alias: value
                    }
                  }))}
                  placeholder="destination-alias"
                  helperText="Optional alias for the destination"
                />

                <Box sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6">
                    SDP Configuration
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.sendInviteWithSdp ?? true}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sendInviteWithSdp: e.target.checked
                        }))}
                        color="primary"
                      />
                    }
                    label="Send invite with SDP"
                    labelPlacement="start"
                  />
                </Box>

                {formData.sendInviteWithSdp && (
                  <>

                {/* Basic SDP Fields */}
                <NumberInput
                  id="sessionVersion"
                  label="Session Version"
                  value={formData.sdp?.sessionVersion || 1}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    sdp: {
                      ...prev.sdp!,
                      sessionVersion: Number(value)
                    }
                  }))}
                  min={0}
                  helperText="SDP session version"
                  required
                />

                <TextInput
                  id="sessionName"
                  label="Session Name"
                  value={formData.sdp?.sessionName || ''}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    sdp: {
                      ...prev.sdp!,
                      sessionName: value
                    }
                  }))}
                  placeholder="Test Session"
                  helperText="SDP session name"
                  required
                />

                <TextInput
                  id="sessionInformation"
                  label="Session Information (Optional)"
                  value={formData.sdp?.sessionInformation || ''}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    sdp: {
                      ...prev.sdp!,
                      sessionInformation: value
                    }
                  }))}
                  placeholder="Session description"
                  helperText="Optional session information"
                />

                {/* Origin Accordion */}
                <Accordion sx={{ mt: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Origin Configuration</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextInput
                        id="origin-username"
                        label="Username"
                        value={formData.sdp?.origin?.userName || ''}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            origin: {
                              ...prev.sdp!.origin,
                              userName: value
                            }
                          }
                        }))}
                        placeholder="test"
                        helperText="Origin username"
                        required
                      />

                      <TextInput
                        id="origin-sessionId"
                        label="Session ID"
                        value={formData.sdp?.origin?.sessionId || ''}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            origin: {
                              ...prev.sdp!.origin,
                              sessionId: value
                            }
                          }
                        }))}
                        placeholder="1234567890"
                        helperText="Unique session identifier"
                        required
                      />

                      <NumberInput
                        id="origin-sessionVersion"
                        label="Session Version"
                        value={formData.sdp?.origin?.sessionVersion || 1}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            origin: {
                              ...prev.sdp!.origin,
                              sessionVersion: Number(value)
                            }
                          }
                        }))}
                        min={1}
                        helperText="Origin session version"
                        required
                      />

                      <Dropdown
                        id="origin-networkType"
                        label="Network Type"
                        value={formData.sdp?.origin?.networkType || 'IN'}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            origin: {
                              ...prev.sdp!.origin,
                              networkType: value as 'IN'
                            }
                          }
                        }))}
                        options={[
                          { value: 'IN', label: 'Internet (IN)' }
                        ]}
                        required
                        helperText="Network type (typically IN for Internet)"
                      />

                      <Dropdown
                        id="origin-addressType"
                        label="Address Type"
                        value={formData.sdp?.origin?.addressType || 'IP4'}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            origin: {
                              ...prev.sdp!.origin,
                              addressType: value as 'IP4' | 'IP6'
                            }
                          }
                        }))}
                        options={[
                          { value: 'IP4', label: 'IPv4' },
                          { value: 'IP6', label: 'IPv6' }
                        ]}
                        required
                        helperText="IP address type"
                      />

                      <TextInput
                        id="origin-unicastAddress"
                        label="IP Address"
                        value={formData.sdp?.origin?.ip || ''}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            origin: {
                              ...prev.sdp!.origin,
                              ip: value
                            }
                          }
                        }))}
                        placeholder="127.0.0.1"
                        helperText="Origin IP address"
                        required
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Connection Accordion */}
                <Accordion sx={{ mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Connection Configuration</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Dropdown
                        id="connection-networkType"
                        label="Network Type"
                        value={formData.sdp?.connection?.networkType || 'IN'}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            connection: {
                              ...prev.sdp!.connection,
                              networkType: value as 'IN'
                            }
                          }
                        }))}
                        options={[
                          { value: 'IN', label: 'Internet (IN)' }
                        ]}
                        required
                        helperText="Network type (typically IN for Internet)"
                      />

                      <Dropdown
                        id="connection-addressType"
                        label="Address Type"
                        value={formData.sdp?.connection?.addressType || 'IP4'}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            connection: {
                              ...prev.sdp!.connection,
                              addressType: value as 'IP4' | 'IP6'
                            }
                          }
                        }))}
                        options={[
                          { value: 'IP4', label: 'IPv4' },
                          { value: 'IP6', label: 'IPv6' }
                        ]}
                        required
                        helperText="IP address type"
                      />

                      <TextInput
                        id="connection-ip"
                        label="Connection IP"
                        value={formData.sdp?.connection?.ip || ''}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            connection: {
                              ...prev.sdp!.connection,
                              ip: value
                            }
                          }
                        }))}
                        placeholder="127.0.0.1"
                        helperText="Connection IP address"
                        required
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Timing Accordion */}
                <Accordion sx={{ mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Timing Configuration</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <NumberInput
                        id="timing-startTime"
                        label="Start Time"
                        value={formData.sdp?.timing?.startTime || 0}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            timing: {
                              ...prev.sdp!.timing,
                              startTime: Number(value)
                            }
                          }
                        }))}
                        min={0}
                        helperText="Session start time (0 for immediate)"
                        required
                      />

                      <NumberInput
                        id="timing-stopTime"
                        label="Stop Time"
                        value={formData.sdp?.timing?.stopTime || 0}
                        onChange={(value) => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            timing: {
                              ...prev.sdp!.timing,
                              stopTime: Number(value)
                            }
                          }
                        }))}
                        min={0}
                        helperText="Session stop time (0 for unbounded)"
                        required
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Channels Accordion */}
                <Accordion sx={{ mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Media Channels Configuration</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {formData.sdp?.channels?.map((channel, index) => (
                        <Box key={index} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 2 }}>
                            Channel {index + 1}
                          </Typography>

                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                            <TextInput
                              id={`channel-${index}-mediaType`}
                              label="Media Type"
                              value={channel.mediaType || ''}
                              onChange={(value) => setFormData(prev => ({
                                ...prev,
                                sdp: {
                                  ...prev.sdp!,
                                  channels: prev.sdp!.channels.map((ch, i) =>
                                    i === index ? { ...ch, mediaType: value } : ch
                                  )
                                }
                              }))}
                              placeholder="AUDIO"
                              helperText="Media type (audio, video, etc.)"
                              required
                            />

                            <TextInput
                              id={`channel-${index}-port`}
                              label="Port"
                              value={channel.port?.toString() || '62000'}
                              onChange={(value) => {
                                // Allow any input while typing
                                if (value === '') {
                                  setFormData(prev => ({
                                    ...prev,
                                    sdp: {
                                      ...prev.sdp!,
                                      channels: prev.sdp!.channels.map((ch, i) =>
                                        i === index ? { ...ch, port: 62000 } : ch
                                      )
                                    }
                                  }));
                                  return;
                                }

                                // Allow numbers only
                                if (!/^\d+$/.test(value)) {
                                  return;
                                }

                                const numValue = parseInt(value, 10);
                                // Allow any valid number, validation will happen on submit
                                if (!isNaN(numValue)) {
                                  setFormData(prev => ({
                                    ...prev,
                                    sdp: {
                                      ...prev.sdp!,
                                      channels: prev.sdp!.channels.map((ch, i) =>
                                        i === index ? { ...ch, port: numValue } : ch
                                      )
                                    }
                                  }));
                                }
                              }}
                              helperText="Media port number (42000-62000)"
                              placeholder="62000"
                              required
                            />

                            <TextInput
                              id={`channel-${index}-transportProtocol`}
                              label="Transport Protocol"
                              value={channel.transportProtocol || ''}
                              onChange={(value) => setFormData(prev => ({
                                ...prev,
                                sdp: {
                                  ...prev.sdp!,
                                  channels: prev.sdp!.channels.map((ch, i) =>
                                    i === index ? { ...ch, protocol: value } : ch
                                  )
                                }
                              }))}
                              placeholder="RTP_AVP"
                              helperText="Transport protocol"
                              required
                            />

                            <TextInput
                              id={`channel-${index}-connectionAddress`}
                              label="Connection Address (Optional)"
                              value={channel.connectionAddress || ''}
                              onChange={(value) => setFormData(prev => ({
                                ...prev,
                                sdp: {
                                  ...prev.sdp!,
                                  channels: prev.sdp!.channels.map((ch, i) =>
                                    i === index ? { ...ch, connectionAddress: value } : ch
                                  )
                                }
                              }))}
                              placeholder="192.168.1.100"
                              helperText="Optional connection address override"
                            />

                            <TextInput
                              id={`channel-${index}-label`}
                              label="Label (Optional)"
                              value={channel.label || ''}
                              onChange={(value) => setFormData(prev => ({
                                ...prev,
                                sdp: {
                                  ...prev.sdp!,
                                  channels: prev.sdp!.channels.map((ch, i) =>
                                    i === index ? { ...ch, label: value } : ch
                                  )
                                }
                              }))}
                              placeholder="audio-main"
                              helperText="Channel label identifier"
                            />

                            <NumberInput
                              id={`channel-${index}-packetTime`}
                              label="Packet Time (ms)"
                              value={channel.packetTime || ''}
                              onChange={(value) => setFormData(prev => ({
                                ...prev,
                                sdp: {
                                  ...prev.sdp!,
                                  channels: prev.sdp!.channels.map((ch, i) =>
                                    i === index ? { ...ch, packetTime: value ? Number(value) : undefined } : ch
                                  )
                                }
                              }))}
                              helperText="Packet time in milliseconds"
                            />

                            <NumberInput
                              id={`channel-${index}-maxPacketTime`}
                              label="Max Packet Time (ms)"
                              value={channel.maxPacketTime || ''}
                              onChange={(value) => setFormData(prev => ({
                                ...prev,
                                sdp: {
                                  ...prev.sdp!,
                                  channels: prev.sdp!.channels.map((ch, i) =>
                                    i === index ? { ...ch, maxPacketTime: value ? Number(value) : undefined } : ch
                                  )
                                }
                              }))}
                              helperText="Maximum packet time in milliseconds"
                            />

                            <Dropdown
                              id={`channel-${index}-channelState`}
                              label="Channel State"
                              value={channel.channelState || 'SEND'}
                              onChange={(value) => setFormData(prev => ({
                                ...prev,
                                sdp: {
                                  ...prev.sdp!,
                                  channels: prev.sdp!.channels.map((ch, i) =>
                                    i === index ? { ...ch, channelState: value as 'SEND' | 'RECEIVE' | 'SEND_AND_RECEIVE' | 'INACTIVE' } : ch
                                  )
                                }
                              }))}
                              options={[
                                { value: 'SEND', label: 'Send Only (sendonly)' },
                                { value: 'RECEIVE', label: 'Receive Only (recvonly)' },
                                { value: 'SEND_AND_RECEIVE', label: 'Send and Receive (sendrecv)' },
                                { value: 'INACTIVE', label: 'Inactive (inactive)' }
                              ]}
                              helperText="Channel direction state"
                              required
                            />
                          </Box>

                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Attributes (Optional)
                            </Typography>
                            <TextInput
                              id={`channel-${index}-attributes`}
                              label="Attributes JSON"
                              value={JSON.stringify(channel.attributes || {})}
                              onChange={(value) => {
                                try {
                                  const attrs = JSON.parse(value || '{}');
                                  setFormData(prev => ({
                                    ...prev,
                                    sdp: {
                                      ...prev.sdp!,
                                      channels: prev.sdp!.channels.map((ch, i) =>
                                        i === index ? { ...ch, attributes: attrs } : ch
                                      )
                                    }
                                  }));
                                } catch (e) {
                                  // Invalid JSON, ignore
                                }
                              }}
                              placeholder='{"key": "value"}'
                              helperText="Channel attributes as JSON object"
                              multiline
                            />
                          </Box>

                          {formData.sdp!.channels.length > 1 && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              sx={{ mt: 2 }}
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                sdp: {
                                  ...prev.sdp!,
                                  channels: prev.sdp!.channels.filter((_, i) => i !== index)
                                }
                              }))}
                            >
                              Remove Channel
                            </Button>
                          )}
                        </Box>
                      ))}

                      <Button
                        variant="outlined"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          sdp: {
                            ...prev.sdp!,
                            channels: [
                              ...prev.sdp!.channels,
                              {
                                mediaType: 'AUDIO',
                                port: 62000,
                                transportProtocol: 'RTP_AVP',
                                connectionAddress: '',
                                label: '',
                                packetTime: 20,
                                maxPacketTime: 20,
                                channelState: 'SEND_AND_RECEIVE',
                                attributes: {},
                              }
                            ]
                          }
                        }))}
                      >
                        Add Channel
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
                  </>
                )}
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
                  label="Timeout (seconds)"
                  value={formData.timeout || 5}
                  onChange={handleInputChange('timeout')}
                  helperText="Query timeout in seconds"
                  required
                />

                <Box sx={{ gridColumn: { md: '1 / -1' } }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    SIP Comparator Configuration
                  </Typography>

                  <SipComparatorEditor
                    value={formData.sipComparator || {}}
                    onChange={handleSipComparatorChange}
                    queryType={
                      functionId === 'got-incoming-responses' || functionId === 'sent-outgoing-responses' 
                        ? 'response' 
                        : 'request'
                    }
                  />
                </Box>
              </>
            )}

            {functionId !== 'remove-tester' && functionId !== 'send-invite' && functionId !== 'get-dialog-details' &&
              functionId !== 'got-incoming-requests' && functionId !== 'got-incoming-responses' &&
              functionId !== 'sent-outgoing-requests' && functionId !== 'sent-outgoing-responses' && (
              <>
                <TextInput
                  id="requestId"
                  label="Request ID"
                  value={formData.requestId}
                  onChange={handleInputChange('requestId')}
                  placeholder="Auto-generated if empty"
                  helperText="Unique identifier for this request"
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
                />

                <TextInput
                  id="port"
                  label="Port"
                  value={formData.port?.toString() || ''}
                  onChange={(value) => {
                    // Allow any input while typing
                    if (value === '') {
                      handleInputChange('port')('');
                      return;
                    }

                    // Allow numbers only
                    if (!/^\d+$/.test(value)) {
                      return;
                    }

                    const numValue = parseInt(value, 10);
                    // Allow any valid number, validation will happen on submit
                    if (!isNaN(numValue)) {
                      handleInputChange('port')(numValue);
                    }
                  }}
                  required
                  helperText={validationErrors.port || "Enter port number between 42000-62000"}
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
                  helperText="Alias for the communication address"
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
                  </Box>
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {authState.isAuthenticated
                ? 'Ready to send get details requests'
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
          title="SIP Tester Response"
        />
      </Paper>

      <AuthDialog
        open={isAuthDialogOpen}
        onClose={closeAuthDialog}
        onSuccess={handleAuthSuccess}
        title="Authentication Required for SIP Testing"
        message="Please sign in to send SIP test requests to the MS-Tester service."
      />
    </Box>
  );
};
