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
import { Info as InfoIcon, Link as LinkIcon } from '@mui/icons-material';

interface UriInputProps {
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
  allowedSchemes?: string[];
  requireScheme?: boolean;
  showUriParts?: boolean;
}

interface UriParts {
  scheme?: string;
  host?: string;
  port?: number;
  path?: string;
  query?: string;
  fragment?: string;
}

export const UriInput: React.FC<UriInputProps> = ({
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
  placeholder = 'e.g., sip:user@example.com:5060, https://api.example.com/v1',
  allowedSchemes = ['sip', 'sips', 'http', 'https', 'tel'],
  requireScheme = true,
  showUriParts = true,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [uriParts, setUriParts] = useState<UriParts | null>(null);

  useEffect(() => {
    setInputValue(value);
    setUriParts(parseUri(value));
  }, [value]);

  const parseUri = (uri: string): UriParts | null => {
    if (!uri) return null;

    try {
      // Try to parse as URL first
      const url = new URL(uri);
      return {
        scheme: url.protocol.slice(0, -1), // Remove trailing colon
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : undefined,
        path: url.pathname,
        query: url.search ? url.search.slice(1) : undefined,
        fragment: url.hash ? url.hash.slice(1) : undefined,
      };
    } catch {
      // If URL parsing fails, try manual parsing for SIP URIs
      const sipMatch = uri.match(/^(sips?):([^@]+@)?([^:;?]+)(?::(\d+))?([^?]*)?(?:\?([^#]*))?(?:#(.*))?$/);
      if (sipMatch) {
        return {
          scheme: sipMatch[1],
          host: sipMatch[3],
          port: sipMatch[4] ? parseInt(sipMatch[4], 10) : undefined,
          path: sipMatch[5] || undefined,
          query: sipMatch[6] || undefined,
          fragment: sipMatch[7] || undefined,
        };
      }
      
      // Try to extract scheme at least
      const schemeMatch = uri.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/);
      if (schemeMatch) {
        return {
          scheme: schemeMatch[1],
        };
      }
      
      return null;
    }
  };

  const validateUri = (uri: string): string | null => {
    if (!uri) return null;

    const parts = parseUri(uri);
    
    if (requireScheme && !parts?.scheme) {
      return 'URI must include a scheme (e.g., sip:, https:)';
    }
    
    if (parts?.scheme && allowedSchemes.length > 0 && !allowedSchemes.includes(parts.scheme)) {
      return `Scheme must be one of: ${allowedSchemes.join(', ')}`;
    }

    // Basic URI format validation
    if (parts?.scheme) {
      const schemePattern = /^[a-zA-Z][a-zA-Z0-9+.-]*$/;
      if (!schemePattern.test(parts.scheme)) {
        return 'Invalid scheme format';
      }
    }

    // Port validation
    if (parts?.port !== undefined && (parts.port < 42000 || parts.port > 62000)) {
      return 'Port must be between 42000 and 62000';
    }

    // SIP-specific validations
    if (parts?.scheme === 'sip' || parts?.scheme === 'sips') {
      if (!parts.host) {
        return 'SIP URI must include a host';
      }
    }

    return null;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    setUriParts(parseUri(newValue));
    onChange(newValue);
  };

  const validationError = error || validateUri(inputValue);

  const getSchemeColor = (scheme: string): 'primary' | 'secondary' | 'success' | 'warning' => {
    switch (scheme.toLowerCase()) {
      case 'https':
      case 'sips':
        return 'success';
      case 'http':
      case 'sip':
        return 'primary';
      case 'tel':
        return 'secondary';
      default:
        return 'warning';
    }
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
        {uriParts?.scheme && (
          <Chip
            icon={<LinkIcon />}
            label={uriParts.scheme.toUpperCase()}
            size="small"
            variant="outlined"
            color={getSchemeColor(uriParts.scheme)}
          />
        )}
      </Box>
      
      <TextField
        id={id}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        size={size}
        fullWidth
        error={!!validationError}
        inputProps={{
          autoComplete: 'url',
          spellCheck: false,
        }}
      />
      
      {showUriParts && uriParts && !validationError && (
        <Box mt={1}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {uriParts.host && (
              <Typography variant="caption" color="text.secondary">
                Host: <strong>{uriParts.host}</strong>
              </Typography>
            )}
            {uriParts.port && (
              <Typography variant="caption" color="text.secondary">
                Port: <strong>{uriParts.port}</strong>
              </Typography>
            )}
            {uriParts.path && uriParts.path !== '/' && (
              <Typography variant="caption" color="text.secondary">
                Path: <strong>{uriParts.path}</strong>
              </Typography>
            )}
          </Box>
        </Box>
      )}
      
      {(validationError || helperText) && (
        <FormHelperText>
          {validationError || helperText}
        </FormHelperText>
      )}
      
      {allowedSchemes.length > 0 && (
        <Box mt={0.5}>
          <Typography variant="caption" color="text.secondary">
            Supported schemes: {allowedSchemes.join(', ')}
          </Typography>
        </Box>
      )}
    </FormControl>
  );
};
