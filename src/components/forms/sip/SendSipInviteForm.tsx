import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Send as SendIcon, Security as SecurityIcon, ArrowBack as ArrowBackIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { TextInput, Dropdown, NumberInput } from '../../common';
import { AuthDialog } from '../../auth';
import { ColoredJsonViewer } from '../../response';
import { useAuthenticatedRequest } from '../../../hooks/useAuthenticatedRequest';
import { useAuth } from '../../../hooks/useAuth';
import { useTester } from '../../../contexts/TesterContext';
import { sipTesterService, setSipTesterAddDialogIdFunction } from '../../../services/sipTesterService';
import type { TransportProtocol } from '../../../types';

interface SendSipInviteFormProps {
  onTestComplete?: (result: any) => void;
  onBack?: () => void;
}

interface SendSipInviteFormData {
  sipTesterId: string;
  destinationAddress: {
    ip: string;
    port: number;
    transportProtocol: TransportProtocol;
    alias?: string;
  };
  customHeaders: Record<string, string>;
  sdp: {
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
      bandwidthType?: string;
      bandwidth?: number;
      label?: string;
      packetTime?: number;
      maxPacketTime?: number;
      channelState?: 'SEND' | 'RECEIVE' | 'SEND_AND_RECEIVE' | 'INACTIVE';
      attributes?: Record<string, string>;
    }>;
  };
}

