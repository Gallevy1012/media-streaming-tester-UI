import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  useTheme,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Send as SendIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { TesterType } from '../../types';

interface TesterFunction {
  id: string;
  name: string;
  description: string;
  path: string;
  category?: string;
}

interface TesterFunctionSelectionProps {
  testerType: TesterType;
  onFunctionSelect: (functionId: string) => void;
}

const TESTER_FUNCTIONS: Record<TesterType, TesterFunction[]> = {
  'sip-tester': [
    {
      id: 'send-invite',
      name: 'Send INVITE',
      description: 'Send a SIP INVITE message to establish a call',
      path: '/sip-tester/send-invite',
      category: 'Send SIP Message',
    },
    {
      id: 'send-bye',
      name: 'Send BYE',
      description: 'Send a SIP BYE message to terminate a call',
      path: '/sip-tester/send-bye',
      category: 'Send SIP Message',
    },
    {
      id: 'got-incoming-requests',
      name: 'Query Incoming Requests',
      description: 'Query incoming SIP requests received by the tester',
      path: '/sip-tester/got-incoming-requests',
      category: 'Query Tester',
    },
    {
      id: 'got-incoming-responses',
      name: 'Query Incoming Responses',
      description: 'Query incoming SIP responses received by the tester',
      path: '/sip-tester/got-incoming-responses',
      category: 'Query Tester',
    },
    {
      id: 'sent-outgoing-requests',
      name: 'Query Sent Requests',
      description: 'Query outgoing SIP requests sent by the tester',
      path: '/sip-tester/sent-outgoing-requests',
      category: 'Query Tester',
    },
    {
      id: 'sent-outgoing-responses',
      name: 'Query Sent Responses',
      description: 'Query outgoing SIP responses sent by the tester',
      path: '/sip-tester/sent-outgoing-responses',
      category: 'Query Tester',
    },
    {
      id: 'get-dialog-details',
      name: 'Get Dialog Details',
      description: 'Get detailed information about SIP dialogs',
      path: '/sip-tester/dialog-details',
      category: 'Tester Utils',
    },
  ],
  'rtp-tester': [
    {
      id: 'update-sender-destination',
      name: 'Update Sender Destination',
      description: 'Update the destination configuration for RTP sender',
      path: '/rtp-tester/update-sender-send-destination',
      category: 'Update Tester',
    },
    {
      id: 'resolve-receiver-query',
      name: 'Resolve Receiver Query',
      description: 'Query and resolve receiver status and statistics',
      path: '/rtp-tester/resolve-receiver-query',
      category: 'Query Tester',
    },
    {
      id: 'resolve-sender-query',
      name: 'Resolve Sender Query',
      description: 'Query and resolve sender status and statistics',
      path: '/rtp-tester/resolve-sender-query',
      category: 'Query Tester',
    },
    {
      id: 'stream-packets-count',
      name: 'Get Streamed Packets Count',
      description: 'Get the count of packets streamed for specific SSRCs',
      path: '/rtp-tester/stream-packets-count',
      category: 'Query Tester',
    },
    {
      id: 'get-statistics',
      name: 'Get RTP Statistics',
      description: 'Retrieve statistics for RTP streams',
      path: '/rtp-tester/statistics',
      category: 'Query Tester',
    },
  ],
  'media-tester': [
    {
      id: 'send-invite',
      name: 'Send INVITE',
      description: 'Send a SIP INVITE message to establish a call with media',
      path: '/media-tester/send-invite',
      category: 'Send SIP Message',
    },
    {
      id: 'send-bye',
      name: 'Send BYE',
      description: 'Send a SIP BYE message to terminate a call',
      path: '/media-tester/send-bye',
      category: 'Send SIP Message',
    },
    {
      id: 'got-incoming-requests',
      name: 'Query Incoming Requests',
      description: 'Query incoming SIP requests received by the media tester',
      path: '/media-tester/got-incoming-requests',
      category: 'Query Tester',
    },
    {
      id: 'got-incoming-responses',
      name: 'Query Incoming Responses',
      description: 'Query incoming SIP responses received by the media tester',
      path: '/media-tester/got-incoming-responses',
      category: 'Query Tester',
    },
    {
      id: 'sent-outgoing-requests',
      name: 'Query Sent Requests',
      description: 'Query outgoing SIP requests sent by the media tester',
      path: '/media-tester/sent-outgoing-requests',
      category: 'Query Tester',
    },
    {
      id: 'sent-outgoing-responses',
      name: 'Query Sent Responses',
      description: 'Query outgoing SIP responses sent by the media tester',
      path: '/media-tester/sent-outgoing-responses',
      category: 'Query Tester',
    },
    {
      id: 'resolve-receiver-query',
      name: 'Resolve Receiver Query',
      description: 'Query and resolve receiver status and statistics',
      path: '/media-tester/resolve-receiver-query',
      category: 'Query Tester',
    },
    {
      id: 'resolve-sender-query',
      name: 'Resolve Sender Query',
      description: 'Query and resolve sender status and statistics',
      path: '/media-tester/resolve-sender-query',
      category: 'Query Tester',
    },
    {
      id: 'get-dialog-details',
      name: 'Get Dialog Details',
      description: 'Get detailed information about SIP dialogs',
      path: '/media-tester/dialog-details',
      category: 'Tester Utils',
    },
  ],
};



export const TesterFunctionSelection: React.FC<TesterFunctionSelectionProps> = ({
  testerType,
  onFunctionSelect,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const functions = TESTER_FUNCTIONS[testerType] || [];

  // Group functions by category for all tester types
  const groupedFunctions = functions.reduce((groups, func) => {
    const category = func.category || 'Other Functions';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(func);
    return groups;
  }, {} as Record<string, TesterFunction[]>);

  const handleBack = () => {
    navigate('/');
  };

  const getTesterTitle = (type: TesterType) => {
    switch (type) {
      case 'sip-tester': return 'SIP Tester Functions';
      case 'rtp-tester': return 'RTP Tester Functions';
      case 'media-tester': return 'Media Tester Functions';
      default: return 'Tester Functions';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 2, mx: 'auto', maxWidth: '1600px' }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
          size="small"
        >
          Back to Tester Selection
        </Button>
        <Typography variant="h4" component="h1">
          {getTesterTitle(testerType)}
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Select a function to configure and execute. Each function has different complexity levels and parameter requirements.
      </Typography>

      {Object.keys(groupedFunctions).length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No functions available for {testerType}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ mb: 2 }}>
          {Object.entries(groupedFunctions).map(([category, funcs]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600, color: 'primary.main', textAlign: 'center' }}>
                {category}
              </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 2,
                minHeight: '200px',
              }}
            >
              {funcs.map((func) => (
                <Paper
                  key={func.id}
                  elevation={2}
                  sx={{
                    p: 2,
                    minHeight: '160px',
                    width: {
                      xs: '100%',
                      sm: '300px',
                      md: '280px',
                      lg: '260px',
                      xl: '240px',
                    },
                    maxWidth: '300px',
                    display: 'flex',  
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      elevation: 4,
                      transform: 'translateY(-2px)',
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                  onClick={() => onFunctionSelect(func.id)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600, flexGrow: 1, mr: 2 }}>
                      {func.name}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                    {func.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {func.path}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SendIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onFunctionSelect(func.id);
                      }}
                    >
                      Send
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        ))}
        </Box>
      )}
    </Box>
  );
};
