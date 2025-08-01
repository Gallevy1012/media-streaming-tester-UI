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
    <FormControl 
      component="fieldset" 
      error={!!error} 
      disabled={disabled}
      sx={{
        '& .MuiFormLabel-root': {
          fontWeight: 600,
          fontSize: '1rem',
          color: error ? 'error.main' : 'text.primary',
          '&.Mui-focused': {
            color: 'primary.main',
          },
        },
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
        <FormLabel component="legend">
          {label}{required ? ' *' : ''}
        </FormLabel>
        {tooltip && (
          <Tooltip title={tooltip} placement="top" arrow>
            <InfoIcon 
              fontSize="small" 
              sx={{
                color: 'primary.main',
                opacity: 0.7,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  opacity: 1,
                  transform: 'scale(1.1)',
                },
              }}
            />
          </Tooltip>
        )}
      </Box>
      
      <MuiRadioGroup
        id={id}
        value={value}
        onChange={handleChange}
        row={row}
        sx={{
          gap: row ? 3 : 1,
          '& .MuiFormControlLabel-root': {
            margin: 0,
            padding: 1.5,
            borderRadius: 2,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'transparent',
            border: '1px solid transparent',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(25, 118, 210, 0.2)',
            },
            '&.Mui-disabled': {
              opacity: 0.6,
            },
          },
          '& .MuiRadio-root': {
            padding: 1,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              transform: 'scale(1.05)',
            },
            '&.Mui-checked': {
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.12)',
              },
            },
            '& .MuiSvgIcon-root': {
              fontSize: size === 'small' ? '1.2rem' : '1.5rem',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
            },
          },
        }}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio size={size} />}
            label={
              <Box sx={{ ml: 0.5 }}>
                <Box 
                  component="span" 
                  sx={{ 
                    fontWeight: 500,
                    fontSize: size === 'small' ? '0.875rem' : '1rem',
                  }}
                >
                  {option.label}
                </Box>
                {option.description && (
                  <Box
                    component="div"
                    sx={{
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      fontStyle: 'italic',
                      mt: 0.25,
                      opacity: 0.8,
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
        <FormHelperText
          sx={{
            mt: 1,
            fontSize: '0.8rem',
            fontWeight: error ? 500 : 400,
          }}
        >
          {error || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};
