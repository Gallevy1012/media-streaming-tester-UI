import React, { useState, useEffect, useCallback } from 'react';
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

interface IpAddressInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  tooltip?: string;
  size?: 'small' | 'medium';
  placeholder?: string;
  supportIpv6?: boolean;
  allowHostnames?: boolean;
}

export const IpAddressInput: React.FC<IpAddressInputProps> = ({
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
  placeholder,
  supportIpv6 = true,
  allowHostnames = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [ipVersion, setIpVersion] = useState<'IPv4' | 'IPv6' | 'Hostname' | null>(null);

  const detectIpType = useCallback((ip: string): 'IPv4' | 'IPv6' | 'Hostname' | null => {
    if (!ip) return null;
    
    // IPv4 pattern
    const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Pattern.test(ip)) {
      return 'IPv4';
    }
    
    // IPv6 pattern (simplified)
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    if (ipv6Pattern.test(ip) || ip.includes('::')) {
      return 'IPv6';
    }
    
    // Hostname pattern
    if (allowHostnames) {
      const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (hostnamePattern.test(ip)) {
        return 'Hostname';
      }
    }
    
    return null;
  }, [allowHostnames]);

  useEffect(() => {
    setInputValue(value);
    setIpVersion(detectIpType(value));
  }, [value, detectIpType]);

  const isValidIpv4 = (ip: string): boolean => {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    
    return parts.every(part => {
      const num = parseInt(part, 10);
      return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
    });
  };

  const isValidIpv6 = (ip: string): boolean => {
    // Basic IPv6 validation
    if (ip.includes(':::')) return false;
    if (ip.split('::').length > 2) return false;
    
    const parts = ip.split(':');
    if (parts.length > 8) return false;
    
    return parts.every(part => {
      if (part === '') return true; // Empty parts are valid in compressed notation
      return /^[0-9a-fA-F]{1,4}$/.test(part);
    });
  };

  const isValidHostname = (hostname: string): boolean => {
    if (hostname.length > 253) return false;
    if (hostname.endsWith('.')) {
      hostname = hostname.slice(0, -1);
    }
    
    const labels = hostname.split('.');
    return labels.every(label => {
      if (label.length === 0 || label.length > 63) return false;
      if (label.startsWith('-') || label.endsWith('-')) return false;
      return /^[a-zA-Z0-9-]+$/.test(label);
    });
  };

  const validateInput = (ip: string): string | null => {
    if (!ip) return null;
    
    const type = detectIpType(ip);
    
    switch (type) {
      case 'IPv4': {
        return isValidIpv4(ip) ? null : 'Invalid IPv4 address format';
      }
      case 'IPv6': {
        if (!supportIpv6) return 'IPv6 addresses are not supported';
        return isValidIpv6(ip) ? null : 'Invalid IPv6 address format';
      }
      case 'Hostname': {
        if (!allowHostnames) return 'Hostnames are not allowed';
        return isValidHostname(ip) ? null : 'Invalid hostname format';
      }
      default: {
        const supportedFormats = ['IPv4'];
        if (supportIpv6) supportedFormats.push('IPv6');
        if (allowHostnames) supportedFormats.push('hostname');
        return `Please enter a valid ${supportedFormats.join(' or ')} address`;
      }
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setIpVersion(detectIpType(newValue));
    onChange(newValue);
  };

  const validationError = error || validateInput(inputValue);

  const getPlaceholder = (): string => {
    if (placeholder) return placeholder;
    
    const examples: string[] = ['192.168.1.1'];
    if (supportIpv6) examples.push('2001:db8::1');
    if (allowHostnames) examples.push('example.com');
    
    return `e.g., ${examples.join(', ')}`;
  };

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
        {ipVersion && (
          <Chip
            label={ipVersion}
            size="small"
            variant="outlined"
            color={ipVersion === 'IPv4' ? 'primary' : ipVersion === 'IPv6' ? 'secondary' : 'default'}
          />
        )}
      </Box>
      
      <TextField
        id={id}
        value={inputValue}
        onChange={handleChange}
        placeholder={getPlaceholder()}
        size={size}
        fullWidth
        error={!!validationError}
        inputProps={{
          autoComplete: 'off',
          spellCheck: false,
        }}
      />
      
      {(validationError || helperText) && (
        <FormHelperText>
          {validationError || helperText}
        </FormHelperText>
      )}
      
      {!validationError && inputValue && (
        <Box mt={0.5}>
          <Typography variant="caption" color="text.secondary">
            {ipVersion === 'IPv4' && 'Valid IPv4 address'}
            {ipVersion === 'IPv6' && 'Valid IPv6 address'}
            {ipVersion === 'Hostname' && 'Valid hostname'}
          </Typography>
        </Box>
      )}
    </FormControl>
  );
};
