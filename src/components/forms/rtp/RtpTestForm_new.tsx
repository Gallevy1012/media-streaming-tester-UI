import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import { Send as SendIcon, Security as SecurityIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { TextInput, Dropdown, NumberInput } from '../../common';
import { AuthDialog } from '../../auth';
import { ColoredJsonViewer } from '../../response';
import { useAuthenticatedRequest } from '../../../hooks/useAuthenticatedRequest';
import { useAuth } from '../../../hooks/useAuth';
import { useTester } from '../../../contexts/TesterContext';
import { rtpTesterService, setRtpTesterAddFunction, setRtpTesterRemoveFunction } from '../../../services/rtpTesterService';
import { useNavigate } from 'react-router-dom';
import type {
  StreamType,
  MediaCodec,
  TestStreamConfiguration,
  OpenReceivingPointsRequest,
  StartStreamRequest,
  TestUpdateSenderCommunicationConfiguration,
  RtpTesterQuery,
  ReceiverStatus
} from '../../../types';

interface RtpFormProps {
  functionId: string;
  onTestComplete?: (result: any) => void;
  onBack?: () => void;
}

interface RtpFormData {
  // Common fields
  interactionKey: string;
  rtpTesterId?: string;

  // Open Receiving Points fields
  ssrc1?: number;
  ssrc2?: number;
  packetCount?: number;

  // Start Stream fields
  testStreamConfigurations?: TestStreamConfiguration[];
  streamType?: StreamType;
  rtpCodec?: MediaCodec;
  intervalInMs?: number;

  // Update Sender Destination fields
  testCommunicationConfigurations?: TestUpdateSenderCommunicationConfiguration[];
  senderId?: string;

  // Query fields
  ssrc?: number;
  rtpQuery?: RtpTesterQuery;
  expectedValue?: number;
  receiverStatus?: ReceiverStatus;
  acceptedMismatchPercentage?: number;
  timeoutMs?: number;

  // Stream packets count fields
  ssrcs?: number[];
}

export const RtpTestForm: React.FC<RtpFormProps> = ({ functionId, onTestComplete, onBack }) => {
  const navigate = useNavigate();
  const { addTester, removeTesterByTesterId } = useTester();

  // Initialize the service-level addTester function
  useEffect(() => {
    setRtpTesterAddFunction(addTester);
    setRtpTesterRemoveFunction(removeTesterByTesterId);
  }, [addTester, removeTesterByTesterId]);
  const [formData, setFormData] = useState<RtpFormData>(() => {
    switch (functionId) {
      case 'open-receiving-points':
        return {
          ssrc1: undefined,
          ssrc2: undefined,
          packetCount: 1000,
          interactionKey: '',
        };
      case 'start-stream':
        return {
          testStreamConfigurations: [{
            ssrc: 12345,
            streamSize: '30', // Default 30 seconds as string
            sourcePort: 42000,
            targetIp: '',
            targetPort: 42002,
          }],
          streamType: 'MONO' as StreamType,
          rtpCodec: 'PCMU' as MediaCodec,
          interactionKey: '',
          intervalInMs: 1000,
        };
      case 'remove-rtp-tester':
        return {
          rtpTesterId: '',
          interactionKey: '',
        };
      case 'update-sender-destination':
        return {
          rtpTesterId: '',
          senderId: '',
          streamType: 'MONO' as StreamType,
          interactionKey: '',
          testCommunicationConfigurations: [{
            ssrc: 12345,
            sourcePort: 42000,
            targetIp: '',
            targetPort: 42002,
          }],
        };
      case 'resolve-receiver-query':
      case 'resolve-sender-query':
        return {
          rtpTesterId: '',
          ssrc: 12345,
          rtpQuery: 'NUM_OF_PACKETS' as RtpTesterQuery,
          timeoutMs: 5000,
          interactionKey: '',
        };
      case 'stream-packets-count':
        return {
          rtpTesterId: '',
          ssrcs: [12345],
          interactionKey: '',
        };
      default:
        return { interactionKey: '' };
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Port validation function for RTP streams
  const validateRtpPort = (port: number): string | null => {
    if (port < 42000 || port > 62000) {
      return 'RTP port must be between 42,000-62,000';
    }
    return null;
  };

  const { state: authState } = useAuth();
  const { isAuthDialogOpen, closeAuthDialog, executeWithAuth } = useAuthenticatedRequest();

  const handleInputChange = (field: string) => (value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value,
        },
      }));
    } else if (field === 'ssrcs') {
      // Handle SSRC array input for stream-packets-count
      const ssrcValues = value.split(',').map((v: string) => parseInt(v.trim())).filter((v: number) => !isNaN(v));
      setFormData(prev => ({ ...prev, [field]: ssrcValues }));
    } else if (field === 'ssrc1' || field === 'ssrc2') {
      // Handle individual SSRC inputs - convert to number
      const numValue = value === '' ? undefined : parseInt(value);
      setFormData(prev => ({ ...prev, [field]: numValue }));
    } else if (field === 'streamType') {
      // Handle stereo configuration - add second configuration if stereo
      if (value === 'STEREO' && formData.testStreamConfigurations && formData.testStreamConfigurations.length === 1) {
        const firstConfig = formData.testStreamConfigurations[0];
        setFormData(prev => ({
          ...prev,
          [field]: value,
          testStreamConfigurations: [
            firstConfig,
            {
              ssrc: 67890,
              streamSize: firstConfig.streamSize,
              sourcePort: firstConfig.sourcePort + 2,
              targetIp: firstConfig.targetIp,
              targetPort: firstConfig.targetPort + 2,
            }
          ]
        }));
      } else if (value === 'MONO' && formData.testStreamConfigurations && formData.testStreamConfigurations.length > 1) {
        // Remove second configuration if switching to mono
        setFormData(prev => ({
          ...prev,
          [field]: value,
          testStreamConfigurations: [formData.testStreamConfigurations![0]]
        }));
      } else {
        setFormData(prev => ({ ...prev, [field]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleStreamConfigChange = (index: number, field: string) => (value: any) => {
    setFormData(prev => ({
      ...prev,
      testStreamConfigurations: prev.testStreamConfigurations?.map((config, i) =>
        i === index ? { ...config, [field]: value } : config
      ) || []
    }));
  };

  const handleCommConfigChange = (index: number, field: string) => (value: any) => {
    setFormData(prev => ({
      ...prev,
      testCommunicationConfigurations: prev.testCommunicationConfigurations?.map((config, i) =>
        i === index ? { ...config, [field]: value } : config
      ) || []
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const testResult = await executeWithAuth(async () => {
        // Port validation for start-stream
        if (functionId === 'start-stream') {
          const configs = formData.testStreamConfigurations || [];
          for (let i = 0; i < configs.length; i++) {
            const config = configs[i];
            if (config.sourcePort) {
              const sourcePortError = validateRtpPort(config.sourcePort);
              if (sourcePortError) {
                throw new Error(`Configuration ${i + 1} - Source Port: ${sourcePortError}`);
              }
            }
            if (config.targetPort) {
              const targetPortError = validateRtpPort(config.targetPort);
              if (targetPortError) {
                throw new Error(`Configuration ${i + 1} - Target Port: ${targetPortError}`);
              }
            }
          }
        }

        let response;

      switch (functionId) {
        case 'open-receiving-points':
          const ssrcs = [formData.ssrc1, formData.ssrc2].filter((ssrc): ssrc is number => ssrc !== undefined);
          const openRequest: OpenReceivingPointsRequest = {
            ssrcs: ssrcs,
            packetCount: formData.packetCount || 0,
            interactionKey: formData.interactionKey,
          };
          response = await rtpTesterService.openReceivingPoints(openRequest);
          break;
        case 'start-stream':
          const startRequest: StartStreamRequest = {
            testStreamConfigurations: (formData.testStreamConfigurations || []).map(config => ({
              ...config,
              streamSize: `PT${config.streamSize}S` // Convert seconds to ISO format
            })),
            streamType: formData.streamType || 'MONO',
            rtpCodec: formData.rtpCodec || 'PCMU',
            interactionKey: formData.interactionKey,
            intervalInMs: formData.intervalInMs,
          };
          response = await rtpTesterService.startStream(startRequest);

          // Add senderId to additional data if available in response
          if (response) {
            const senderId = response.senderId || response.streamId || null;
            console.log('Start stream response senderId:', senderId);
          }
          break;
        case 'remove-rtp-tester':
          response = await rtpTesterService.removeRtpTester({
            rtpTesterId: formData.rtpTesterId || '',
            interactionKey: formData.interactionKey,
          });
          break;
        case 'update-sender-destination':
          response = await rtpTesterService.updateSenderSendDestination({
            rtpTesterId: formData.rtpTesterId || '',
            senderId: formData.senderId || '',
            streamType: formData.streamType || 'MONO',
            interactionKey: formData.interactionKey,
            testCommunicationConfigurations: formData.testCommunicationConfigurations || [],
          });
          break;
        case 'resolve-receiver-query':
          response = await rtpTesterService.resolveReceiverQuery({
            rtpTesterId: formData.rtpTesterId || '',
            ssrc: formData.ssrc || 0,
            rtpQuery: formData.rtpQuery || 'NUM_OF_PACKETS',
            expectedValue: formData.expectedValue,
            receiverStatus: formData.receiverStatus,
            acceptedMismatchPercentage: formData.acceptedMismatchPercentage,
            timeoutMs: formData.timeoutMs || 5000,
            interactionKey: formData.interactionKey,
          });
          break;
        case 'resolve-sender-query':
          response = await rtpTesterService.resolveSenderQuery({
            rtpTesterId: formData.rtpTesterId || '',
            ssrc: formData.ssrc || 0,
            rtpQuery: formData.rtpQuery || 'NUM_OF_PACKETS',
            expectedValue: formData.expectedValue,
            receiverStatus: formData.receiverStatus,
            acceptedMismatchPercentage: formData.acceptedMismatchPercentage,
            timeoutMs: formData.timeoutMs || 5000,
            interactionKey: formData.interactionKey,
          });
          break;
        case 'stream-packets-count':
          response = await rtpTesterService.getStreamedPacketsCount({
            rtpTesterId: formData.rtpTesterId || '',
            ssrcs: formData.ssrcs || [],
            interactionKey: formData.interactionKey,
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

  } catch (error: any) {
    console.error('RTP Test Form Error:', error);
    // Display error in UI
    setError(error.message || 'An unexpected error occurred');
  } finally {
    setIsLoading(false);
  }
  };

  const handleAuthSuccess = () => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/rtp-tester');
    }
  };

  const getFunctionTitle = () => {
    switch (functionId) {
      case 'open-receiving-points': return 'Open RTP Receiving Points';
      case 'start-stream': return 'Start RTP Stream';
      case 'remove-rtp-tester': return 'Remove RTP Tester';
      case 'update-sender-destination': return 'Update Sender Destination';
      case 'resolve-receiver-query': return 'Resolve Receiver Query';
      case 'resolve-sender-query': return 'Resolve Sender Query';
      case 'stream-packets-count': return 'Get Streamed Packets Count';
      default: return 'RTP Function';
    }
  };

  const renderFormFields = () => {
    switch (functionId) {
      case 'open-receiving-points':
        return (
          <>
            <NumberInput
              id="ssrc1"
              label="SSRC 1"
              value={formData.ssrc1 || ''}
              onChange={handleInputChange('ssrc1')}
              required
              placeholder="12345"
              helperText="Primary Synchronization Source identifier"
            />
            <NumberInput
              id="ssrc2"
              label="SSRC 2 (optional)"
              value={formData.ssrc2 || ''}
              onChange={handleInputChange('ssrc2')}
              placeholder="12346"
              helperText="Secondary Synchronization Source identifier (optional)"
            />
            <NumberInput
              id="packetCount"
              label="Packet Count"
              value={formData.packetCount || 0}
              onChange={handleInputChange('packetCount')}
              required
              min={1}
              helperText="Number of packets to receive"
            />
            <TextInput
              id="interactionKey"
              label="Interaction Key"
              value={formData.interactionKey}
              onChange={handleInputChange('interactionKey')}
              required
              helperText="Unique identifier for this interaction"
            />
          </>
        );

      case 'start-stream':
        return (
          <>
            <Dropdown
              id="streamType"
              label="Stream Type"
              value={formData.streamType || ''}
              options={[
                { value: 'MONO', label: 'Mono' },
                { value: 'STEREO', label: 'Stereo' },
              ]}
              onChange={handleInputChange('streamType')}
              required
              helperText="Choose mono for single channel or stereo for dual channel"
            />

            <Dropdown
              id="rtpCodec"
              label="RTP Codec"
              value={formData.rtpCodec || ''}
              options={[
                { value: 'PCMU', label: 'PCMU (G.711 μ-law)' },
                { value: 'PCMA', label: 'PCMA (G.711 A-law)' },
                { value: 'G729', label: 'G.729' },
                { value: 'DEFAULT', label: 'Default' },
              ]}
              onChange={handleInputChange('rtpCodec')}
              required
              helperText="Audio codec for the RTP stream"
            />

            <NumberInput
            id={`intervalInMs`}
            label="Interval (ms)"
            value={formData.intervalInMs || 0}
            onChange={handleInputChange('intervalInMs')}
            helperText="Interval between packets in milliseconds"
          />

            <NumberInput
              id="streamSize"
              label="Stream Duration (seconds)"
              value={parseInt(formData.testStreamConfigurations?.[0]?.streamSize || '30')}
              onChange={(value) => handleStreamConfigChange(0, 'streamSize')(value.toString())}
              min={1}
              required
              helperText="Duration in seconds"
            />



            <TextInput
              id="interactionKey"
              label="Interaction Key"
              value={formData.interactionKey}
              onChange={handleInputChange('interactionKey')}
              required
              helperText="Unique identifier for this interaction"
            />

            {/* Stream Configurations */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Stream Configuration{formData.streamType === 'STEREO' ? 's' : ''}
            </Typography>

            {formData.testStreamConfigurations?.map((config, index) => (
              <Card key={index} sx={{ mb: 2, p: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {formData.streamType === 'STEREO' ?
                      `Channel ${index + 1} (${index === 0 ? 'Left' : 'Right'})` :
                      'Stream Configuration'
                    }
                  </Typography>

                  <Stack spacing={2}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <NumberInput
                        id={`ssrc-${index}`}
                        label="SSRC"
                        value={config.ssrc}
                        onChange={handleStreamConfigChange(index, 'ssrc')}
                        required
                        helperText="Synchronization Source identifier"
                      />

                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <TextInput
                        id={`sourcePort-${index}`}
                        label="Source Port"
                        value={config.sourcePort?.toString() || ''}
                        onChange={(value) => {
                          // Allow any input while typing
                          if (value === '') {
                            handleStreamConfigChange(index, 'sourcePort')('');
                            return;
                          }

                          // Allow numbers only
                          if (!/^\d+$/.test(value)) {
                            return;
                          }

                          const numValue = parseInt(value, 10);
                          // Allow any valid number, validation will happen on submit
                          if (!isNaN(numValue)) {
                            handleStreamConfigChange(index, 'sourcePort')(numValue);
                          }
                        }}
                        required
                        placeholder="42000-62000"
                        helperText="Source port for RTP stream (42,000-62,000)"
                      />
                      <TextInput
                        id={`targetPort-${index}`}
                        label="Target Port"
                        value={config.targetPort?.toString() || ''}
                        onChange={(value) => {
                          // Allow any input while typing
                          if (value === '') {
                            handleStreamConfigChange(index, 'targetPort')('');
                            return;
                          }

                          // Allow numbers only
                          if (!/^\d+$/.test(value)) {
                            return;
                          }

                          const numValue = parseInt(value, 10);
                          // Allow any valid number, validation will happen on submit
                          if (!isNaN(numValue)) {
                            handleStreamConfigChange(index, 'targetPort')(numValue);
                          }
                        }}
                        required
                        placeholder="42000-62000"
                        helperText="Target port for RTP stream (42,000-62,000)"
                      />
                    </Box>
                    <TextInput
                      id={`targetIp-${index}`}
                      label="Target IP"
                      value={config.targetIp}
                      onChange={handleStreamConfigChange(index, 'targetIp')}
                      required
                      placeholder="192.168.1.100"
                      helperText="Target IP address for RTP stream"
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </>
        );

      case 'remove-rtp-tester':
        return (
          <>
            <TextInput
              id="rtpTesterId"
              label="RTP Tester ID"
              value={formData.rtpTesterId || ''}
              onChange={handleInputChange('rtpTesterId')}
              required
              placeholder="550e8400-e29b-41d4-a716-446655440000"
              helperText="UUID of the RTP tester to remove"
            />
            <TextInput
              id="interactionKey"
              label="Interaction Key"
              value={formData.interactionKey}
              onChange={handleInputChange('interactionKey')}
              required
              helperText="Unique identifier for this interaction"
            />
          </>
        );

      case 'update-sender-destination':
        return (
          <>
            <TextInput
              id="rtpTesterId"
              label="RTP Tester ID"
              value={formData.rtpTesterId || ''}
              onChange={handleInputChange('rtpTesterId')}
              required
              placeholder="550e8400-e29b-41d4-a716-446655440000"
              helperText="UUID of the RTP tester"
            />
            <TextInput
              id="senderId"
              label="Sender ID"
              value={formData.senderId || ''}
              onChange={handleInputChange('senderId')}
              required
              placeholder="550e8400-e29b-41d4-a716-446655440001"
              helperText="UUID of the sender"
            />

            <Dropdown
              id="streamType"
              label="Stream Type"
              value={formData.streamType || 'MONO'}
              options={[
                { value: 'MONO', label: 'Mono' },
                { value: 'STEREO', label: 'Stereo' },
              ]}
              onChange={handleInputChange('streamType')}
              required
              helperText="Select mono or stereo stream type"
            />

            <TextInput
              id="interactionKey"
              label="Interaction Key"
              value={formData.interactionKey}
              onChange={handleInputChange('interactionKey')}
              required
              helperText="Unique identifier for this interaction"
            />

            {/* Communication Configurations */}
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Communication Configurations
            </Typography>

            {formData.testCommunicationConfigurations?.map((config, index) => (
              <Card key={index} sx={{ mb: 2, p: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Configuration {index + 1}
                  </Typography>

                  <Stack spacing={2}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <NumberInput
                        id={`commConfig-ssrc-${index}`}
                        label="SSRC"
                        value={config.ssrc}
                        onChange={handleCommConfigChange(index, 'ssrc')}
                        required
                        helperText="Synchronization Source identifier"
                      />
                      <NumberInput
                        id={`commConfig-sourcePort-${index}`}
                        label="Source Port"
                        value={config.sourcePort}
                        onChange={handleCommConfigChange(index, 'sourcePort')}
                        required
                        min={42000}
                        max={62000}
                        helperText="Source port for communication"
                      />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <NumberInput
                        id={`commConfig-targetPort-${index}`}
                        label="Target Port"
                        value={config.targetPort}
                        onChange={handleCommConfigChange(index, 'targetPort')}
                        required
                        min={42000}
                        max={62000}
                        helperText="Target port for communication"
                      />
                      <TextInput
                        id={`commConfig-targetIp-${index}`}
                        label="Target IP"
                        value={config.targetIp}
                        onChange={handleCommConfigChange(index, 'targetIp')}
                        required
                        placeholder="192.168.1.100"
                        helperText="Target IP address"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </>
        );

      case 'resolve-receiver-query':
      case 'resolve-sender-query':
        return (
          <>
            <TextInput
              id="rtpTesterId"
              label="RTP Tester ID"
              value={formData.rtpTesterId || ''}
              onChange={handleInputChange('rtpTesterId')}
              required
              placeholder="550e8400-e29b-41d4-a716-446655440000"
              helperText="UUID of the RTP tester"
            />
            <NumberInput
              id="ssrc"
              label="SSRC"
              value={formData.ssrc || 0}
              onChange={handleInputChange('ssrc')}
              required
              helperText="Synchronization Source identifier"
            />
            <Dropdown
              id="rtpQuery"
              label="RTP Query Type"
              value={formData.rtpQuery || ''}
              options={[
                { value: 'IS_SAME_SSRC', label: 'Is Same SSRC' },
                { value: 'NUM_OF_PACKETS', label: 'Number of Packets' },
                { value: 'SEQUENCE_NUMBER_ORDER', label: 'Sequence Number Order' },
                { value: 'TIMESTAMP_ORDER_DELTA', label: 'Timestamp Order Delta' },
                { value: 'PACKET_RECEIVING_STATUS', label: 'Packet Receiving Status' },
              ]}
              onChange={handleInputChange('rtpQuery')}
              required
              helperText="Type of query to perform"
            />
            <NumberInput
              id="timeoutMs"
              label="Timeout (ms)"
              value={formData.timeoutMs || 0}
              onChange={handleInputChange('timeoutMs')}
              required
              helperText="Query timeout in milliseconds"
            />
            <NumberInput
              id="expectedValue"
              label="Expected Value (Optional)"
              value={formData.expectedValue || ''}
              onChange={handleInputChange('expectedValue')}
              helperText="Expected value for comparison"
            />
            <Dropdown
              id="receiverStatus"
              label="Receiver Status (Optional)"
              value={formData.receiverStatus || ''}
              options={[
                { value: '', label: 'Not specified' },
                { value: 'STOPPED', label: 'Stopped' },
                { value: 'RECEIVING', label: 'Receiving' },
              ]}
              onChange={handleInputChange('receiverStatus')}
              helperText="Expected receiver status"
            />
            <NumberInput
              id="acceptedMismatchPercentage"
              label="Accepted Mismatch % (Optional)"
              value={formData.acceptedMismatchPercentage || ''}
              onChange={handleInputChange('acceptedMismatchPercentage')}
              min={0}
              max={100}
              helperText="Acceptable mismatch percentage"
            />
            <TextInput
              id="interactionKey"
              label="Interaction Key"
              value={formData.interactionKey}
              onChange={handleInputChange('interactionKey')}
              required
              helperText="Unique identifier for this interaction"
            />
          </>
        );

      case 'stream-packets-count':
        return (
          <>
            <TextInput
              id="rtpTesterId"
              label="RTP Tester ID"
              value={formData.rtpTesterId || ''}
              onChange={handleInputChange('rtpTesterId')}
              required
              placeholder="550e8400-e29b-41d4-a716-446655440000"
              helperText="UUID of the RTP tester"
            />
            <TextInput
              id="ssrcs"
              label="SSRCs (comma-separated)"
              value={formData.ssrcs?.join(', ') || ''}
              onChange={handleInputChange('ssrcs')}
              required
              placeholder="12345, 12346, "
              helperText="List of Synchronization Source identifiers"
            />
            <TextInput
              id="interactionKey"
              label="Interaction Key"
              value={formData.interactionKey}
              onChange={handleInputChange('interactionKey')}
              required
              helperText="Unique identifier for this interaction"
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mr: 2 }}
            variant="outlined"
          >
            Back
          </Button>
          <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
            {getFunctionTitle()}
          </Typography>
          <Chip
            icon={<SecurityIcon />}
            label={authState.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            color={authState.isAuthenticated ? 'success' : 'warning'}
            size="small"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {renderFormFields()}

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SendIcon />}
                disabled={isLoading}
                sx={{ minWidth: 120 }}
              >
                {isLoading ? 'Testing...' : 'Run Test'}
              </Button>
            </Box>
          </Box>
        </form>

        <ColoredJsonViewer
          response={result}
          error={error}
          title="RTP Tester Response"
        />
      </Paper>

      <AuthDialog
        open={isAuthDialogOpen}
        onClose={closeAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </Box>
  );
};
