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

interface NumberInputProps {
  id: string;
  label: string;
  value: number | '';
  onChange: (value: number | '') => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  tooltip?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  integer?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  id,
  label,
  value,
  onChange,
  required = false,
  error,
  helperText,
  placeholder,
  disabled = false,
  min,
  max,
  step = 1,
  tooltip,
  startAdornment,
  endAdornment,
  fullWidth = true,
  size = 'medium',
  integer = true,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    
    if (inputValue === '') {
      onChange('');
      return;
    }

    const numericValue = integer ? parseInt(inputValue, 10) : parseFloat(inputValue);
    
    if (isNaN(numericValue)) {
      return;
    }

    // Apply min/max constraints
    let constrainedValue = numericValue;
    if (min !== undefined && constrainedValue < min) {
      constrainedValue = min;
    }
    if (max !== undefined && constrainedValue > max) {
      constrainedValue = max;
    }

    onChange(constrainedValue);
  };

  const getEndAdornment = () => {
    const adornments = [];
    
    if (tooltip) {
      adornments.push(
        <Tooltip key="tooltip" title={tooltip} placement="top">
          <IconButton edge="end" size="small" tabIndex={-1}>
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
  };

  const getHelperText = () => {
    const parts = [];
    
    if (error) {
      parts.push(error);
    } else if (helperText) {
      parts.push(helperText);
    }
    
    if (min !== undefined || max !== undefined) {
      const rangeText = min !== undefined && max !== undefined 
        ? `Range: ${min} - ${max}`
        : min !== undefined
        ? `Minimum: ${min}`
        : `Maximum: ${max}`;
      parts.push(rangeText);
    }
    
    return parts.join(' | ');
  };

  return (
    <FormControl fullWidth={fullWidth} error={!!error}>
      <TextField
        id={id}
        label={`${label}${required ? ' *' : ''}`}
        value={value}
        onChange={handleChange}
        type="number"
        error={!!error}
        placeholder={placeholder}
        disabled={disabled}
        size={size}
        fullWidth={fullWidth}
        InputProps={{
          startAdornment: startAdornment ? (
            <InputAdornment position="start">
              {startAdornment}
            </InputAdornment>
          ) : undefined,
          endAdornment: getEndAdornment(),
        }}
        inputProps={{
          min,
          max,
          step,
        }}
      />
      {getHelperText() && (
        <FormHelperText>
          {getHelperText()}
        </FormHelperText>
      )}
    </FormControl>
  );
};
