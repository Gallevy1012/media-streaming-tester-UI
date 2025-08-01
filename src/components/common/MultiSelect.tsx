import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Chip,
  Box,
  MenuItem,
  FormHelperText,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Info as InfoIcon } from '@mui/icons-material';

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  id: string;
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  tooltip?: string;
  size?: 'small' | 'medium';
  maxSelections?: number;
  allowSelectAll?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  id,
  label,
  values,
  onChange,
  options,
  error,
  helperText,
  disabled = false,
  required = false,
  placeholder = 'Select options...',
  tooltip,
  size = 'medium',
  maxSelections,
  allowSelectAll = false,
}) => {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    let newValues = Array.isArray(value) ? value : [value];

    // Handle "Select All" option
    if (allowSelectAll && newValues.includes('__SELECT_ALL__')) {
      const isSelectingAll = !newValues.includes('__SELECT_ALL__') || 
        values.length < options.filter(opt => !opt.disabled).length;
      
      if (isSelectingAll) {
        newValues = options.filter(opt => !opt.disabled).map(opt => opt.value);
      } else {
        newValues = [];
      }
    } else {
      // Filter out the select all option from actual values
      newValues = newValues.filter(v => v !== '__SELECT_ALL__');
    }

    // Apply max selections limit
    if (maxSelections && newValues.length > maxSelections) {
      newValues = newValues.slice(0, maxSelections);
    }

    onChange(newValues);
  };

  const renderValue = (selected: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, minHeight: '24px' }}>
      {selected.length === 0 ? (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ opacity: 0.6, fontSize: '0.9rem' }}
        >
          {placeholder}
        </Typography>
      ) : (
        selected.map((value) => {
          const option = options.find(opt => opt.value === value);
          return (
            <Chip
              key={value}
              label={option?.label || value}
              size="small"
              onDelete={disabled ? undefined : () => {
                onChange(values.filter(v => v !== value));
              }}
              sx={{
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(66, 165, 245, 0.1) 100%)',
                border: '1px solid rgba(25, 118, 210, 0.2)',
                fontWeight: 500,
                '& .MuiChip-deleteIcon': {
                  color: 'primary.main',
                  '&:hover': {
                    color: 'primary.dark',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  },
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(66, 165, 245, 0.15) 100%)',
                },
              }}
            />
          );
        })
      )}
    </Box>
  );

  const allSelectableOptions = options.filter(opt => !opt.disabled);
  const isAllSelected = allowSelectAll && 
    allSelectableOptions.length > 0 && 
    allSelectableOptions.every(opt => values.includes(opt.value));

  return (
    <FormControl 
      fullWidth 
      error={!!error} 
      disabled={disabled} 
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
        },
        '& .MuiInputLabel-root': {
          fontWeight: 500,
          '&.Mui-focused': {
            color: 'primary.main',
            fontWeight: 600,
          },
        },
      }}
    >
      <InputLabel id={`${id}-label`}>
        <Box display="flex" alignItems="center" gap={1}>
          {label}{required ? ' *' : ''}
          {tooltip && (
            <Tooltip title={tooltip} placement="top" arrow>
              <InfoIcon 
                fontSize="small" 
                sx={{
                  color: 'primary.main',
                  opacity: 0.7,
                  '&:hover': {
                    opacity: 1,
                    transform: 'scale(1.1)',
                  },
                }}
              />
            </Tooltip>
          )}
        </Box>
      </InputLabel>
      
      <Select
        labelId={`${id}-label`}
        id={id}
        multiple
        value={values}
        onChange={handleChange}
        input={<OutlinedInput label={label + (required ? ' *' : '')} />}
        renderValue={renderValue}
        displayEmpty
        MenuProps={{
          PaperProps: {
            sx: {
              borderRadius: 2,
              mt: 1,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              maxHeight: 300,
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
      >
        {allowSelectAll && options.length > 1 && (
          <MenuItem value="__SELECT_ALL__">
            <Typography 
              variant="body2" 
              sx={{
                fontWeight: isAllSelected ? 600 : 500,
                color: isAllSelected ? 'primary.main' : 'text.primary',
              }}
            >
              {isAllSelected ? '✓ Deselect All' : 'Select All'}
            </Typography>
          </MenuItem>
        )}
        
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            <Box sx={{ width: '100%' }}>
              <Typography 
                variant="body2"
                sx={{
                  fontWeight: values.includes(option.value) ? 600 : 400,
                  color: values.includes(option.value) ? 'primary.main' : 'text.primary',
                }}
              >
                {values.includes(option.value) && '✓ '}{option.label}
              </Typography>
              {option.description && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    display: 'block', 
                    fontSize: '0.7rem',
                    opacity: 0.8,
                    mt: 0.25,
                  }}
                >
                  {option.description}
                </Typography>
              )}
            </Box>
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
      
      {maxSelections && (
        <FormHelperText
          sx={{
            mt: 0.5,
            fontSize: '0.75rem',
            fontWeight: 500,
            color: values.length >= maxSelections ? 'warning.main' : 'text.secondary',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            {values.length >= maxSelections ? '⚠️ Maximum selections reached' : 'Selections:'}
          </span>
          <span>{values.length}/{maxSelections}</span>
        </FormHelperText>
      )}
    </FormControl>
  );
};
