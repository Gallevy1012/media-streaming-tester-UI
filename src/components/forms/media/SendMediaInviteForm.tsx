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
  TextField,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Send as SendIcon, Security as SecurityIcon, ArrowBack as ArrowBackIcon, ExpandMore as ExpandMoreIcon, ContentCopy as ContentCopyIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { TextInput, Dropdown, NumberInput, MultiSelect } from '../../common';
import { AuthDialog } from '../../auth';
import { ColoredJsonViewer } from '../../response';
import { useAuthenticatedRequest } from '../../../hooks/useAuthenticatedRequest';
import { useAuth } from '../../../hooks/useAuth';
import { useTester } from '../../../contexts/TesterContext';
import { mediaTesterService, setMediaTesterAddDialogIdFunction } from '../../../services/mediaTesterService';
import type { TransportProtocol } from '../../../types';
import { IconButton, Tooltip } from '@mui/material';

interface SendMediaInviteFormProps {
  onTestComplete?: (result: any) => void;
  onBack?: () => void;
}

interface SendMediaInviteFormData {
  mediaTesterId: string;
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
      codecs?: number[]; // Add codecs array
      connectionAddress?: string;
      label?: string;
      packetTime?: number;
      maxPacketTime?: number;
      channelState?: 'SEND' | 'RECEIVE' | 'SEND_AND_RECEIVE' | 'INACTIVE';
      attributes?: Record<string, string>;
    }>;
  };
}

