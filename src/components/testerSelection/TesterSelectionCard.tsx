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
        border: isSelected ? 3 : 1,
        borderColor: isSelected ? `${TESTER_COLORS[testerType]}.main` : 'divider',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'visible',
        background: isSelected 
          ? `linear-gradient(135deg, ${TESTER_COLORS[testerType] === 'primary' ? 'rgba(25, 118, 210, 0.05)' : 
              TESTER_COLORS[testerType] === 'secondary' ? 'rgba(220, 0, 78, 0.05)' : 
              'rgba(46, 125, 50, 0.05)'} 0%, rgba(255, 255, 255, 0.9) 100%)`
          : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        '&:hover': disabled ? {} : {
          boxShadow: isSelected ? 8 : 6,
          transform: 'translateY(-8px) scale(1.02)',
          borderColor: `${TESTER_COLORS[testerType]}.main`,
          '& .card-icon': {
            transform: 'scale(1.1) rotate(5deg)',
          },
          '& .feature-list': {
            '& .MuiListItem-root': {
              transform: 'translateX(4px)',
            },
          },
        },
        '&::before': isSelected ? {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          background: `linear-gradient(45deg, ${TESTER_COLORS[testerType] === 'primary' ? '#1976d2, #42a5f5' : 
            TESTER_COLORS[testerType] === 'secondary' ? '#dc004e, #ff5983' : 
            '#2e7d32, #4caf50'})`,
          borderRadius: 'inherit',
          zIndex: -1,
          filter: 'blur(8px)',
          opacity: 0.6,
        } : {},
      }}
      onClick={() => !disabled && onSelect(testerType)}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1, position: 'relative' }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 100,
          height: 100,
          opacity: 0.1,
          background: `radial-gradient(circle, ${TESTER_COLORS[testerType] === 'primary' ? '#1976d2' : 
            TESTER_COLORS[testerType] === 'secondary' ? '#dc004e' : '#2e7d32'} 0%, transparent 70%)`,
          borderRadius: '0 16px 0 100%',
        }} />
        
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Box 
            color={`${TESTER_COLORS[testerType]}.main`}
            className="card-icon"
            sx={{
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              p: 1,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${TESTER_COLORS[testerType] === 'primary' ? 'rgba(25, 118, 210, 0.1)' : 
                TESTER_COLORS[testerType] === 'secondary' ? 'rgba(220, 0, 78, 0.1)' : 
                'rgba(46, 125, 50, 0.1)'} 0%, rgba(255, 255, 255, 0.5) 100%)`,
            }}
          >
            {TESTER_ICONS[testerType]}
          </Box>
          <Box flexGrow={1}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 0.5 }}>
              {title}
            </Typography>
            {isSelected && (
              <Chip
                icon={<CheckIcon />}
                label="Selected"
                size="small"
                color={TESTER_COLORS[testerType]}
                variant="filled"
                sx={{
                  fontWeight: 500,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                    '100%': { transform: 'scale(1)' },
                  },
                }}
              />
            )}
          </Box>
        </Box>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          paragraph 
          sx={{ 
            lineHeight: 1.6,
            mb: 2,
          }}
        >
          {description}
        </Typography>

        <Typography 
          variant="subtitle2" 
          gutterBottom 
          sx={{ 
            fontWeight: 600, 
            color: `${TESTER_COLORS[testerType]}.main`,
            mb: 1,
          }}
        >
          🎯 Key Features:
        </Typography>
        <List 
          dense 
          sx={{ py: 0 }} 
          className="feature-list"
        >
          {features.map((feature, index) => (
            <ListItem 
              key={index} 
              sx={{ 
                py: 0.25, 
                px: 0,
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: `${TESTER_COLORS[testerType]}.main`,
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={feature}
                primaryTypographyProps={{
                  variant: 'body2',
                  sx: { fontSize: '0.875rem', fontWeight: 500 },
                }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>

      <CardActions sx={{ justifyContent: 'center', pt: 0, pb: 2 }}>
        <Box
          sx={{
            width: '80%',
            height: 3,
            borderRadius: 1.5,
            background: isSelected
              ? `linear-gradient(90deg, ${TESTER_COLORS[testerType] === 'primary' ? '#1976d2' : 
                  TESTER_COLORS[testerType] === 'secondary' ? '#dc004e' : '#2e7d32'} 0%, ${
                  TESTER_COLORS[testerType] === 'primary' ? '#42a5f5' : 
                  TESTER_COLORS[testerType] === 'secondary' ? '#ff5983' : '#4caf50'} 100%)`
              : 'rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease-in-out',
          }}
        />
      </CardActions>
    </Card>
  );
};
