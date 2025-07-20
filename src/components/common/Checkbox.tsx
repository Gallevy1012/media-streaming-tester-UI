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
          />
        }
        label={
          <Box display="flex" alignItems="center" gap={1}>
            <span>
              {label}{required ? ' *' : ''}
            </span>
            {tooltip && (
              <Tooltip title={tooltip} placement="top">
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
            )}
          </Box>
        }
      />
      
      {(error || helperText) && (
        <FormHelperText>
          {error || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};
