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
    <FormControl fullWidth={fullWidth} error={!!error} size={size}>
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
        renderValue={multiple ? undefined : (selected) => {
          if (selected === '' && placeholder) {
            return <em>{placeholder}</em>;
          }
          const option = options.find(opt => opt.value === selected);
          return option ? option.label : selected;
        }}
        endAdornment={
          tooltip ? (
            <InputAdornment position="end">
              <Tooltip title={tooltip} placement="top">
                <IconButton edge="end" size="small" tabIndex={-1}>
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
        <FormHelperText>
          {error || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};
