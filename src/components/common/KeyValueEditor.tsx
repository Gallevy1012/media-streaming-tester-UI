import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Paper,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  label: string;
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyLabel?: string;
  valueLabel?: string;
  addButtonText?: string;
  placeholder?: {
    key?: string;
    value?: string;
  };
  disabled?: boolean;
  required?: boolean;
  allowEmpty?: boolean;
  maxPairs?: number;
  size?: 'small' | 'medium';
  helperText?: string;
  error?: string;
  keyValidation?: (key: string) => string | null;
  valueValidation?: (value: string) => string | null;
  showHelp?: boolean;
  helpText?: string;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  label,
  pairs,
  onChange,
  keyLabel = 'Key',
  valueLabel = 'Value',
  addButtonText = 'Add Item',
  placeholder,
  disabled = false,
  required = false,
  allowEmpty = true,
  maxPairs,
  size = 'medium',
  helperText,
  error,
  keyValidation,
  valueValidation,
  showHelp = false,
  helpText,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateId = useCallback(() => {
    return `kvp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addPair = useCallback(() => {
    if (maxPairs && pairs.length >= maxPairs) {
      return;
    }

    const newPair: KeyValuePair = {
      id: generateId(),
      key: '',
      value: '',
    };

    onChange([...pairs, newPair]);
  }, [pairs, onChange, maxPairs, generateId]);

  const removePair = useCallback((id: string) => {
    onChange(pairs.filter(pair => pair.id !== id));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  }, [pairs, onChange]);

  const updatePair = useCallback((id: string, field: 'key' | 'value', newValue: string) => {
    const updatedPairs = pairs.map(pair =>
      pair.id === id ? { ...pair, [field]: newValue } : pair
    );
    onChange(updatedPairs);

    // Validate
    const pair = updatedPairs.find(p => p.id === id);
    if (pair) {
      let errorMessage = '';
      
      if (field === 'key' && keyValidation) {
        const keyError = keyValidation(newValue);
        if (keyError) errorMessage = keyError;
      }
      
      if (field === 'value' && valueValidation) {
        const valueError = valueValidation(newValue);
        if (valueError) errorMessage = valueError;
      }

      setErrors(prev => ({
        ...prev,
        [id]: errorMessage,
      }));
    }
  }, [pairs, onChange, keyValidation, valueValidation]);

  const hasErrors = Object.values(errors).some(error => error);
  const canAddMore = !maxPairs || pairs.length < maxPairs;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={1}>
        <Typography variant="subtitle2" component="label">
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </Typography>
        {showHelp && helpText && (
          <Tooltip title={helpText} arrow>
            <IconButton size="small" sx={{ ml: 0.5 }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {pairs.length === 0 && !allowEmpty && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            No items added yet. Click "{addButtonText}" to get started.
          </Typography>
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        {pairs.map((pair) => (
          <Paper
            key={pair.id}
            variant="outlined"
            sx={{ 
              p: 2, 
              mb: 1, 
              bgcolor: errors[pair.id] ? 'error.50' : 'background.paper',
              '&:last-child': { mb: 0 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <DragIcon color="action" sx={{ mt: size === 'small' ? 1 : 1.5 }} />
              
              <Box sx={{ flex: 1 }}>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                  gap: 2, 
                  mb: errors[pair.id] ? 1 : 0 
                }}>
                  <TextField
                    label={keyLabel}
                    value={pair.key}
                    onChange={(e) => updatePair(pair.id, 'key', e.target.value)}
                    placeholder={placeholder?.key}
                    disabled={disabled}
                    size={size}
                    fullWidth
                    error={Boolean(errors[pair.id] && pair.key)}
                  />
                  <TextField
                    label={valueLabel}
                    value={pair.value}
                    onChange={(e) => updatePair(pair.id, 'value', e.target.value)}
                    placeholder={placeholder?.value}
                    disabled={disabled}
                    size={size}
                    fullWidth
                    error={Boolean(errors[pair.id] && pair.value)}
                  />
                </Box>
                
                {errors[pair.id] && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors[pair.id]}
                  </Typography>
                )}
              </Box>

              <IconButton
                onClick={() => removePair(pair.id)}
                disabled={disabled}
                size="small"
                color="error"
                sx={{ mt: size === 'small' ? 0.5 : 1 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        ))}
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button
          startIcon={<AddIcon />}
          onClick={addPair}
          disabled={disabled || !canAddMore}
          variant="outlined"
          size={size}
        >
          {addButtonText}
        </Button>

        {maxPairs && (
          <Typography variant="caption" color="text.secondary">
            {pairs.length} / {maxPairs} items
          </Typography>
        )}
      </Box>

      {(error || helperText) && (
        <Typography
          variant="caption"
          color={error ? 'error' : 'text.secondary'}
          sx={{ mt: 1, display: 'block' }}
        >
          {error || helperText}
        </Typography>
      )}

      {hasErrors && (
        <Alert severity="error" sx={{ mt: 1 }}>
          <Typography variant="body2">
            Please fix the validation errors above before continuing.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};