export const SendSipInviteForm: React.FC<SendSipInviteFormProps> = ({ onTestComplete, onBack }) => {
  const [formData, setFormData] = useState<SendSipInviteFormData>({
    sipTesterId: '',
    destinationAddress: {
      ip: '',
      port: 5060,
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
        port: 42000,
        transportProtocol: 'RTP_AVP',
        connectionAddress: '',
        label: '',
        packetTime: 20,
        maxPacketTime: 20,
        channelState: 'SEND_AND_RECEIVE',
        attributes: {},
      }],
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const { state: authState } = useAuth();
  const { isAuthDialogOpen, closeAuthDialog, executeWithAuth } = useAuthenticatedRequest();
  const { addDialogId } = useTester();

  // Initialize SIP service with dialog ID function
  useEffect(() => {
    console.log('SendSipInviteForm: Setting up addDialogId function');
    setSipTesterAddDialogIdFunction(addDialogId);
  }, [addDialogId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const testResult = await executeWithAuth(async () => {
        if (!formData.sipTesterId?.trim()) {
          throw new Error('SIP Tester ID is required');
        }
        if (!formData.destinationAddress?.ip?.trim()) {
          throw new Error('Destination IP is required');
        }

        const response = await sipTesterService.sendInvite({
          testerId: formData.sipTesterId.trim(),
          destinationAddress: {
            ip: formData.destinationAddress.ip.trim(),
            port: formData.destinationAddress.port,
            transportProtocol: formData.destinationAddress.transportProtocol,
            alias: formData.destinationAddress.alias?.trim(),
          },
          customHeaders: formData.customHeaders || {},
          sdp: formData.sdp,
        });

        return response;
      });

      if (testResult) {
        setResult(testResult);
        onTestComplete?.(testResult);
      }

    } catch (error: any) {
      console.error('Send SIP Invite Form Error:', error);
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
              Send SIP INVITE
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
              id="sipTesterId"
              label="SIP Tester ID"
              value={formData.sipTesterId}
              onChange={(value) => setFormData(prev => ({ ...prev, sipTesterId: value }))}
              placeholder="Enter SIP Tester ID"
              helperText="UUID of the SIP tester"
              required
            />

            <Typography variant="h6" sx={{ mt: 2, mb: 1, gridColumn: { md: '1 / -1' } }}>
              Destination Address
            </Typography>

            <TextInput
              id="destinationIp"
              label="Destination IP"
              value={formData.destinationAddress.ip}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                destinationAddress: {
                  ...prev.destinationAddress,
                  ip: value
                }
              }))}
              placeholder="192.168.1.100"
              helperText="IP address of the destination"
              required
            />

            <TextInput
              id="destinationPort"
              label="Destination Port"
              value={formData.destinationAddress.port.toString()}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                destinationAddress: {
                  ...prev.destinationAddress,
                  port: Number(value)
                }
              }))}
              helperText="Port number of the destination (SIP : 5000-6000)"
              required
            />


            <Dropdown
              id="destinationTransportProtocol"
              label="Transport Protocol"
              value={formData.destinationAddress.transportProtocol}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                destinationAddress: {
                  ...prev.destinationAddress,
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
              value={formData.destinationAddress.alias || ''}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                destinationAddress: {
                  ...prev.destinationAddress,
                  alias: value
                }
              }))}
              placeholder="destination-alias"
              helperText="Optional alias for the destination"
            />

            <Typography variant="h6" sx={{ mt: 2, mb: 1, gridColumn: { md: '1 / -1' } }}>
              SDP Configuration
            </Typography>

            {/* Basic SDP Fields */}
            <NumberInput
              id="sessionVersion"
              label="Session Version"
              value={formData.sdp.sessionVersion}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                sdp: {
                  ...prev.sdp,
                  sessionVersion: Number(value)
                }
              }))}
              min={1}
              helperText="SDP session version"
              required
            />

            <TextInput
              id="sessionName"
              label="Session Name"
              value={formData.sdp.sessionName}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                sdp: {
                  ...prev.sdp,
                  sessionName: value
                }
              }))}
              placeholder="Test Session"
              helperText="SDP session name"
              required
            />

            <Box sx={{ gridColumn: { md: '1 / -1' } }}>
              <TextInput
                id="sessionInformation"
                label="Session Information (Optional)"
                value={formData.sdp.sessionInformation || ''}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  sdp: {
                    ...prev.sdp,
                    sessionInformation: value
                  }
                }))}
                placeholder="Session description"
                helperText="Optional session information"
              />
            </Box>

            {/* Origin Accordion */}
            <Box sx={{ gridColumn: { md: '1 / -1' } }}>
              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Origin Configuration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextInput
                      id="origin-username"
                      label="Username"
                      value={formData.sdp.origin.userName}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        sdp: {
                          ...prev.sdp,
                          origin: {
                            ...prev.sdp.origin,
                            username: value
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
                      value={formData.sdp.origin.sessionId}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        sdp: {
                          ...prev.sdp,
                          origin: {
                            ...prev.sdp.origin,
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
                      value={formData.sdp.origin.sessionVersion}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        sdp: {
                          ...prev.sdp,
                          origin: {
                            ...prev.sdp.origin,
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
                      value={formData.sdp.origin.networkType}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        sdp: {
                          ...prev.sdp,
                          origin: {
                            ...prev.sdp.origin,
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
                      value={formData.sdp.origin.addressType}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        sdp: {
                          ...prev.sdp,
                          origin: {
                            ...prev.sdp.origin,
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
                      id="origin-ip"
                      label="Unicast Address"
                      value={formData.sdp.origin.ip}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        sdp: {
                          ...prev.sdp,
                          origin: {
                            ...prev.sdp.origin,
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
                      value={formData.sdp.connection.networkType}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        sdp: {
                          ...prev.sdp,
                          connection: {
                            ...prev.sdp.connection,
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
                      value={formData.sdp.connection.addressType}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        sdp: {
                          ...prev.sdp,
                          connection: {
                            ...prev.sdp.connection,
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
                      value={formData.sdp.connection.ip}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        sdp: {
                          ...prev.sdp,
                          connection: {
                            ...prev.sdp.connection,
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
                      value={formData.sdp.timing.startTime}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        sdp: {
                          ...prev.sdp,
                          timing: {
                            ...prev.sdp.timing,
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
                      value={formData.sdp.timing.stopTime}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        sdp: {
                          ...prev.sdp,
                          timing: {
                            ...prev.sdp.timing,
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
                    {formData.sdp.channels.map((channel, index) => (
                      <Box key={index} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                          Channel {index + 1}
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          <TextInput
                            id={`channel-${index}-mediaType`}
                            label="Media Type"
                            value={channel.mediaType}
                            onChange={(value) => setFormData(prev => ({
                              ...prev,
                              sdp: {
                                ...prev.sdp,
                                channels: prev.sdp.channels.map((ch, i) =>
                                  i === index ? { ...ch, mediaType: value } : ch
                                )
                              }
                            }))}
                            placeholder="audio"
                            helperText="Media type (audio, video, etc.)"
                            required
                          />

                          <TextInput
                            id={`channel-${index}-port`}
                            label="Port"
                            value={channel.port.toString()}
                            onChange={(value) => setFormData(prev => ({
                              ...prev,
                              sdp: {
                                ...prev.sdp,
                                channels: prev.sdp.channels.map((ch, i) =>
                                  i === index ? { ...ch, port: Number(value) } : ch
                                )
                              }
                            }))}
                            // min={Number(42000)}
                            // max={Number(62000)}
                            helperText="Media port number (range 42000-62000)"
                            required
                          />

                          <TextInput
                            id={`channel-${index}-protocol`}
                            label="Protocol"
                            value={channel.transportProtocol}
                            onChange={(value) => setFormData(prev => ({
                              ...prev,
                              sdp: {
                                ...prev.sdp,
                                channels: prev.sdp.channels.map((ch, i) =>
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
                                ...prev.sdp,
                                channels: prev.sdp.channels.map((ch, i) =>
                                  i === index ? { ...ch, connectionAddress: value } : ch
                                )
                              }
                            }))}
                            placeholder="192.168.1.100"
                            helperText="Optional connection address override"
                          />

                          {/*<TextInput*/}
                          {/*  id={`channel-${index}-bandwidthType`}*/}
                          {/*  label="Bandwidth Type (Optional)"*/}
                          {/*  value={channel.bandwidthType || ''}*/}
                          {/*  onChange={(value) => setFormData(prev => ({*/}
                          {/*    ...prev,*/}
                          {/*    sdp: {*/}
                          {/*      ...prev.sdp,*/}
                          {/*      channels: prev.sdp.channels.map((ch, i) => */}
                          {/*        i === index ? { ...ch, bandwidthType: value } : ch*/}
                          {/*      )*/}
                          {/*    }*/}
                          {/*  }))}*/}
                          {/*  placeholder="CT"*/}
                          {/*  helperText="Bandwidth type (CT, AS, etc.)"*/}
                          {/*/>*/}

                          {/*<NumberInput*/}
                          {/*  id={`channel-${index}-bandwidth`}*/}
                          {/*  label="Bandwidth (Optional)"*/}
                          {/*  value={channel.bandwidth || ''}*/}
                          {/*  onChange={(value) => setFormData(prev => ({*/}
                          {/*    ...prev,*/}
                          {/*    sdp: {*/}
                          {/*      ...prev.sdp,*/}
                          {/*      channels: prev.sdp.channels.map((ch, i) => */}
                          {/*        i === index ? { ...ch, bandwidth: value ? Number(value) : undefined } : ch*/}
                          {/*      )*/}
                          {/*    }*/}
                          {/*  }))}*/}
                          {/*  min={0}*/}
                          {/*  helperText="Bandwidth in kbps"*/}
                          {/*/>*/}

                          <TextInput
                            id={`channel-${index}-label`}
                            label="Label (Optional)"
                            value={channel.label || ''}
                            onChange={(value) => setFormData(prev => ({
                              ...prev,
                              sdp: {
                                ...prev.sdp,
                                channels: prev.sdp.channels.map((ch, i) =>
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
                                ...prev.sdp,
                                channels: prev.sdp.channels.map((ch, i) =>
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
                                ...prev.sdp,
                                channels: prev.sdp.channels.map((ch, i) =>
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
                                ...prev.sdp,
                                channels: prev.sdp.channels.map((ch, i) =>
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
                                    ...prev.sdp,
                                    channels: prev.sdp.channels.map((ch, i) =>
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

                        {formData.sdp.channels.length > 1 && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            sx={{ mt: 2 }}
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              sdp: {
                                ...prev.sdp,
                                channels: prev.sdp.channels.filter((_, i) => i !== index)
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
                          ...prev.sdp,
                          channels: [
                            ...prev.sdp.channels,
                            {
                              mediaType: 'AUDIO',
                              port: 42002,
                              transportProtocol: 'RTP_AVP',
                              connectionAddress: '',
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
            </Box>
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {authState.isAuthenticated
                ? 'Ready to send SIP INVITE'
                : 'Authentication will be requested when you send the invite'
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
              {isLoading ? 'Sending...' : 'Send INVITE'}
            </Button>
          </Box>
        </form>

        <ColoredJsonViewer
          response={result}
          error={error}
          onBack={onBack}
          title="Send SIP INVITE Response"
        />
      </Paper>

      <AuthDialog
        open={isAuthDialogOpen}
        onClose={closeAuthDialog}
        onSuccess={handleAuthSuccess}
        title="Authentication Required for SIP Testing"
        message="Please sign in to send SIP INVITE requests."
      />
    </Box>
  );
};
