import React from 'react';
import {
  FormControl,
  FormControlLabel,
  Checkbox as MuiCheckbox,
  FormHelperText,
  Tooltip,
  Box,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

interface CheckboxProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  tooltip?: string;
  required?: boolean;
  size?: 'small' | 'medium';
  color?: 'primary' | 'secondary' | 'default';
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
  error,
  helperText,
  disabled = false,
  tooltip,
  required = false,
  size = 'medium',
  color = 'primary',
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <FormControl error={!!error} disabled={disabled}>
      <FormControlLabel
        control={
          <MuiCheckbox
            id={id}
            checked={checked}
            onChange={handleChange}
            size={size}
            color={color}
            sx={{
              padding: 1.5,
              borderRadius: 1.5,
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
            }}
          />
        }
        label={
          <Box display="flex" alignItems="center" gap={1}>
            <span
              style={{
                fontSize: size === 'small' ? '0.875rem' : '1rem',
                fontWeight: 500,
                color: error ? '#d32f2f' : 'inherit',
                transition: 'color 0.2s ease-in-out',
              }}
            >
              {label}{required ? ' *' : ''}
            </span>
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
        }
        sx={{
          margin: 0,
          padding: 1,
          borderRadius: 2,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'transparent',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(10px)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          },
          '&.Mui-disabled': {
            opacity: 0.6,
          },
        }}
      />
      
      {(error || helperText) && (
        <FormHelperText
          sx={{
            mt: 0.5,
            ml: 1,
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
