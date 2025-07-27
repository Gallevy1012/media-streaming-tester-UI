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
    <Paper sx={{ p: 3 }}>
      <Box mb={3}>
        <Typography variant="h5" component="h2" gutterBottom>
          Select Testing Module
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose the type of test you want to perform. Each module provides specialized testing capabilities.
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Select a testing module to configure and run your tests. You can switch between modules at any time.
        </Typography>
      </Alert>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3
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
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>{TESTER_CONFIGS[selectedTester].title}</strong> selected.
            Continue to the next step to configure your test parameters.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};
