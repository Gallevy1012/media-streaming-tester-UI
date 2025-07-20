import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Phone as SipIcon,
  VolumeUp as RtpIcon,
  VideoFile as MediaIcon,
} from '@mui/icons-material';
import type { TesterType } from '../../types';

interface TesterSelectionCardProps {
  testerType: TesterType;
  title: string;
  description: string;
  features: string[];
  isSelected?: boolean;
  disabled?: boolean;
  onSelect: (testerType: TesterType) => void;
}

const TESTER_ICONS: Record<TesterType, React.ReactNode> = {
  'sip-tester': <SipIcon fontSize="large" />,
  'rtp-tester': <RtpIcon fontSize="large" />,
  'media-tester': <MediaIcon fontSize="large" />,
};

const TESTER_COLORS: Record<TesterType, 'primary' | 'secondary' | 'success'> = {
  'sip-tester': 'primary',
  'rtp-tester': 'secondary', 
  'media-tester': 'success',
};

export const TesterSelectionCard: React.FC<TesterSelectionCardProps> = ({
  testerType,
  title,
  description,
  features,
  isSelected = false,
  disabled = false,
  onSelect,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? `${TESTER_COLORS[testerType]}.main` : 'divider',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s',
        '&:hover': disabled ? {} : {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => !disabled && onSelect(testerType)}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box color={`${TESTER_COLORS[testerType]}.main`}>
            {TESTER_ICONS[testerType]}
          </Box>
          <Box flexGrow={1}>
            <Typography variant="h6" component="h3">
              {title}
            </Typography>
            {isSelected && (
              <Chip
                icon={<CheckIcon />}
                label="Selected"
                size="small"
                color={TESTER_COLORS[testerType]}
                variant="filled"
              />
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {description}
        </Typography>

        <Typography variant="subtitle2" gutterBottom>
          Key Features:
        </Typography>
        <List dense sx={{ py: 0 }}>
          {features.map((feature, index) => (
            <ListItem key={index} sx={{ py: 0.25, px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={feature}
                primaryTypographyProps={{
                  variant: 'body2',
                  color: 'text.secondary',
                }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Button
          fullWidth
          variant={isSelected ? 'contained' : 'outlined'}
          color={TESTER_COLORS[testerType]}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(testerType);
          }}
        >
          {isSelected ? 'Selected' : 'Select'}
        </Button>
      </CardActions>
    </Card>
  );
};
