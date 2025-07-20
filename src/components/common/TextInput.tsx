import React from 'react';
import {
  TextField,
  FormControl,
  FormHelperText,
  Tooltip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import type { SxProps, Theme } from '@mui/material/styles';

interface TextInputProps {
  id: string;
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  type?: 'text' | 'password' | 'email' | 'url';
  required?: boolean;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  tooltip?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  autoComplete?: string;
  sx?: SxProps<Theme>;
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  label,
  value = '',
  onChange,
  name,
  type = 'text',
  required = false,
  error,
  helperText,
  placeholder,
  disabled = false,
  multiline = false,
  rows = 1,
  maxLength,
  tooltip,
  startAdornment,
  endAdornment,
  fullWidth = true,
  size = 'medium',
  autoComplete,
  sx,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    if (maxLength && newValue.length > maxLength) {
      return; // Don't update if exceeds max length
    }
    onChange?.(newValue);
  };

  const endAdornmentWithTooltip = React.useMemo(() => {
    const adornments = [];
    
    if (tooltip) {
      adornments.push(
        <Tooltip key="tooltip" title={tooltip} arrow>
          <IconButton edge="end" size="small">
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
    
    if (endAdornment) {
      adornments.push(endAdornment);
    }
    
    return adornments.length > 0 ? (
      <InputAdornment position="end">
        {adornments}
      </InputAdornment>
    ) : undefined;
  }, [tooltip, endAdornment]);

  const startAdornmentWrapper = startAdornment ? (
    <InputAdornment position="start">
      {startAdornment}
    </InputAdornment>
  ) : undefined;

  const showCharacterCount = Boolean(maxLength && value);
  const characterCount = showCharacterCount ? `${value.length}/${maxLength}` : '';

  return (
    <FormControl fullWidth={fullWidth} error={Boolean(error)} sx={sx}>
      <TextField
        id={id}
        name={name}
        label={label}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        error={Boolean(error)}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        size={size}
        fullWidth={fullWidth}
        autoComplete={autoComplete}
        InputProps={{
          startAdornment: startAdornmentWrapper,
          endAdornment: endAdornmentWithTooltip,
        }}
      />
      
      {(error || helperText || showCharacterCount) && (
        <FormHelperText component="div">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error || helperText}</span>
            {showCharacterCount && (
              <span>{characterCount}</span>
            )}
          </div>
        </FormHelperText>
      )}
    </FormControl>
  );
};
