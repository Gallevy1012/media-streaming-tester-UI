import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
} from '@mui/material';
import { TesterSelectionCard } from './TesterSelectionCard';
import type { TesterType } from '../../types';

interface TesterSelectionProps {
  selectedTester?: TesterType;
  onTesterSelect: (testerType: TesterType) => void;
}

const TESTER_CONFIGS = {
  'sip-tester': {
    title: 'SIP functionality',
    description: 'Test Send/Receive SIP messages and query about these messages.',
    features: [
      'Manage your SIP testers',
      'Send SIP Requests',
      'Query your SIP testers',
    ],
  },
  'rtp-tester': {
    title: 'RTP functionality',
    description: 'Test Send/Receive RTP streams and query about these streams.',
    features: [
      'Manage your RTP testers',
      'Send/Receive RTP Streams via your RTP Testers',
      'Query your RTP Testers',
    ],
  },
  'media-tester': {
    title: 'RTP + SIP functionality',
    description: 'Send SIP messages and the tester will start stream rtp based on these messages, combined automatically the rtp tester into the sip tester',
    features: [
      'All the rtp tester and sip tester features',
    ],
  },
} as const;

export const TesterSelection: React.FC<TesterSelectionProps> = ({
  selectedTester,
  onTesterSelect,
}) => {
  return (
    <Paper 
      sx={{ 
        p: 4,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Box mb={4}>
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom
          sx={{
            fontWeight: 700,
            textAlign: 'center',
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          🔧 Select Testing Module
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            textAlign: 'center',
            maxWidth: 600,
            mx: 'auto',
            lineHeight: 1.6,
          }}
        >
          Choose the type of test you want to perform. Each module provides specialized testing capabilities 
          with comprehensive monitoring and analytics.
        </Typography>
      </Box>

      <Alert 
        severity="info" 
        sx={{ 
          mb: 4,
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)',
          border: '1px solid rgba(25, 118, 210, 0.2)',
          '& .MuiAlert-icon': {
            color: 'primary.main',
          },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          💡 <strong>Pro Tip:</strong> Select a testing module to configure and run your tests. 
          You can switch between modules at any time during your testing session.
        </Typography>
      </Alert>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 4,
          mb: 4,
        }}
      >
        {(Object.keys(TESTER_CONFIGS) as TesterType[]).map((testerType) => (
          <TesterSelectionCard
            key={testerType}
            testerType={testerType}
            title={TESTER_CONFIGS[testerType].title}
            description={TESTER_CONFIGS[testerType].description}
            features={[...TESTER_CONFIGS[testerType].features]}
            isSelected={selectedTester === testerType}
            onSelect={onTesterSelect}
          />
        ))}
      </Box>

      {selectedTester && (
        <Alert 
          severity="success" 
          sx={{ 
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(76, 175, 80, 0.05) 100%)',
            border: '1px solid rgba(46, 125, 50, 0.2)',
            '& .MuiAlert-icon': {
              color: 'success.main',
            },
            animation: 'slideInUp 0.5s ease-out',
            '@keyframes slideInUp': {
              from: {
                opacity: 0,
                transform: 'translateY(20px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            ✅ <strong>{TESTER_CONFIGS[selectedTester].title}</strong> selected successfully!
            Continue to the next step to configure your test parameters and begin testing.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};
