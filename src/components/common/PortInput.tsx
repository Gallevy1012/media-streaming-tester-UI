import React, { useState, useEffect } from 'react';
import {
  FormControl,
  TextField,
  FormHelperText,
  Tooltip,
  Box,
  InputLabel,
  Typography,
  Chip,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

interface PortInputProps {
  id: string;
  label: string;
  value: number | '';
  onChange: (value: number | '') => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  tooltip?: string;
  size?: 'small' | 'medium';
  placeholder?: string;
  minPort?: number;
  maxPort?: number;
  showPortType?: boolean;
}

type PortType = 'System' | 'Registered' | 'Dynamic' | 'Reserved';

const PORT_RANGES = {
  System: { min: 1, max: 1023, description: 'System/Well-known ports' },
  Registered: { min: 1024, max: 49151, description: 'Registered/User ports' },
  Dynamic: { min: 49152, max: 65535, description: 'Dynamic/Private ports' },
  Reserved: { min: 0, max: 0, description: 'Reserved port' },
};

const COMMON_PORTS: Record<number, string> = {
  21: 'FTP',
  22: 'SSH',
  23: 'Telnet',
  25: 'SMTP',
  53: 'DNS',
  80: 'HTTP',
  110: 'POP3',
  143: 'IMAP',
  443: 'HTTPS',
  993: 'IMAPS',
  995: 'POP3S',
  5060: 'SIP',
  5061: 'SIP-TLS',
  8080: 'HTTP Alt',
};

export const PortInput: React.FC<PortInputProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  tooltip,
  size = 'medium',
  placeholder = 'e.g., 80, 443, 5060',
  minPort = 42000,
  maxPort = 62000,
  showPortType = true,
}) => {
  const [inputValue, setInputValue] = useState(value === '' ? '' : String(value));

  useEffect(() => {
    setInputValue(value === '' ? '' : String(value));
  }, [value]);

  const getPortType = (port: number): PortType => {
    if (port === 0) return 'Reserved';
    if (port >= 1 && port <= 1023) return 'System';
    if (port >= 1024 && port <= 49151) return 'Registered';
    if (port >= 42000 && port <= 62000) return 'Dynamic';
    return 'System'; // fallback
  };

  const getPortTypeColor = (type: PortType): 'primary' | 'secondary' | 'warning' | 'error' => {
    switch (type) {
      case 'System': return 'warning';
      case 'Registered': return 'primary';
      case 'Dynamic': return 'secondary';
      case 'Reserved': return 'error';
    }
  };

  const validatePort = (portStr: string): string | null => {
    if (!portStr) return null;
    
    const port = parseInt(portStr, 10);
    
    if (isNaN(port)) {
      return 'Please enter a valid port number';
    }
    
    if (port < 42000 || port > 62000) {
      return 'Port must be between 42000 and 62000';
    }
    
    if (port < minPort) {
      return `Port must be at least ${minPort}`;
    }
    
    if (port > maxPort) {
      return `Port cannot exceed ${maxPort}`;
    }
    
    return null;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    
    if (newValue === '') {
      onChange('');
      return;
    }
    
    const port = parseInt(newValue, 10);
    if (!isNaN(port)) {
      onChange(port);
    }
  };

  const validationError = error || validatePort(inputValue);
  const currentPort = typeof value === 'number' ? value : null;
  const portType = currentPort !== null ? getPortType(currentPort) : null;
  const commonPortName = currentPort !== null ? COMMON_PORTS[currentPort] : null;

  return (
    <FormControl fullWidth error={!!validationError} disabled={disabled} size={size}>
      <Box display="flex" alignItems="center" gap={1} mb={1}>
        <InputLabel shrink>
          {label}{required ? ' *' : ''}
        </InputLabel>
        {tooltip && (
          <Tooltip title={tooltip} placement="top">
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        )}
        {showPortType && portType && (
          <Tooltip 
            title={`${PORT_RANGES[portType].description} (${PORT_RANGES[portType].min}-${PORT_RANGES[portType].max})`}
            placement="top"
          >
            <Chip
              label={portType}
              size="small"
              variant="outlined"
              color={getPortTypeColor(portType)}
            />
          </Tooltip>
        )}
        {commonPortName && (
          <Chip
            label={commonPortName}
            size="small"
            variant="filled"
            color="info"
          />
        )}
      </Box>
      
      <TextField
        id={id}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        type="number"
        size={size}
        fullWidth
        error={!!validationError}
        inputProps={{
          min: 0,
          max: 65535,
          step: 1,
        }}
      />
      
      {(validationError || helperText) && (
        <FormHelperText>
          {validationError || helperText}
        </FormHelperText>
      )}
      
      {!validationError && currentPort !== null && showPortType && (
        <Box mt={0.5}>
          <Typography variant="caption" color="text.secondary">
            {PORT_RANGES[portType!].description}
            {portType === 'System' && ' - May require elevated privileges'}
          </Typography>
        </Box>
      )}
    </FormControl>
  );
};