export const SendMediaInviteForm: React.FC<SendMediaInviteFormProps> = ({ onTestComplete, onBack }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [rawInviteText, setRawInviteText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [withCLine, setWithCLine] = useState(true);
  // Saved Messages State
  const [savedMessages, setSavedMessages] = useState<{ Name: string; Invite: string; source?: 'json' | 'manual' }[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<string | false>(false);

  const [formData, setFormData] = useState<SendMediaInviteFormData>({
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
      ],
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [customCodecValues, setCustomCodecValues] = useState<{[channelIndex: number]: string}>({});
  const [showCustomCodecInput, setShowCustomCodecInput] = useState<{[channelIndex: number]: boolean}>({});
  // State for invite name input
  const [inviteName, setInviteName] = useState("");
  // State for toggling save invite input
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State for grouped invites
  const [groupedInvites, setGroupedInvites] = useState<Record<string, { Name: string; Invite: string }[]>>({});
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveToGroup, setSaveToGroup] = useState<string>('');
  const [showResetDialog, setShowResetDialog] = useState(false);

  const { executeWithAuth } = useAuthenticatedRequest();
  const { state: authState } = useAuth();
  const { isAuthDialogOpen, closeAuthDialog } = useAuthenticatedRequest();
  const { addDialogId } = useTester();

  // Initialize Media service with dialog ID function
  useEffect(() => {
    console.log('SendMediaInviteForm: Setting up addDialogId function');
    setMediaTesterAddDialogIdFunction(addDialogId);
  }, [addDialogId]);

  // Load grouped invites on mount
  useEffect(() => {
    reloadInvites();
  }, []);

  // Reload invites from JSON file only when user clicks refresh
  const reloadInvites = async () => {
    try {
      // Load file-based invites from the correct path
      const response = await fetch('/invites.json?_=' + Date.now());
      const fileInvites = response.ok ? await response.json() : {};

      // Load user-saved invites from localStorage (grouped structure)
      let userGroupedInvites: Record<string, { Name: string; Invite: string }[]> = {};
      const local = localStorage.getItem('mediaSavedMessages');
      if (local) {
        try {
          userGroupedInvites = JSON.parse(local);
        } catch {
          userGroupedInvites = {};
        }
      }

      // Merge file invites and user invites
      const merged: Record<string, { Name: string; Invite: string }[]> = { ...fileInvites };

      // Add user invites to existing groups or create new groups
      Object.keys(userGroupedInvites).forEach(groupName => {
        if (merged[groupName]) {
          // Group exists, add user invites that don't already exist
          const existingNames = new Set(merged[groupName].map((invite) => invite.Name));
          const uniqueUserInvites = userGroupedInvites[groupName].filter((invite) =>
            !existingNames.has(invite.Name)
          );
          merged[groupName] = [...merged[groupName], ...uniqueUserInvites];
        } else {
          // New group, add all user invites
          merged[groupName] = userGroupedInvites[groupName];
        }
      });

      setGroupedInvites(merged);

      // Flatten for backward compatibility with existing savedMessages state
      const flattened: { Name: string; Invite: string }[] = [];
      Object.values(merged).forEach((groupInvites) => {
        flattened.push(...groupInvites);
      });
      setSavedMessages(flattened);

    } catch (e) {
      setGroupedInvites({});
      setSavedMessages([]);
    }
    setExpandedIndex(false);
  };

  // Load saved messages from localStorage on mount - improved for persistence
  useEffect(() => {
    const local = localStorage.getItem('mediaSavedMessages');
    if (local) {
      try {
        const parsedGroups = JSON.parse(local);
        // Update both groupedInvites and flatten for backward compatibility
        setGroupedInvites(prev => {
          const merged = { ...prev };
          Object.keys(parsedGroups).forEach(groupName => {
            if (merged[groupName]) {
              // Merge with existing groups, avoiding duplicates
              const existingNames = new Set(merged[groupName].map(invite => invite.Name));
              const uniqueUserInvites = parsedGroups[groupName].filter((invite: any) =>
                !existingNames.has(invite.Name)
              );
              merged[groupName] = [...merged[groupName], ...uniqueUserInvites];
            } else {
              merged[groupName] = parsedGroups[groupName];
            }
          });
          return merged;
        });

        // Also update flattened savedMessages
        const flattened: { Name: string; Invite: string }[] = [];
        Object.values(parsedGroups).forEach((groupInvites: any) => {
          flattened.push(...groupInvites);
        });
        setSavedMessages(prev => [...prev, ...flattened]);
      } catch {
        console.warn('Failed to parse saved messages from localStorage');
      }
    }
  }, []);

  // Save user-created messages to localStorage whenever they change - improved persistence
  useEffect(() => {
    // Only save if we have valid grouped invites
    if (Object.keys(groupedInvites).length === 0) return;

    // Extract only user-created groups/invites (not file-based ones)
    const userGroups: Record<string, { Name: string; Invite: string }[]> = {};

    Object.keys(groupedInvites).forEach(groupName => {
      const userInvitesInGroup = groupedInvites[groupName].filter(invite => {
        // A message is user-created if it's not in the original file-based invites
        // More robust check - avoid default file-based invite names
        const isFileBasedInvite = invite.Name.includes('VRSP') ||
                                 invite.Name.includes('ESFU') ||
                                 invite.Name.includes('RECORDER') ||
                                 invite.Name.includes('SUPERVISOR') ||
                                 invite.Name.includes('CISCO') ||
                                 invite.Name.includes('IMR') ||
                                 invite.Name.includes('NEAREND') ||
                                 invite.Name.includes('FAREND');
        return !isFileBasedInvite;
      });

      if (userInvitesInGroup.length > 0) {
        userGroups[groupName] = userInvitesInGroup;
      }
    });

    // Save to localStorage with error handling
    try {
      localStorage.setItem('mediaSavedMessages', JSON.stringify(userGroups));
    } catch (error) {
      console.error('Failed to save messages to localStorage:', error);
    }
  }, [groupedInvites]);

  // Generate Media INVITE message preview
  const generateMediaInvitePreview = (): string => {
    const { destinationAddress, customHeaders, sdp } = formData;

    // Basic Media headers
    const mediaRequestLine = `INVITE sip:${destinationAddress.ip}:${destinationAddress.port};transport=${destinationAddress.transportProtocol.toLowerCase()} SIP/2.0`;

    // Default headers that would typically be added by the server
    const defaultHeaders = [
      `Via: SIP/2.0/${destinationAddress.transportProtocol} [LOCAL_IP]:[LOCAL_PORT];branch=z9hG4bK[BRANCH_ID]`,
      `Max-Forwards: 70`,
      `To: <sip:${destinationAddress.ip}:${destinationAddress.port}>`,
      `From: <sip:[LOCAL_IP]:[LOCAL_PORT]>;tag=[FROM_TAG]`,
      `Call-ID: [CALL_ID]`,
      `CSeq: 1 INVITE`,
      `Contact: <sip:[LOCAL_IP]:[LOCAL_PORT];transport=${destinationAddress.transportProtocol.toLowerCase()}>`,
      `Content-Type: application/sdp`,
    ];

    // Add custom headers
    const customHeaderLines = Object.entries(customHeaders).map(([key, value]) => `${key}: ${value}`);

    // Generate SDP content
    const sdpContent = [
      `v=0`,
      `o=${sdp.origin.userName} ${sdp.origin.sessionId} ${sdp.origin.sessionVersion} ${sdp.origin.networkType} ${sdp.origin.addressType} ${sdp.origin.ip}`,
      `s=${sdp.sessionName}`,
      sdp.sessionInformation ? `i=${sdp.sessionInformation}` : null,
      withCLine ? `c=${sdp.connection.networkType} ${sdp.connection.addressType} ${sdp.connection.ip}` : null,
      `t=${sdp.timing.startTime} ${sdp.timing.stopTime}`,
    ].filter(Boolean);

    // Add basic media descriptions for channels (simplified)
    sdp.channels.forEach((channel) => {
      const codecs = channel.codecs || [];
      const payloadTypes = codecs.length > 0 ? codecs.join(' ') : '0';
      sdpContent.push(`m=${channel.mediaType} ${channel.port} RTP/AVP ${payloadTypes}`);

      if (channel.connectionAddress && channel.connectionAddress.trim()) {
        // You can adjust addressType if you support IP6
        sdpContent.push(`c=IN IP4 ${channel.connectionAddress.trim()}`);
      }

      // Add basic codec attributes
      if (codecs.length > 0) {
        codecs.forEach((codec) => {
          sdpContent.push(`a=rtpmap:${codec} ${codec}/8000`);
        });
      }      // Add sendrecv attribute based on channel state
      const sendrecv = channel.channelState === 'SEND' ? 'sendonly' :
                      channel.channelState === 'RECEIVE' ? 'recvonly' : 'sendrecv';
      sdpContent.push(`a=${sendrecv}`);
    });

    const sdpString = sdpContent.join('\r\n');
    const contentLength = new TextEncoder().encode(sdpString).length;

    // Combine all parts
    const mediaMessage = [
      mediaRequestLine,
      ...defaultHeaders,
      ...customHeaderLines,
      `Content-Length: ${contentLength}`,
      '', // Empty line before SDP
      sdpString
    ].join('\r\n');

    return mediaMessage;
  };

  // Media INVITE parsing function
  const parseMediaInvite = (mediaInviteText: string): Partial<SendMediaInviteFormData> | null => {
    try {
      setParseError(null);

      const lines = mediaInviteText.trim().split('\n');
      const parsed: Partial<SendMediaInviteFormData> = {
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

        // Parse Media headers
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

          console.log('🔍 Parsing To header:', trimmedLine);

          // Extract display name for the destination address alias
          // Try different patterns: "VRSP" or VRSP (with or without quotes)
          let displayName = null;

          // Pattern 1: "Display Name" <sip:...>
          const quotedMatch = trimmedLine.match(/To:\s*"([^"]+)"\s*<sip:/i);
          if (quotedMatch && quotedMatch[1]) {
            displayName = quotedMatch[1].trim();
            console.log('🔍 Found quoted display name:', displayName);
          } else {
            // Pattern 2: Display Name <sip:...> (without quotes)
            const unquotedMatch = trimmedLine.match(/To:\s*([^<]+?)\s*<sip:/i);
            if (unquotedMatch && unquotedMatch[1] && unquotedMatch[1].trim() !== '') {
              displayName = unquotedMatch[1].trim();
              console.log('🔍 Found unquoted display name:', displayName);
            }
          }

          if (displayName) {
            parsed.destinationAddress!.alias = displayName;
            console.log('🔍 Set destination alias to:', displayName);
          } else {
            console.log('🔍 No display name found in To header');
          }
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
        console.log('SDP Lines found:', sdpLines.length);
        console.log('SDP Lines:', sdpLines);
        const sdpParsed = parseSdpSection(sdpLines);
        console.log('SDP Parsed result:', sdpParsed);
        if (sdpParsed) {
          parsed.sdp = { ...parsed.sdp!, ...sdpParsed };
          console.log('Final parsed SDP:', parsed.sdp);
        }
      }

      return parsed;
    } catch (error) {
      console.error('Media parsing error:', error);
      setParseError(`Failed to parse Media INVITE: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  // SDP parsing function
  const parseSdpSection = (sdpLines: string[]) => {
    console.log('=== SDP PARSING START ===');
    console.log('Input SDP lines:', sdpLines);

    const sdp: any = {
      sessionVersion: 0,
      origin: {
        userName: 'test',
        sessionId: '1234567890',
        sessionVersion: 1,
        networkType: 'IN' as const,
        addressType: 'IP4' as 'IP6',
        ip: '127.0.0.1',
      },
      sessionName: 'Test Session',
      connection: {
        networkType: 'IN' as const,
        addressType: 'IP4' as 'IP6',
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
      console.log('Processing SDP line:', line);

      if (line.startsWith('v=')) {
        sdp.sessionVersion = parseInt(line.substring(2));
      } else if (line.startsWith('o=')) {
        // Parse origin: o=- 2142479003 635515518 IN IP4 10.231.242.146
        const parts = line.substring(2).split(' ');
        if (parts.length >= 6) {
          sdp.origin = {
            userName: parts[0] === '-' ? 'test' : parts[0],
            sessionId: parts[1],
            sessionVersion: parseInt(parts[2]),
            networkType: parts[3] as 'IN',
            addressType: parts[4] as 'IP4' | 'IP6',
            ip: parts[5],
          };
        }
      } else if (line.startsWith('s=')) {
        sdp.sessionName = line.substring(2) || 'Test Session';
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
        console.log('*** FOUND NEW MEDIA LINE ***:', line);
        const parts = line.substring(2).split(' ');
        console.log('Media line parts:', parts);

        if (parts.length >= 3) {
          // Save previous channel if exists
          if (currentChannel) {
            channelCount++;
            console.log(`Saving channel #${channelCount}:`, currentChannel);
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
          console.log('Codec parts from m= line:', codecParts);
          const codecs = codecParts.map(codec => parseInt(codec)).filter(codec => !isNaN(codec));
          console.log('Parsed codecs:', codecs);

          // If no codecs found, use default common codecs
          const finalCodecs = codecs.length > 0 ? codecs : [0, 8, 18];
          console.log('Final codecs (with defaults if needed):', finalCodecs);

          currentChannel = {
            mediaType: parts[0].toUpperCase(),
            port: parseInt(parts[1]),
            transportProtocol: transportProtocol,
            codecs: finalCodecs, // Use final codecs with defaults
            connectionAddress: '',
            attributes: {},
            label: '',
            packetTime: 20,
            maxPacketTime: 20,
            channelState: 'SEND_AND_RECEIVE',
          };
          console.log('Created new channel:', currentChannel);
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
              currentChannel.attributes![attrName] = attrValue;
            } else {
              currentChannel.attributes![attrLine] = '';
            }
          }
        }
      }
    }

    // Add the last channel
    if (currentChannel) {
      channelCount++;
      console.log(`Adding final channel #${channelCount}:`, currentChannel);
      sdp.channels.push(currentChannel);
    }

    console.log('=== FINAL PARSING RESULT ===');
    console.log('Total channels created:', sdp.channels.length);
    console.log('All channels:', sdp.channels);
    console.log('=== SDP PARSING END ===');

    // Filter out invalid channels (those without proper mediaType or port)
    const validChannels = sdp.channels.filter((channel: any) =>
      channel.mediaType &&
      channel.port &&
      channel.port > 0 &&
      channel.transportProtocol
    );

    console.log('Channels after filtering:', validChannels.length, validChannels);
    sdp.channels = validChannels;

    return sdp;
  };

  const handleAuthSuccess = () => {
    // Retry the request after successful authentication
    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  // Handle parsing and populating form
  const handleParseAndPopulate = () => {
    if (!rawInviteText.trim()) {
      setParseError('Please enter a Media INVITE message');
      return;
    }

    const parsed = parseMediaInvite(rawInviteText);
    if (parsed) {

      // Completely replace the form data with parsed data, keeping only the mediaTesterId
      setFormData(prev => ({
        mediaTesterId: prev.mediaTesterId, // Keep the existing tester ID
        destinationAddress: parsed.destinationAddress || prev.destinationAddress,
        customHeaders: parsed.customHeaders || {},
        sdp: parsed.sdp ? {
          ...parsed.sdp,
          // Ensure we only use parsed channels, not merge with existing
          channels: parsed.sdp.channels || []
        } : prev.sdp,
      }));


      // Debug log to help identify channel duplication
      console.log('Parsed SDP:', parsed.sdp);
      console.log('Parsed channels count:', parsed.sdp?.channels?.length || 0);
      console.log('Parsed channels:', parsed.sdp?.channels);

      setActiveTab(0); // Switch to manual form tab
      setParseError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const testResult = await executeWithAuth(async () => {
        if (!formData.mediaTesterId?.trim()) {
          throw new Error('Media Tester ID is required');
        }
        if (!formData.destinationAddress?.ip?.trim()) {
          throw new Error('Destination IP is required');
        }

        const requestPayload: any = {
          testerId: formData.mediaTesterId.trim(),
          destinationAddress: {
            ip: formData.destinationAddress.ip.trim(),
            port: formData.destinationAddress.port,
            transportProtocol: formData.destinationAddress.transportProtocol,
            alias: formData.destinationAddress.alias?.trim(),
          },
          customHeaders: formData.customHeaders || {},
          sdp: {
            ...formData.sdp,
            channels: formData.sdp.channels.map(channel => {
              // Ensure codecs array is never empty
              const finalCodecs = channel.codecs && channel.codecs.length > 0 ? channel.codecs : [0, 8, 18];

              // Ensure transport protocol is in the correct format for server
              let serverTransportProtocol = channel.transportProtocol;
              if (serverTransportProtocol === 'RTP_AVP') {
                // Keep as RTP_AVP - server should handle this format
              } else if (serverTransportProtocol === 'RTP/AVP') {
                serverTransportProtocol = 'RTP_AVP';
              }

              return {
                mediaType: channel.mediaType,
                port: channel.port,
                transportProtocol: serverTransportProtocol,
                codecs: finalCodecs, // Guaranteed to have at least default codecs
                connectionAddress: channel.connectionAddress,
                label: channel.label,
                packetTime: channel.packetTime,
                maxPacketTime: channel.maxPacketTime,
                channelState: channel.channelState,
                attributes: channel.attributes || {}, // Include all attributes
              };
            }),
          },
        };

        console.log('=== SENDING MEDIA INVITE REQUEST ===');
        console.log('Request payload:', JSON.stringify(requestPayload, null, 2));
        console.log('Channels being sent:', requestPayload.sdp.channels);
        requestPayload.sdp.channels.forEach((channel:any, index:any) => {
          console.log(`Channel ${index + 1}:`, {
            mediaType: channel.mediaType,
            port: channel.port,
            transportProtocol: channel.transportProtocol,
            codecs: channel.codecs,
            codecsLength: channel.codecs?.length || 0,
            codecsString: channel.codecs?.join(' ') || 'EMPTY'
          });

          // Validate that codecs are present
          if (!channel.codecs || channel.codecs.length === 0) {
            console.warn(`⚠️ Channel ${index + 1} has no codecs! This will result in incomplete m= line.`);
          } else {
            console.log(`✅ Channel ${index + 1} codecs OK: ${channel.codecs.join(' ')}`);
          }
        });
        console.log('=== END REQUEST DEBUG ===');

        const response = await mediaTesterService.sendInvite(requestPayload);

        return response;
      });

      if (testResult) {
        setResult(testResult);
        onTestComplete?.(testResult);
      }

    } catch (error: any) {
      console.error('Send Media Invite Form Error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for removing a saved invite by name
  const handleRemoveSavedInvite = (name: string) => {
    // Check if this is a user-created message (stored in localStorage grouped structure)
    const localGroups = JSON.parse(localStorage.getItem('mediaSavedMessages') || '{}');
    let isUserMessage = false;
    let foundInGroup = '';

    // Find which group contains this message
    Object.keys(localGroups).forEach(groupName => {
      if (localGroups[groupName].some((msg: any) => msg.Name === name)) {
        isUserMessage = true;
        foundInGroup = groupName;
      }
    });

    if (isUserMessage) {
      // Remove from localStorage grouped structure
      localGroups[foundInGroup] = localGroups[foundInGroup].filter((msg: any) => msg.Name !== name);

      // Remove empty groups
      if (localGroups[foundInGroup].length === 0) {
        delete localGroups[foundInGroup];
      }

      localStorage.setItem('mediaSavedMessages', JSON.stringify(localGroups));

      // Update grouped invites state
      setGroupedInvites(prev => {
        const updated = { ...prev };
        if (updated[foundInGroup]) {
          updated[foundInGroup] = updated[foundInGroup].filter(msg => msg.Name !== name);
          if (updated[foundInGroup].length === 0) {
            delete updated[foundInGroup];
          }
        }
        return updated;
      });
    }

    // Remove from current display
    setSavedMessages(prev => prev.filter(msg => msg.Name !== name));
  };

  // Handler for saving the current request with a name from the text box
  const handleSaveRequest = () => {
    const name = inviteName.trim();
    if (!name) return;
    if (savedMessages.some(msg => msg.Name === name)) {
      alert('A saved message with this name already exists. Please choose a different name.');
      return;
    }

    // Show dialog to select group
    setShowSaveDialog(true);
  };

  // Handler for confirming save with group selection
  const handleConfirmSave = () => {
    if (!saveToGroup.trim()) {
      alert('Please select or enter a group name.');
      return;
    }

    const name = inviteName.trim();
    const invite = generateMediaInvitePreview();
    const groupName = saveToGroup.trim();

    // Update grouped invites
    setGroupedInvites(prev => {
      const updated = { ...prev };
      if (!updated[groupName]) {
        updated[groupName] = [];
      }
      updated[groupName] = [...updated[groupName], { Name: name, Invite: invite }];
      return updated;
    });

    // Update flat savedMessages for backward compatibility
    setSavedMessages(prev => [...prev, { Name: name, Invite: invite }]);

    // Reset form
    setInviteName("");
    setShowSaveInput(false);
    setShowSaveDialog(false);
    setSaveToGroup('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // Handler for resetting invite form
  const handleResetInvite = () => {
    setShowResetDialog(true);
  };

  const handleConfirmReset = () => {
    // Reset form to default values
    setFormData({
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
        ],
      },
    });

    // Reset other states
    setWithCLine(true);
    setShowResetDialog(false);
  };

  return (
    <Box>
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Successfully saved
        </Alert>
      )}
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
              Send Media INVITE
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

        {/* Tabs for Manual Form vs Raw Invite vs Saved Messages */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={async (_, newValue) => {
              setActiveTab(newValue);
              if (newValue === 2) {
                await reloadInvites();
              }
            }}
          >
            <Tab label="Manual Form" />
            <Tab label="Send Existing Invite" />
            <Tab label="Your Saved Messages" />
          </Tabs>
        </Box>
        {activeTab === 0 && (
          // Manual Form Tab
          <form onSubmit={handleSubmit}>
            {/* Mobile Preview Accordion (shown on smaller screens) */}
            <Box sx={{ display: { xs: 'block', lg: 'none' }, mb: 3 }}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ContentCopyIcon fontSize="small" color="primary" />
                    <Typography variant="h6" color="primary">
                      🔍 Media INVITE Preview
                    </Typography>
                    <Chip
                      label="Live"
                      size="small"
                      color="primary"
                      variant="filled"
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Live preview of your Media INVITE message. Values in [BRACKETS] are auto-generated.
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      backgroundColor: '#fafafa',
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      maxHeight: '40vh',
                      overflow: 'auto',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Generated Message
                      </Typography>
                      <Box
                        component="span"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(generateMediaInvitePreview());
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '0.75rem',
                          color: 'primary.main',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: 1,
                          backgroundColor: '#fff',
                          border: '1px solid #e0e0e0',
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white',
                          }
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                        Copy
                      </Box>
                    </Box>
                    <Typography
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        lineHeight: 1.3,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        margin: 0,
                        color: '#333',
                      }}
                    >
                      {generateMediaInvitePreview()}
                    </Typography>
                  </Paper>
                </AccordionDetails>
              </Accordion>
              {/* Add Save Request and Reset button below the mobile preview */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                {!showSaveInput && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      onClick={handleResetInvite}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      Reset Invite
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => setShowSaveInput(true)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                      Save Request
                    </Button>
                  </Box>
                )}
                {showSaveInput && (
                  saveSuccess ? (
                    <Alert severity="success" sx={{ minWidth: 180 }}>
                      Successfully saved
                    </Alert>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <TextField
                        size="small"
                        label="Invite Name"
                        variant="outlined"
                        value={inviteName}
                        onChange={e => setInviteName(e.target.value)}
                        sx={{ minWidth: 180, background: '#fff', borderRadius: 2 }}
                        inputProps={{ maxLength: 64 }}
                        autoFocus
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handleSaveRequest}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        disabled={!inviteName.trim() || savedMessages.some(msg => msg.Name === inviteName.trim())}
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="small"
                        onClick={() => { setShowSaveInput(false); setInviteName(""); }}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )
                )}
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '3fr 2.5fr' },
                gap: 3,
                alignItems: 'start',
              }}
            >

              {/* Right Column - Form Fields */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 3,
              }}
            >
              <TextInput
                id="mediaTesterId"
                label="Media Tester ID"
                value={formData.mediaTesterId}
                onChange={(value) => setFormData(prev => ({ ...prev, mediaTesterId: value }))}
                placeholder="Enter Media Tester ID"
                helperText="UUID of the Media tester"
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
                }}
              ))}
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
              min={0}
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



                <Accordion sx={{ mt: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Connection Configuration</Typography>
                </AccordionSummary>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={withCLine}
                        onChange={(_, checked) => setWithCLine(checked)}
                        color="primary"
                      />
                    }
                    label="With C-line on the top (Connection Information)"
                    sx={{ mb: 2 }}
                  />
                  {withCLine && (
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
                      label="Address Type (Optional)"
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
                      helperText="IP address type (Optional, defaults to IPv4 if not specified)"
                    />

                    <TextInput
                      id="connection-ip"
                      label="Connection IP (Optional)"
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
                      helperText="Connection IP address (Optional)"
                    />
                  </Box>
                </AccordionDetails>)}
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
                    {formData.sdp.channels.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          No channels configured. Add a channel to get started, or use "Parse & Use INVITE" to extract channels from an existing SIP message.
                        </Typography>
                      </Box>
                    ) : (
                      formData.sdp.channels.map((channel, index) => (
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
                            value={channel.transportProtocol || 'RTP_AVP'}
                            onChange={(value) => setFormData(prev => ({
                              ...prev,
                              sdp: {
                                ...prev.sdp,
                                channels: prev.sdp.channels.map((ch, i) =>
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
                                      ...prev.sdp,
                                      channels: prev.sdp.channels.map((ch, i) =>
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
                                      ...prev.sdp,
                                      channels: prev.sdp.channels.map((ch, i) =>
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
                                  placeholder="Enter codec number(s) (e.g., 99 or 96,97,98)"
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
                                            ...prev.sdp,
                                            channels: prev.sdp.channels.map((ch, i) => {
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
                                ...prev.sdp,
                                channels: prev.sdp.channels.map((ch, i) =>
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
                      </Box>
                    ))
                    )}

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
                              port: 42000 + prev.sdp.channels.length * 2,
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
            </Box>
          </Box>

              {/* Left Column - SIP Message Preview */}
              <Box sx={{
                position: 'sticky',
                top: 0,
                height: 'fit-content',
                display: { xs: 'none', lg: 'block' }
              }}>
                <Box sx={{ border: '2px solid #1976d2', borderRadius: 2, backgroundColor: '#fff' }}>
                  <Box
                    sx={{
                      backgroundColor: 'rgba(25,118,210,0.1)',
                      borderRadius: '8px 8px 0 0',
                      p: 2,
                      borderBottom: '1px solid #e0e0e0'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ContentCopyIcon fontSize="small" color="primary" />
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                        🔍 SIP INVITE Preview
                      </Typography>
                      <Chip
                        label="Live"
                        size="small"
                        color="primary"
                        variant="filled"
                        sx={{ ml: 1, fontWeight: 500 }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Live preview of your SIP INVITE message. Values in [BRACKETS] are auto-generated.
                    </Typography>
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: '#fafafa',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        height: '60vh',
                        overflow: 'auto',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Generated Message
                        </Typography>
                        <Box
                          component="span"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(generateMediaInvitePreview());
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '0.75rem',
                            color: 'primary.main',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 1,
                            backgroundColor: '#fff',
                            border: '1px solid #e0e0e0',
                            '&:hover': {
                              backgroundColor: 'primary.main',
                              color: 'white',
                            }
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                          Copy
                        </Box>
                      </Box>
                      <Typography
                        component="pre"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.75rem',
                          lineHeight: 1.3,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          margin: 0,
                          color: '#333',
                        }}
                      >
                        {generateMediaInvitePreview()}
                      </Typography>
                      {/* Add Save Request and Reset button below the desktop preview */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 22, flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                        {!showSaveInput && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              onClick={handleResetInvite}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                              Reset Invite
                            </Button>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => setShowSaveInput(true)}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                              Save Request
                            </Button>
                          </Box>
                        )}
                        {showSaveInput && (
                          saveSuccess ? (
                            <Alert severity="success" sx={{ minWidth: 180 }}>
                              Successfully saved
                            </Alert>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <TextField
                                size="small"
                                label="Invite Name"
                                variant="outlined"
                                value={inviteName}
                                onChange={e => setInviteName(e.target.value)}
                                sx={{ minWidth: 180, background: '#fff', borderRadius: 2 }}
                                inputProps={{ maxLength: 64 }}
                                autoFocus
                              />
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={handleSaveRequest}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                disabled={!inviteName.trim() || savedMessages.some(msg => msg.Name === inviteName.trim())}
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="outlined"
                                color="secondary"
                                size="small"
                                onClick={() => { setShowSaveInput(false); setInviteName(""); }}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                              >
                                Cancel
                              </Button>
                            </Box>
                          )
                        )}
                      </Box>
                    </Paper>
                  </Box>
                </Box>
              </Box>


              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gridColumn: { xs: '1 / -1' } }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              disabled={isLoading}
              sx={{ minWidth: 150 }}
            >
              {isLoading ? 'Sending...' : 'Send REQUEST'}
            </Button>
          </Box>
            </Box>
          </form>
        )}
        {activeTab === 1 && (
          // Raw Invite Tab
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
                label="SIP Tester ID"
                value={formData.mediaTesterId}
                onChange={(value) => setFormData(prev => ({ ...prev, mediaTesterId: value }))}
                placeholder="Enter SIP Tester ID"
                helperText="UUID of the SIP tester that will send this invite"
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
                disabled={!rawInviteText.trim() || !formData.mediaTesterId.trim()}
              >
                Parse & Use INVITE
              </Button>

              {saveSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Invite saved successfully!
                </Alert>
              )}
            </Box>

            {rawInviteText && formData.mediaTesterId && (
              <Box sx={{ mt: 3 }}>
                <Alert severity="info">
                  Click "Parse & Use INVITE" to extract the invite details and switch to the manual form, then click "Send INVITE" to execute it.
                </Alert>
              </Box>
            )}
          </Box>
        )}
         {activeTab === 2 && (
           // Saved Messages Tab with Groups
           <Box>
             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
               <Typography variant="h6">Your Saved Media INVITE Messages</Typography>
               <Tooltip title="Reload invites from file">
                 <IconButton onClick={reloadInvites} size="small" color="primary">
                   <RefreshIcon />
                 </IconButton>
               </Tooltip>
             </Box>

             {/* Group Selection Dropdown */}
             <Box sx={{ mb: 3 }}>
             </Box>

             {Object.keys(groupedInvites).length === 0 ? (
               <Typography color="text.secondary">No saved invites found.</Typography>
             ) : (
               <Box>
                                {Object.entries(groupedInvites).map(([groupName, groupInvites]) => (
                  <Box key={groupName} sx={{ mb: 3 }}>
                    <Accordion sx={{ mb: 1 }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          background: 'linear-gradient(90deg, #e3f2fd 0%, #f5fafd 100%)',
                          borderRadius: 2,
                          '&:hover': {
                            background: 'linear-gradient(90deg, #bbdefb 0%, #e1f5fe 100%)',
                          },
                        }}
                      >
                        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                          📁 {groupName} ({groupInvites.length} invites)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box>
                          {groupInvites.map((msg, idx) => (
                            <Accordion
                              key={`${groupName}-${msg.Name}`}
                              expanded={expandedIndex === `${groupName}-${idx}`}
                              onChange={async (_, isExpanded) => {
                                await reloadInvites();
                                setExpandedIndex(isExpanded ? `${groupName}-${idx}` : false);
                              }}
                              sx={{ mb: 1 }}
                            >
                              <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                  background: expandedIndex === `${groupName}-${idx}`
                                    ? 'linear-gradient(90deg, #f3e5f5 0%, #fce4ec 100%)'
                                    : '#fafbfc',
                                  borderRadius: 1,
                                  transition: 'background 0.2s',
                                  '&:hover': {
                                    background: 'linear-gradient(90deg, #f3e5f5 0%, #fce4ec 100%)',
                                  },
                                }}
                              >
                                <Typography sx={{ fontWeight: 500, color: '#7b1fa2' }}>
                                  {msg.Name}
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <TextField
                                  fullWidth
                                  multiline
                                  rows={12}
                                  value={msg.Invite}
                                  InputProps={{ readOnly: true }}
                                  label="SIP INVITE Message"
                                  sx={{ mb: 2, fontFamily: 'monospace', background: '#f7f7fa', borderRadius: 1 }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                  <Button
                                    variant="contained"
                                    startIcon={<ContentCopyIcon />}
                                    onClick={() => {
                                      setRawInviteText(msg.Invite);
                                      setActiveTab(1);
                                    }}
                                  >
                                    Parse & Use Invite
                                  </Button>
                                  {(() => {
                                    // Check if this message is user-created (in localStorage)
                                    const localGroups = JSON.parse(localStorage.getItem('sipSavedMessages') || '{}');
                                    return localGroups[groupName]?.some((m: any) => m.Name === msg.Name);
                                  })() && (
                                    <Button
                                      variant="outlined"
                                      color="error"
                                      onClick={() => handleRemoveSavedInvite(msg.Name)}
                                      sx={{ minWidth: 0, padding: '6px 8px' }}
                                    >
                                      <span role="img" aria-label="Delete">🗑️</span>
                                    </Button>
                                  )}
                                </Box>
                              </AccordionDetails>
                            </Accordion>
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                ))}
               </Box>
             )}
           </Box>
         )}

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

      {/* Save Invite Dialog */}
      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save SIP INVITE to Group</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Invite Name"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              sx={{ mb: 2 }}
              autoFocus
            />
            <FormControl fullWidth>
              <InputLabel>Select Group</InputLabel>
              <Select
                value={saveToGroup}
                label="Select Group"
                onChange={(e) => setSaveToGroup(e.target.value)}
              >
                {Object.keys(groupedInvites).map((groupName) => (
                  <MenuItem key={groupName} value={groupName}>
                    {groupName}
                  </MenuItem>
                ))}
                <MenuItem value="">
                  <em>Create new group...</em>
                </MenuItem>
              </Select>
            </FormControl>
            {!saveToGroup && (
              <TextField
                fullWidth
                label="New Group Name"
                value={saveToGroup}
                onChange={(e) => setSaveToGroup(e.target.value)}
                sx={{ mt: 2 }}
                placeholder="Enter new group name"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmSave}
            variant="contained"
            disabled={!inviteName.trim() || !saveToGroup.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Invite Dialog */}
      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)}>
        <DialogTitle>Reset Media INVITE Form</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset the invite form? All current form data will be lost and reset to default values.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)}>Cancel</Button>
          <Button onClick={handleConfirmReset} variant="contained" color="warning">
            Yes, Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
