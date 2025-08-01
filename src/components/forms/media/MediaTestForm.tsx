import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  TextField,
  Tabs,
  Tab,
} from '@mui/material';
import { Send as SendIcon, Security as SecurityIcon, ArrowBack as ArrowBackIcon, ExpandMore as ExpandMoreIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import { TextInput, Dropdown, NumberInput, MultiSelect } from '../../common';
import { AuthDialog } from '../../auth';
import { ColoredJsonViewer } from '../../response';
import { SipComparatorEditor } from '../sip/SipComparatorEditor';
import { useAuthenticatedRequest } from '../../../hooks/useAuthenticatedRequest';
import { useAuth } from '../../../hooks/useAuth';
import { useTester } from '../../../contexts/TesterContext';
import { mediaTesterService, setMediaTesterAddFunction, setMediaTesterRemoveFunction, setMediaTesterAddDialogIdFunction } from '../../../services/mediaTesterService';
import type { TesterRole, TransportProtocol, MediaSourceType, MediaCodec, ChannelType, RtpTesterQuery, ReceiverStatus } from '../../../types';

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
  streamsDuration?: number;
  channelSsrcs?: number[];
  sipSessionExpiration?: number | null;
  isGlobalIpReceiver?: boolean;
  isLocalRun?: boolean;
  automaticSourceAddressesGeneration?: boolean;

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
      codecs?: number[]; // Add codecs array
      connectionAddress?: string;
      label?: string;
      packetTime?: number;
      maxPacketTime?: number;
      channelState: 'SEND' | 'RECEIVE' | 'SEND_AND_RECEIVE' | 'INACTIVE';
      attributes?: Record<string, any>;
    }>;
  };

  // RTP query fields (legacy for backward compatibility)
  interactionKey?: string;
  ssrc?: number[] | number;

  // RTP resolve query fields (matching RTP tester exactly)
  rtpTesterId?: string;
  rtpQuery?: RtpTesterQuery;
  expectedValue?: number | string;
  receiverStatus?: ReceiverStatus | string;
  acceptedMismatchPercentage?: number | string;
  timeoutMs?: number;
}

