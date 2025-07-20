import React from 'react';
import {
  FormControl,
  FormLabel,
  RadioGroup as MuiRadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  Tooltip,
  Box,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

export interface RadioOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
}

interface RadioGroupProps {
  id: string;
  label: string;
  value: string | number | '';
  options: RadioOption[];
  onChange: (value: string | number) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  tooltip?: string;
  row?: boolean;
  size?: 'small' | 'medium';
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  id,
  label,
  value,
  options,
  onChange,
  required = false,
  error,
  helperText,
  disabled = false,
  tooltip,
  row = false,
  size = 'medium',
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedValue = event.target.value;
    // Try to convert to number if it's numeric
    const numericValue = Number(selectedValue);
    const finalValue = !isNaN(numericValue) && selectedValue !== '' ? numericValue : selectedValue;
    onChange(finalValue);
  };

  return (
    <FormControl component="fieldset" error={!!error} disabled={disabled}>
      <Box display="flex" alignItems="center" gap={1}>
        <FormLabel component="legend">
          {label}{required ? ' *' : ''}
        </FormLabel>
        {tooltip && (
          <Tooltip title={tooltip} placement="top">
            <InfoIcon fontSize="small" color="action" />
          </Tooltip>
        )}
      </Box>
      
      <MuiRadioGroup
        id={id}
        value={value}
        onChange={handleChange}
        row={row}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio size={size} />}
            label={
              <Box>
                <Box component="span">{option.label}</Box>
                {option.description && (
                  <Box
                    component="div"
                    sx={{
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  >
                    {option.description}
                  </Box>
                )}
              </Box>
            }
            disabled={option.disabled || disabled}
          />
        ))}
      </MuiRadioGroup>
      
      {(error || helperText) && (
        <FormHelperText>
          {error || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};
