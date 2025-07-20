import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  useTheme
} from '@mui/material';
import { 
  CheckCircle, 
  Error, 
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

interface ColoredJsonViewerProps {
  response: any;
  error?: string | null;
  onClose?: () => void;
  onBack?: () => void;
  title?: string;
}

const ColoredJsonViewer: React.FC<ColoredJsonViewerProps> = ({
  response,
  error,
  onClose,
  onBack,
  title = "Response",
}) => {
  const theme = useTheme();

  const formatJsonWithColors = (obj: any, indent = 0, skipOuterBraces = false): React.ReactElement[] => {
    const elements: React.ReactElement[] = [];
    const indentStr = '  '.repeat(indent);

    if (obj === null) {
      elements.push(
        <span key="null" style={{ color: theme.palette.grey[600] }}>null</span>
      );
    } else if (typeof obj === 'boolean') {
      elements.push(
        <span key="bool" style={{ color: theme.palette.warning.main, fontWeight: 'bold' }}>
          {obj.toString()}
        </span>
      );
    } else if (typeof obj === 'number') {
      elements.push(
        <span key="num" style={{ color: theme.palette.info.main, fontWeight: 'bold' }}>
          {obj}
        </span>
      );
    } else if (typeof obj === 'string') {
      elements.push(
        <span key="str" style={{ color: theme.palette.success.main }}>
          "{obj}"
        </span>
      );
    } else if (Array.isArray(obj)) {
      elements.push(<span key="arr-start" style={{ color: theme.palette.text.primary }}>[</span>);
      if (obj.length > 0) {
        obj.forEach((item, index) => {
          if (index > 0 || obj.length > 1) elements.push(<br key={`arr-br-${index}-start`} />);
          if (obj.length > 1) {
            elements.push(
              <span key={`arr-indent-${index}`} style={{ color: 'transparent' }}>
                {indentStr}  
              </span>
            );
          }
          elements.push(...formatJsonWithColors(item, indent + 1));
          if (index < obj.length - 1) {
            elements.push(<span key={`arr-comma-${index}`} style={{ color: theme.palette.text.primary }}>,</span>);
          }
        });
        if (obj.length > 1) {
          elements.push(<br key="arr-br-end" />);
          elements.push(<span key="arr-end-indent" style={{ color: 'transparent' }}>{indentStr}</span>);
        }
      }
      elements.push(<span key="arr-end" style={{ color: theme.palette.text.primary }}>]</span>);
    } else if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      
      if (!skipOuterBraces) {
        elements.push(<span key="obj-start" style={{ color: theme.palette.text.primary }}>{'{'}</span>);
      }
      
      if (keys.length > 0) {
        if (!skipOuterBraces) elements.push(<br key="obj-br1" />);
        keys.forEach((key, index) => {
          if (!skipOuterBraces) {
            elements.push(
              <span key={`obj-indent-${index}`} style={{ color: 'transparent' }}>
                {indentStr}  
              </span>
            );
          }
          elements.push(
            <span key={`obj-key-${index}`} style={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
              "{key}"
            </span>
          );
          elements.push(<span key={`obj-colon-${index}`} style={{ color: theme.palette.text.primary }}>: </span>);
          elements.push(...formatJsonWithColors(obj[key], indent + 1));
          if (index < keys.length - 1) {
            elements.push(<span key={`obj-comma-${index}`} style={{ color: theme.palette.text.primary }}>,</span>);
          }
          elements.push(<br key={`obj-br-${index}`} />);
        });
        if (!skipOuterBraces) {
          elements.push(<span key="obj-end-indent" style={{ color: 'transparent' }}>{indentStr}</span>);
        }
      }
      
      if (!skipOuterBraces) {
        elements.push(<span key="obj-end" style={{ color: theme.palette.text.primary }}>{'}'}</span>);
      }
    }

    return elements;
  };

  if (error) {
    return (
      <Paper sx={{ p: 3, mt: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Error sx={{ mr: 1 }} />
          <Typography variant="h6">Error</Typography>
        </Box>
        <Typography variant="body1" sx={{ mb: 2 }}>{error}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {onBack && (
            <Button 
              variant="contained" 
              color="inherit" 
              onClick={onBack}
              startIcon={<ArrowBackIcon />}
            >
              Back
            </Button>
          )}
          {onClose && (
            <Button 
              variant="contained" 
              color="inherit" 
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  if (response) {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
          <Typography variant="h6">Success!</Typography>
        </Box>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{title} Details</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', 
              p: 2, 
              borderRadius: 1,
              maxHeight: '400px',
              overflow: 'auto',
              border: `1px solid ${theme.palette.divider}`,
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '0.875rem',
              lineHeight: 1.4
            }}>
              <div style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                lineHeight: 'inherit'
              }}>
                {formatJsonWithColors(response, 0, true)}
              </div>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          {onBack && (
            <Button 
              variant="outlined" 
              onClick={onBack}
              startIcon={<ArrowBackIcon />}
            >
              Back to Functions
            </Button>
          )}
          {onClose && (
            <Button 
              variant="contained" 
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  return null;
};

export default ColoredJsonViewer;
