import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  TextField,
  FormHelperText,
  Tooltip,
  Box,
  Typography,
  Select,
  MenuItem,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

interface DurationInputProps {
  id: string;
  label: string;
  value: number; // Duration in seconds
  onChange: (seconds: number) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  tooltip?: string;
  size?: 'small' | 'medium';
  allowedUnits?: ('seconds' | 'minutes' | 'hours')[];
  maxDuration?: number; // Maximum duration in seconds
  minDuration?: number; // Minimum duration in seconds
  placeholder?: string;
}

type TimeUnit = 'seconds' | 'minutes' | 'hours';

const UNIT_MULTIPLIERS: Record<TimeUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
};

const UNIT_LABELS: Record<TimeUnit, string> = {
  seconds: 'Seconds',
  minutes: 'Minutes', 
  hours: 'Hours',
};

export const DurationInput: React.FC<DurationInputProps> = ({
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
  allowedUnits = ['seconds', 'minutes', 'hours'],
  maxDuration,
  minDuration,
  placeholder = '0',
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<TimeUnit>('seconds');

  // Initialize display value and unit based on the input value
  useEffect(() => {
    if (value === 0) {
      setDisplayValue('');
      setSelectedUnit(allowedUnits[0]);
      return;
    }

    // Find the best unit to display (largest unit that results in a whole number)
    let bestUnit: TimeUnit = 'seconds';
    for (const unit of ['hours', 'minutes', 'seconds'] as TimeUnit[]) {
      if (allowedUnits.includes(unit) && value % UNIT_MULTIPLIERS[unit] === 0) {
        bestUnit = unit;
        break;
      }
    }

    setSelectedUnit(bestUnit);
    setDisplayValue(String(value / UNIT_MULTIPLIERS[bestUnit]));
  }, [value, allowedUnits]);

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    setDisplayValue(inputValue);

    if (inputValue === '' || inputValue === '0') {
      onChange(0);
      return;
    }

    const numericValue = parseFloat(inputValue);
    if (!isNaN(numericValue) && numericValue >= 0) {
      const totalSeconds = Math.round(numericValue * UNIT_MULTIPLIERS[selectedUnit]);
      onChange(totalSeconds);
    }
  };

  const handleUnitChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newUnit = event.target.value as TimeUnit;
    setSelectedUnit(newUnit);

    if (displayValue && !isNaN(parseFloat(displayValue))) {
      const numericValue = parseFloat(displayValue);
      const totalSeconds = Math.round(numericValue * UNIT_MULTIPLIERS[newUnit]);
      onChange(totalSeconds);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) return '0 seconds';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
  };

  const getValidationError = (): string | undefined => {
    if (error) return error;
    if (!displayValue) return undefined;
    
    const numericValue = parseFloat(displayValue);
    if (isNaN(numericValue)) return 'Please enter a valid number';
    if (numericValue < 0) return 'Duration cannot be negative';
    
    const totalSeconds = numericValue * UNIT_MULTIPLIERS[selectedUnit];
    
    if (minDuration !== undefined && totalSeconds < minDuration) {
      return `Duration must be at least ${formatDuration(minDuration)}`;
    }
    if (maxDuration !== undefined && totalSeconds > maxDuration) {
      return `Duration cannot exceed ${formatDuration(maxDuration)}`;
    }
    
    return undefined;
  };

  const validationError = getValidationError();

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
      </Box>
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: allowedUnits.length > 1 ? '2fr 1fr' : '1fr',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <TextField
          id={id}
          value={displayValue}
          onChange={handleValueChange}
          placeholder={placeholder}
          type="number"
          inputProps={{
            min: 0,
            step: selectedUnit === 'seconds' ? 1 : 0.1,
          }}
          size={size}
          fullWidth
          error={!!validationError}
        />
        
        {allowedUnits.length > 1 && (
          <Select
            value={selectedUnit}
            onChange={(e) => handleUnitChange(e as React.ChangeEvent<{ value: unknown }>)}
            size={size}
            fullWidth
          >
            {allowedUnits.map((unit) => (
              <MenuItem key={unit} value={unit}>
                {UNIT_LABELS[unit]}
              </MenuItem>
            ))}
          </Select>
        )}
      </Box>
      
      {value > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          Total: {formatDuration(value)}
        </Typography>
      )}
      
      {(validationError || helperText) && (
        <FormHelperText>
          {validationError || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};
