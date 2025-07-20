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
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {selected.map((value) => {
        const option = options.find(opt => opt.value === value);
        return (
          <Chip
            key={value}
            label={option?.label || value}
            size="small"
            onDelete={disabled ? undefined : () => {
              onChange(values.filter(v => v !== value));
            }}
          />
        );
      })}
    </Box>
  );

  const allSelectableOptions = options.filter(opt => !opt.disabled);
  const isAllSelected = allowSelectAll && 
    allSelectableOptions.length > 0 && 
    allSelectableOptions.every(opt => values.includes(opt.value));

  return (
    <FormControl fullWidth error={!!error} disabled={disabled} size={size}>
      <InputLabel id={`${id}-label`}>
        <Box display="flex" alignItems="center" gap={1}>
          {label}{required ? ' *' : ''}
          {tooltip && (
            <Tooltip title={tooltip} placement="top">
              <InfoIcon fontSize="small" />
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
      >
        {values.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              {placeholder}
            </Typography>
          </MenuItem>
        )}
        
        {allowSelectAll && options.length > 1 && (
          <MenuItem value="__SELECT_ALL__">
            <Typography 
              variant="body2" 
              fontWeight={isAllSelected ? 'bold' : 'normal'}
            >
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </Typography>
          </MenuItem>
        )}
        
        {options.map((option) => (
          <MenuItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            <Box>
              <Typography variant="body2">
                {option.label}
              </Typography>
              {option.description && (
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              )}
            </Box>
          </MenuItem>
        ))}
      </Select>
      
      {(error || helperText) && (
        <FormHelperText>
          {error || helperText}
        </FormHelperText>
      )}
      
      {maxSelections && (
        <FormHelperText>
          {values.length}/{maxSelections} selected
        </FormHelperText>
      )}
    </FormControl>
  );
};