export const MediaTestForm: React.FC<MediaTestFormProps> = ({ functionId = 'create-media-tester', onTestComplete, onBack }) => {
  console.log('🚀 MediaTestForm rendering with functionId:', functionId);
  const [searchParams] = useSearchParams();

  // Add state for tabs and raw invite parsing (only for send-invite function)
  const [activeTab, setActiveTab] = useState(0);
  const [rawInviteText, setRawInviteText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const [formData, setFormData] = useState<MediaFormData>(() => {
    switch (functionId) {
      case 'remove-media-tester':
        return {
          requestId: searchParams.get('requestId') || '',
          mediaTesterId: searchParams.get('mediaTesterId') || '',
        };

      case 'send-invite':
        return {
          mediaTesterId: '',
          destinationAddress: {
            ip: '',
            port: 5060,
            transportProtocol: 'UDP' as TransportProtocol,
            alias: '',
          },
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
              codecs: [0, 8, 18],
              connectionAddress: '',
              label: '',
              packetTime: 20,
              maxPacketTime: 20,
              channelState: 'SEND',
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
          rtpTesterId: '',
          ssrc: 12345,
          rtpQuery: 'NUM_OF_PACKETS',
          expectedValue: '',
          receiverStatus: '',
          acceptedMismatchPercentage: '',
          timeoutMs: 5000,
          interactionKey: '',
        };

      default: // create-media-tester
        return {
          requestId: '',
          testerKeyName: 'media-tester-default',
          testerRole: 'AVAYA_SBC' as TesterRole,
          ip: '127.0.0.1',
          port: 5060,
          transportProtocol: 'UDP' as TransportProtocol,
          alias: 'media-alias',
          mediaSourceType: 'SIP' as MediaSourceType,
          unsupportedCodecs: [] as MediaCodec[],
          saveDialog: true,
          isStateless: false,
          imrRequesterId: null,
          rtpSendingPorts: [42000, 42002],
          rtpReceivingPorts: [42004, 42006],
          streamsDuration: 30,
          channelSsrcs: [],
          sipSessionExpiration: null,
          isGlobalIpReceiver: false,
          isLocalRun: false,
          automaticSourceAddressesGeneration: true,
        };
    }
  });

  // Effect to handle automatic source address generation
  useEffect(() => {
    console.log('🔧 Autogenerate effect triggered:', formData.automaticSourceAddressesGeneration);
    if (formData.automaticSourceAddressesGeneration) {
      console.log('🔧 Setting IP to 0.0.0.0');
      setFormData(prev => ({ ...prev, ip: '0.0.0.0' }));
    }
  }, [formData.automaticSourceAddressesGeneration]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [customCodecValues, setCustomCodecValues] = useState<{[channelIndex: number]: string}>({});
  const [showCustomCodecInput, setShowCustomCodecInput] = useState<{[channelIndex: number]: boolean}>({});

  const { state: authState } = useAuth();
  const { addTester, removeTesterByTesterId, addDialogId, removeDialogId } = useTester();
  const { isAuthDialogOpen, closeAuthDialog, executeWithAuth } = useAuthenticatedRequest();

  const getFunctionTitle = () => {
    switch (functionId) {
      case 'create-media-tester': return 'Create Media Tester';
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

  // SIP INVITE parsing function (for send-invite function)
  const parseSipInvite = (sipInviteText: string): Partial<MediaFormData> | null => {
    try {
      setParseError(null);
      const lines = sipInviteText.trim().split('\n');
      const parsed: Partial<MediaFormData> = {
        destinationAddress: {
          ip: '',
          port: 5060,
          transportProtocol: 'UDP' as TransportProtocol,
          alias: '',
        },
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
          channels: [],
        },
      };

      let inSdpSection = false;
      let sdpLines: string[] = [];

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) continue;

        // Check if we've reached the SDP section
        if (trimmedLine.startsWith('v=')) {
          inSdpSection = true;
        }

        if (inSdpSection) {
          sdpLines.push(trimmedLine);
          continue;
        }

        // Parse SIP headers
        if (trimmedLine.startsWith('INVITE ')) {
          // Parse INVITE line: INVITE sip:10.221.19.252;transport=udp SIP/2.0
          // Handle both: sip:host and sip:user@host formats
          const inviteMatch = trimmedLine.match(/INVITE\s+sip:(?:([^@]+)@)?([^:;]+)(?::(\d+))?(?:;transport=([^\s]+))?/i);
          if (inviteMatch) {
            parsed.destinationAddress!.ip = inviteMatch[2]; // host is always in position 2
            if (inviteMatch[3]) {
              parsed.destinationAddress!.port = parseInt(inviteMatch[3]);
            }
            if (inviteMatch[4]) {
              parsed.destinationAddress!.transportProtocol = inviteMatch[4].toUpperCase() as TransportProtocol;
            }
            // Store the user part if present
            if (inviteMatch[1]) {
              parsed.customHeaders!['INVITE-User'] = inviteMatch[1];
            }
          }
        } else if (trimmedLine.startsWith('To:')) {
          // Parse To header: To: "VRSP" <sip:10.221.19.252>
          // Store the complete To header for proper reconstruction
          parsed.customHeaders!['To'] = trimmedLine.substring(3).trim();
        } else if (trimmedLine.startsWith('From:')) {
          // Parse From header: From: <sip:acmeSrc@172.21.13.164>;tag=1c257669691
          // Store the complete From header for proper reconstruction
          parsed.customHeaders!['From'] = trimmedLine.substring(5).trim();
        } else if (trimmedLine.includes(':')) {
          // Parse other headers
          const colonIndex = trimmedLine.indexOf(':');
          const headerName = trimmedLine.substring(0, colonIndex).trim();
          const headerValue = trimmedLine.substring(colonIndex + 1).trim();

          // Store custom headers (excluding standard ones we handle separately)
          if (!['Via', 'Max-Forwards', 'Call-ID', 'CSeq', 'Contact', 'Content-Type', 'Content-Length', 'MIME-Version'].includes(headerName)) {
            parsed.customHeaders![headerName] = headerValue;
          }
        }
      }

      // Parse SDP section
      if (sdpLines.length > 0) {
        const sdpParsed = parseSdpSection(sdpLines);
        if (sdpParsed) {
          parsed.sdp = { ...parsed.sdp!, ...sdpParsed };
        }
      }

      return parsed;
    } catch (error) {
      setParseError(`Failed to parse SIP INVITE: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  // SDP parsing function (for send-invite function)
  const parseSdpSection = (sdpLines: string[]) => {

    const sdp: any = {
      sessionVersion: 0,
      sessionName: 'Media Test Session',
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
      channels: [], // Start with empty channels array
    };

    let currentChannel: any = null;
    let channelCount = 0;

    for (const line of sdpLines) {
      if (line.startsWith('v=')) {
        sdp.sessionVersion = parseInt(line.substring(2));
      } else if (line.startsWith('o=')) {
        // Parse origin: o=- 2142479003 635515518 IN IP4 10.231.242.146
        const parts = line.substring(2).split(' ');
        if (parts.length >= 6) {
          sdp.origin = {
            userName: parts[0] === '-' ? 'media-test' : parts[0],
            sessionId: parts[1],
            sessionVersion: parseInt(parts[2]),
            networkType: parts[3] as 'IN',
            addressType: parts[4] as 'IP4' | 'IP6',
            ip: parts[5],
          };
        }
      } else if (line.startsWith('s=')) {
        sdp.sessionName = line.substring(2) || 'Media Test Session';
      } else if (line.startsWith('c=')) {
        // Parse connection: c=IN IP4 10.231.242.146
        const parts = line.substring(2).split(' ');
        if (parts.length >= 3) {
          sdp.connection = {
            networkType: parts[0] as 'IN',
            addressType: parts[1] as 'IP4' | 'IP6',
            ip: parts[2],
          };
        }
      } else if (line.startsWith('t=')) {
        // Parse timing: t=0 0
        const parts = line.substring(2).split(' ');
        if (parts.length >= 2) {
          sdp.timing = {
            startTime: parseInt(parts[0]),
            stopTime: parseInt(parts[1]),
          };
        }
      } else if (line.startsWith('m=')) {
        // Parse media: m=audio 6304 RTP/AVP 0 8 18 127
        const parts = line.substring(2).split(' ');

        if (parts.length >= 3) {
          // Save previous channel if exists
          if (currentChannel) {
            channelCount++;
            sdp.channels.push(currentChannel);
          }

          // Convert SDP transport protocol format to enum format
          let transportProtocol = parts[2];
          if (transportProtocol === 'RTP/AVP') {
            transportProtocol = 'RTP_AVP';
          } else if (transportProtocol === 'RTP/SAVP') {
            transportProtocol = 'RTP_SAVP';
          }

          // Extract codecs (numbers after transport protocol) - THIS IS KEY!
          const codecParts = parts.slice(3); // Get everything after transport protocol
          const codecs = codecParts.map(codec => parseInt(codec)).filter(codec => !isNaN(codec));

          currentChannel = {
            mediaType: parts[0].toUpperCase(),
            port: parseInt(parts[1]),
            transportProtocol: transportProtocol,
            codecs: codecs, // Store codecs from m= line
            connectionAddress: '',
            attributes: {},
            label: '',
            packetTime: 20,
            maxPacketTime: 20,
            channelState: 'SEND',
          };
        }
      } else if (line.startsWith('a=')) {
        // Parse attributes
        if (currentChannel) {
          const attrLine = line.substring(2);
          if (attrLine.startsWith('label:')) {
            currentChannel.label = attrLine.substring(6);
          } else if (attrLine.startsWith('ptime:')) {
            currentChannel.packetTime = parseInt(attrLine.substring(6));
          } else if (attrLine.startsWith('maxptime:')) {
            currentChannel.maxPacketTime = parseInt(attrLine.substring(9));
          } else if (attrLine.startsWith('sendonly')) {
            currentChannel.channelState = 'SEND';
          } else if (attrLine.startsWith('recvonly')) {
            currentChannel.channelState = 'RECEIVE';
          } else if (attrLine.startsWith('sendrecv')) {
            currentChannel.channelState = 'SEND_AND_RECEIVE';
          } else if (attrLine.startsWith('inactive')) {
            currentChannel.channelState = 'INACTIVE';
          } else {
            // Store other attributes
            const colonIndex = attrLine.indexOf(':');
            if (colonIndex > 0) {
              const attrName = attrLine.substring(0, colonIndex);
              const attrValue = attrLine.substring(colonIndex + 1);
              currentChannel.attributes[attrName] = attrValue;
            } else {
              currentChannel.attributes[attrLine] = '';
            }
          }
        }
      }
    }

    // Add the last channel
    if (currentChannel) {
      channelCount++;
      sdp.channels.push(currentChannel);
    }

    // Filter out invalid channels (those without proper mediaType or port)
    const validChannels = sdp.channels.filter((channel: any) =>
      channel.mediaType &&
      channel.port &&
      channel.port > 0 &&
      channel.transportProtocol
    );

    sdp.channels = validChannels;

    return sdp;
  };

  // Handle parsing and populating form (for send-invite function)
  const handleParseAndPopulate = () => {
    if (!rawInviteText.trim()) {
      setParseError('Please enter a SIP INVITE message');
      return;
    }

    const parsed = parseSipInvite(rawInviteText);
    if (parsed) {
      // Completely replace the form data with parsed data, keeping only the mediaTesterId
      setFormData(prev => ({
        ...prev,
        destinationAddress: parsed.destinationAddress || prev.destinationAddress,
        customHeaders: parsed.customHeaders || {},
        sdp: parsed.sdp ? {
          ...parsed.sdp,
          // Ensure we only use parsed channels, not merge with existing
          channels: parsed.sdp.channels || []
        } : prev.sdp,
      }));

      setActiveTab(0); // Switch to manual form tab
      setParseError(null);
    }
  };

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
            testerId: formData.mediaTesterId.trim(),
            destinationAddress: {
              ip: formData.destinationAddress.ip.trim(),
              port: formData.destinationAddress.port,
              transportProtocol: formData.destinationAddress.transportProtocol,
              alias: formData.destinationAddress.alias?.trim(),
            },
            customHeaders: formData.customHeaders || {},
            sdp: {
              ...formData.sdp!,
              channels: formData.sdp!.channels.map(channel => ({
                mediaType: channel.mediaType,
                port: channel.port,
                transportProtocol: channel.transportProtocol || 'RTP_AVP',
                connectionAddress: channel.connectionAddress,
                attributes: channel.attributes,
              }))
            },
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
          if (!formData.rtpTesterId?.trim()) {
            throw new Error('RTP Tester ID is required');
          }
          if (!formData.interactionKey?.trim()) {
            throw new Error('Interaction Key is required');
          }
          if (!formData.rtpQuery?.trim()) {
            throw new Error('RTP Query Type is required');
          }

          return await mediaTesterService.resolveReceiverQuery({
            rtpTesterId: formData.rtpTesterId.trim(),
            ssrc: typeof formData.ssrc === 'number' ? formData.ssrc : 12345,
            rtpQuery: formData.rtpQuery as RtpTesterQuery,
            expectedValue: typeof formData.expectedValue === 'number' ? formData.expectedValue : undefined,
            receiverStatus: formData.receiverStatus ? formData.receiverStatus as ReceiverStatus : undefined,
            acceptedMismatchPercentage: typeof formData.acceptedMismatchPercentage === 'number' ? formData.acceptedMismatchPercentage : undefined,
            timeoutMs: formData.timeoutMs || 5000,
            interactionKey: formData.interactionKey.trim(),
          });

        } else if (functionId === 'resolve-sender-query') {
          if (!formData.rtpTesterId?.trim()) {
            throw new Error('RTP Tester ID is required');
          }
          if (!formData.interactionKey?.trim()) {
            throw new Error('Interaction Key is required');
          }
          if (!formData.rtpQuery?.trim()) {
            throw new Error('RTP Query Type is required');
          }

          return await mediaTesterService.resolveSenderQuery({
            rtpTesterId: formData.rtpTesterId.trim(),
            ssrc: typeof formData.ssrc === 'number' ? formData.ssrc : 12345,
            rtpQuery: formData.rtpQuery as RtpTesterQuery,
            expectedValue: typeof formData.expectedValue === 'number' ? formData.expectedValue : undefined,
            receiverStatus: formData.receiverStatus ? formData.receiverStatus as ReceiverStatus : undefined,
            acceptedMismatchPercentage: typeof formData.acceptedMismatchPercentage === 'number' ? formData.acceptedMismatchPercentage : undefined,
            timeoutMs: formData.timeoutMs || 5000,
            interactionKey: formData.interactionKey.trim(),
          });

        } else {
          // Create Media Tester
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
              testerRole: formData.testerRole || 'AVAYA_SBC',
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
            streamsDuration: formData.streamsDuration ? `PT${formData.streamsDuration}S` : 'PT30S',
            channelSsrcs: formData.channelSsrcs || [],
            sipSessionExpiration: formData.sipSessionExpiration || undefined,
            isGlobalIpReceiver: formData.isGlobalIpReceiver || false,
            isLocalRun: formData.isLocalRun || false,
          };

          return await mediaTesterService.createMediaTester({
            requestId: formData.requestId?.trim() || `media-test-${Date.now()}`,
            config,
          });
        }
      });

      if (testResult) {
        setResult(testResult);

        // If this was a send-bye request and it was successful, remove the dialog ID
        if (functionId === 'send-bye' &&
            testResult.success !== false &&
            (!testResult.status || testResult.status === 200 || testResult.status < 400) &&
            formData.mediaTesterId?.trim() &&
            formData.dialogId?.trim()) {

          removeDialogId(formData.mediaTesterId.trim(), formData.dialogId.trim(), 'media-tester');
        }

        onTestComplete?.(testResult);
      }

    } catch (error: any) {
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

        {parseError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {parseError}
          </Alert>
        )}

        {/* Show tabs only for send-invite function */}
        {functionId === 'send-invite' && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
              <Tab label="Manual Form" />
              <Tab label="Send Existing Invite" />
            </Tabs>
          </Box>
        )}

        {/* Tab Content for send-invite or regular form for other functions */}
        {functionId === 'send-invite' && activeTab === 1 ? (
          // Raw Invite Tab (only for send-invite)
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Paste Your SIP INVITE Message
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Copy and paste the complete SIP INVITE message below. The parser will extract all fields and populate the manual form.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <TextInput
                id="mediaTesterId"
                label="Media Tester ID"
                value={formData.mediaTesterId || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, mediaTesterId: value }))}
                placeholder="Enter Media Tester ID"
                helperText="UUID of the media tester that will send this invite"
                required
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={20}
              value={rawInviteText}
              onChange={(e) => setRawInviteText(e.target.value)}
              placeholder={`Paste your SIP INVITE here, for example:

INVITE sip:10.221.19.252;transport=udp SIP/2.0
Via: SIP/2.0/UDP dror-mz-acvce01-trust-na1.openrec.dev.internal:5070;branch=z9hG4bKac1164773657;received=10.231.242.27
Max-Forwards: 69
From: <sip:acmeSrc@172.21.13.164>;tag=1c257669691
To: "VRSP" <sip:10.221.19.252>
Call-ID: 13549686172072025122131@dror-mz-acvce01-trust-na1.openrec.dev.internal
CSeq: 1 INVITE
Contact: <sip:acmeSrc@dror-mz-acvce01-trust-na1.openrec.dev.internal:5070>;+sip.src
Content-Type: multipart/mixed;boundary=boundary_ac1504
Content-Length: 2352

--boundary_ac1504
Content-Type: application/sdp

v=0
o=- 2142479003 635515518 IN IP4 10.231.242.146
s=-
c=IN IP4 10.231.242.146
t=0 0
m=audio 6304 RTP/AVP 0 8 18 127
a=label:34146659
a=sendonly`}
              sx={{ mb: 3 }}
              label="SIP INVITE Message"
            />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setRawInviteText('');
                  setParseError(null);
                }}
                disabled={!rawInviteText}
              >
                Clear
              </Button>

              <Button
                variant="contained"
                startIcon={<ContentCopyIcon />}
                onClick={handleParseAndPopulate}
                disabled={!rawInviteText.trim() || !formData.mediaTesterId?.trim()}
              >
                Parse & Use INVITE
              </Button>
            </Box>

            {rawInviteText && formData.mediaTesterId && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="info">
                  Click "Parse & Use INVITE" to extract the invite details and switch to the manual form, then click "Send Request" to execute it.
                </Alert>
              </Box>
            )}
          </Box>
        ) : (
          // Regular form (for all functions or manual tab for send-invite)
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

                <TextInput
                  id="destinationPort"
                  label="Destination Port"
                  value={formData.destinationAddress?.port.toString() || '5060'}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    destinationAddress: {
                      ...prev.destinationAddress!,
                      port: Number(value)
                    }
                  }))}
                  helperText="Sip port number of the destination (5000-6000)"
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

                <Typography variant="h6" sx={{ gridColumn: '1 / -1', mt: 2, mb: 1 }}>
                  SDP Configuration
                </Typography>

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
                  placeholder="Media Test Session"
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
                <Accordion sx={{ gridColumn: '1 / -1', mt: 2 }}>
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
                        placeholder="media-test"
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
                <Accordion sx={{ gridColumn: '1 / -1', mt: 1 }}>
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
                <Accordion sx={{ gridColumn: '1 / -1', mt: 1 }}>
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
                <Accordion sx={{ gridColumn: '1 / -1', mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1">Media Channels Configuration</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {formData.sdp?.channels?.length === 0 ? (
                        <Box textAlign="center" py={2}>
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            No channels configured. Add channels manually or parse from SIP INVITE.
                          </Typography>
                          <Button
                            variant="outlined"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              sdp: {
                                ...prev.sdp!,
                                channels: [
                                  {
                                    mediaType: 'AUDIO',
                                    port: 42000,
                                    transportProtocol: 'RTP_AVP',
                                    codecs: [0, 8, 18],
                                    connectionAddress: '',
                                    label: '',
                                    packetTime: 20,
                                    maxPacketTime: 20,
                                    channelState: 'SEND',
                                    attributes: {},
                                  }
                                ]
                              }
                            }))}
                          >
                            Add Channel
                          </Button>
                        </Box>
                      ) : (
                        formData.sdp?.channels?.map((channel, index) => (
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
                                    i === index ? { ...ch, transportProtocol: value } : ch
                                  )
                                }
                              }))}
                              placeholder="RTP_AVP"
                              helperText="Transport protocol"
                              required
                            />

                            <Box>
                              <MultiSelect
                                id={`channel-${index}-codecs`}
                                label="Codecs"
                                values={(() => {
                                  // Only show actual codec values, not the "other" option
                                  return channel.codecs?.map(c => c.toString()) || [];
                                })()}
                                onChange={(values) => {
                                  // Check if "other" was selected or deselected
                                  if (values.includes('other')) {
                                    // Show the custom input but don't add "other" to the codec list
                                    setShowCustomCodecInput(prev => ({ ...prev, [index]: true }));
                                    // Remove "other" from the values and update with actual codecs only
                                    const numericCodecs = values.filter(v => v !== 'other').map(v => parseInt(v)).filter(n => !isNaN(n));

                                    setFormData(prev => ({
                                      ...prev,
                                      sdp: {
                                        ...prev.sdp!,
                                        channels: prev.sdp!.channels.map((ch, i) =>
                                          i === index ? { ...ch, codecs: numericCodecs } : ch
                                        )
                                      }
                                    }));
                                  } else {
                                    // "other" was deselected, hide custom input
                                    if (showCustomCodecInput[index]) {
                                      setShowCustomCodecInput(prev => ({ ...prev, [index]: false }));
                                      setCustomCodecValues(prev => ({ ...prev, [index]: '' }));
                                    }

                                    // Normal codec selection
                                    const numericCodecs = values.map(v => parseInt(v)).filter(n => !isNaN(n));

                                    setFormData(prev => ({
                                      ...prev,
                                      sdp: {
                                        ...prev.sdp!,
                                        channels: prev.sdp!.channels.map((ch, i) =>
                                          i === index ? { ...ch, codecs: numericCodecs } : ch
                                        )
                                      }
                                    }));
                                  }
                                }}
                                options={[
                                  { value: '0', label: 'PCMU (0)' },
                                  { value: '8', label: 'PCMA (8)' },
                                  { value: '18', label: 'G729 (18)' },
                                  { value: '127', label: 'Custom (127)' },
                                  // Add existing custom codecs as options
                                  ...(channel.codecs?.filter(c => ![0, 8, 18, 127].includes(c)).map(c => ({
                                    value: c.toString(),
                                    label: `Codec ${c}`
                                  })) || []),
                                  { value: 'other', label: 'Other codec...' }
                                ]}
                                helperText="Select one or more audio codecs"
                                required
                              />

                              {/* Show custom codec input only when "other" is selected */}
                              {showCustomCodecInput[index] && (
                                <Box sx={{ mt: 2 }}>
                                  <TextInput
                                    id={`channel-${index}-add-codec`}
                                    label="Add Custom Codec"
                                    value={customCodecValues[index] || ''}
                                    onChange={(value) => {
                                      setCustomCodecValues(prev => ({ ...prev, [index]: value }));
                                    }}
                                    placeholder="Enter codec number(s) (e.g., 96 or 96,97,98)"
                                    helperText="Add custom codec numbers - click button to add them"
                                    size="small"
                                  />
                                  <Button
                                    onClick={() => {
                                      const value = customCodecValues[index];
                                      if (value && value.trim()) {
                                        const customCodecs = value.split(',').map(v => parseInt(v.trim())).filter(n => !isNaN(n) && n > 0);

                                        if (customCodecs.length > 0) {
                                          setFormData(prev => ({
                                            ...prev,
                                            sdp: {
                                              ...prev.sdp!,
                                              channels: prev.sdp!.channels.map((ch, i) => {
                                                if (i === index) {
                                                  const existingCodecs = ch.codecs || [];
                                                  const newCodecs = [...existingCodecs];

                                                  customCodecs.forEach(codec => {
                                                    if (!newCodecs.includes(codec)) {
                                                      newCodecs.push(codec);
                                                    }
                                                  });

                                                  return { ...ch, codecs: newCodecs };
                                                }
                                                return ch;
                                              })
                                            }
                                          }));

                                          // Clear the input after adding
                                          setCustomCodecValues(prev => ({ ...prev, [index]: '' }));
                                        }
                                      }
                                    }}
                                    variant="outlined"
                                    size="small"
                                    sx={{ mt: 1 }}
                                  >
                                    Add Codec(s)
                                  </Button>
                                </Box>
                              )}
                            </Box>

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
                        ))
                      )}

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
                                port: 42000 + prev.sdp!.channels.length * 2,
                                transportProtocol: 'RTP_AVP',
                                codecs: [0, 8, 18],
                                connectionAddress: '',
                                label: '',
                                packetTime: 20,
                                maxPacketTime: 20,
                                channelState: 'SEND',
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
                  />
                </Box>
              </>
            )}

            {(functionId === 'resolve-receiver-query' || functionId === 'resolve-sender-query') && (
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
                  value={typeof formData.ssrc === 'number' ? formData.ssrc : 0}
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
                  value={typeof formData.expectedValue === 'number' ? formData.expectedValue : ''}
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
                  value={typeof formData.acceptedMismatchPercentage === 'number' ? formData.acceptedMismatchPercentage : ''}
                  onChange={handleInputChange('acceptedMismatchPercentage')}
                  min={0}
                  max={100}
                  helperText="Acceptable mismatch percentage"
                />
                <TextInput
                  id="interactionKey"
                  label="Interaction Key"
                  value={formData.interactionKey || ''}
                  onChange={handleInputChange('interactionKey')}
                  required
                  placeholder="Enter interaction key"
                  helperText="Interaction key for the RTP session"
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
                  label="Request ID"
                  value={formData.requestId}
                  onChange={handleInputChange('requestId')}
                  placeholder="Auto-generated if empty"
                  helperText="Unique identifier for this request"
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
                  disabled={formData.automaticSourceAddressesGeneration}
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

                <NumberInput
                  id="streamsDuration"
                  label="Streams Duration (seconds)"
                  value={formData.streamsDuration || 30}
                  onChange={handleInputChange('streamsDuration')}
                  min={1}
                  helperText="Duration in seconds"
                />

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Configuration Options
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.automaticSourceAddressesGeneration || false}
                          onChange={(e) => handleInputChange('automaticSourceAddressesGeneration')(e.target.checked)}
                        />
                      }
                      label="Automatic Source Addresses Generation"
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
        )}

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
