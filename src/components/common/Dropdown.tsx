import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Tooltip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Info as InfoIcon } from '@mui/icons-material';

export interface DropdownOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  id: string;
  label: string;
  value: string | number | '';
  options: DropdownOption[];
  onChange: (value: string | number) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  tooltip?: string;
  placeholder?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  multiple?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
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
  placeholder,
  fullWidth = true,
  size = 'medium',
  multiple = false,
}) => {
  const handleChange = (event: SelectChangeEvent<string | number>) => {
    const selectedValue = event.target.value;
    onChange(selectedValue);
  };

  const labelId = `${id}-label`;

  return (
    <FormControl 
      fullWidth={fullWidth} 
      error={!!error} 
      size={size}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.7)',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.light',
            },
          },
          '&.Mui-focused': {
            background: 'rgba(255, 255, 255, 0.8)',
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 30px rgba(25, 118, 210, 0.15)',
            '& .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
              borderColor: 'primary.main',
            },
          },
          '&.Mui-error': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'error.main',
            },
          },
        },
        '& .MuiInputLabel-root': {
          fontWeight: 500,
          '&.Mui-focused': {
            color: 'primary.main',
            fontWeight: 600,
          },
        },
        '& .MuiSelect-select': {
          fontSize: '0.95rem',
        },
      }}
    >
      <InputLabel id={labelId}>
        {label}{required ? ' *' : ''}
      </InputLabel>
      <Select
        labelId={labelId}
        id={id}
        value={value}
        label={`${label}${required ? ' *' : ''}`}
        onChange={handleChange}
        disabled={disabled}
        multiple={multiple}
        displayEmpty={!!placeholder}
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: 2,
              mt: 1,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              '& .MuiMenuItem-root': {
                borderRadius: 1,
                margin: '4px 8px',
                transition: 'all 0.15s ease-in-out',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(66, 165, 245, 0.1) 100%)',
                  transform: 'translateX(4px)',
                },
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(66, 165, 245, 0.15) 100%)',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.2) 0%, rgba(66, 165, 245, 0.2) 100%)',
                  },
                },
                '&.Mui-disabled': {
                  opacity: 0.5,
                },
              },
            },
          },
        }}
        renderValue={multiple ? undefined : (selected) => {
          if (selected === '' && placeholder) {
            return <em style={{ opacity: 0.6, fontSize: '0.9rem' }}>{placeholder}</em>;
          }
          const option = options.find(opt => opt.value === selected);
          return option ? option.label : selected;
        }}
        endAdornment={
          tooltip ? (
            <InputAdornment position="end">
              <Tooltip title={tooltip} placement="top" arrow>
                <IconButton 
                  edge="end" 
                  size="small" 
                  tabIndex={-1}
                  sx={{
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    },
                  }}
                >
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ) : undefined
        }
      >
        {placeholder && (
          <MenuItem value="" disabled>
            <em>{placeholder}</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {(error || helperText) && (
        <FormHelperText
          sx={{
            mt: 0.75,
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
