import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Button,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import type { TestResponse, TestMetric } from '../../types';

interface ResponseViewerProps {
  response: TestResponse;
  onDownloadReport?: () => void;
  onCopyResults?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const MetricCard: React.FC<{ metric: TestMetric }> = ({ metric }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pass':
      case 'success':
        return 'success';
      case 'fail':
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string): React.ReactElement | null => {
    switch (status.toLowerCase()) {
      case 'pass':
      case 'success':
        return <SuccessIcon />;
      case 'fail':
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      default:
        return null;
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">{metric.name}</Typography>
        <Chip
          {...(getStatusIcon(metric.status) && { icon: getStatusIcon(metric.status)! })}
          label={metric.status.toUpperCase()}
          color={getStatusColor(metric.status)}
          size="small"
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        {metric.description}
      </Typography>
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: metric.threshold ? '1fr 1fr' : '1fr',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary">
            Value
          </Typography>
          <Typography variant="h6">
            {metric.value} {metric.unit && metric.unit}
          </Typography>
        </Box>
        
        {metric.threshold && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Threshold
            </Typography>
            <Typography variant="body1">
              {metric.threshold}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  onDownloadReport,
  onCopyResults,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
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

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getOverallStatus = () => {
    if (response.success) {
      const hasWarnings = response.metrics?.some((m: TestMetric) => m.status.toLowerCase() === 'warning');
      return hasWarnings ? 'warning' : 'success';
    }
    return 'error';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Test Results
        </Typography>
        
        <Box display="flex" gap={1}>
          {onCopyResults && (
            <Button
              startIcon={<CopyIcon />}
              onClick={onCopyResults}
              size="small"
              variant="outlined"
            >
              Copy
            </Button>
          )}
          {onDownloadReport && (
            <Button
              startIcon={<DownloadIcon />}
              onClick={onDownloadReport}
              size="small"
              variant="contained"
            >
              Download Report
            </Button>
          )}
        </Box>
      </Box>

      {/* Status Summary */}
      <Alert
        severity={getOverallStatus()}
        sx={{ mb: 3 }}
        icon={getOverallStatus() === 'success' ? <SuccessIcon /> : 
              getOverallStatus() === 'warning' ? <WarningIcon /> : <ErrorIcon />}
      >
        <Typography variant="body1">
          Test {response.success ? 'completed successfully' : 'failed'}
          {response.duration && ` in ${formatDuration(response.duration)}`}
        </Typography>
        {response.message && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {response.message}
          </Typography>
        )}
      </Alert>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Summary" />
          <Tab label="Metrics" />
          <Tab label="Raw Data" />
          {response.logs && <Tab label="Logs" />}
        </Tabs>
      </Box>

      {/* Summary Tab */}
      <TabPanel value={activeTab} index={0}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="h6" gutterBottom>
              Test Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Test ID"
                  secondary={response.testId}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Status"
                  secondary={
                    <Chip
                      label={response.success ? 'Success' : 'Failed'}
                      color={response.success ? 'success' : 'error'}
                      size="small"
                    />
                  }
                />
              </ListItem>
              {response.duration && (
                <ListItem>
                  <ListItemText
                    primary="Duration"
                    secondary={formatDuration(response.duration)}
                  />
                </ListItem>
              )}
              <ListItem>
                <ListItemText
                  primary="Timestamp"
                  secondary={new Date(response.timestamp).toLocaleString()}
                />
              </ListItem>
            </List>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Metrics Summary
            </Typography>
            {response.metrics && response.metrics.length > 0 ? (
              <List dense>
                {response.metrics.slice(0, 5).map((metric: TestMetric, index: number) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={metric.name}
                      secondary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{metric.value} {metric.unit}</span>
                          <Chip
                            label={metric.status}
                            size="small"
                            color={metric.status.toLowerCase() === 'pass' ? 'success' : 'error'}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {response.metrics.length > 5 && (
                  <ListItem>
                    <ListItemText
                      secondary={`... and ${response.metrics.length - 5} more metrics`}
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No metrics available
              </Typography>
            )}
          </Box>
        </Box>
      </TabPanel>

      {/* Metrics Tab */}
      <TabPanel value={activeTab} index={1}>
        {response.metrics && response.metrics.length > 0 ? (
          <Box>
            {response.metrics.map((metric: TestMetric, index: number) => (
              <MetricCard key={index} metric={metric} />
            ))}
          </Box>
        ) : (
          <Alert severity="info">
            No detailed metrics available for this test.
          </Alert>
        )}
      </TabPanel>

      {/* Raw Data Tab */}
      <TabPanel value={activeTab} index={2}>
        <Box>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h6">Raw Response Data</Typography>
            <IconButton
              onClick={() => toggleSection('rawData')}
              size="small"
            >
              {expandedSections.rawData ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={expandedSections.rawData !== false}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                fontSize: '0.875rem',
                maxHeight: 400,
                overflow: 'auto',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <div style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: 'inherit'
              }}>
                {formatJsonWithColors(response.data, 0, true)}
              </div>
            </Paper>
          </Collapse>
        </Box>
      </TabPanel>

      {/* Logs Tab */}
      {response.logs && (
        <TabPanel value={activeTab} index={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Execution Logs
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                maxHeight: 400,
                overflow: 'auto',
              }}
            >
              {response.logs.map((log: { timestamp: string; level: string; message: string }, index: number) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="span"
                  >
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </Typography>{' '}
                  <Typography
                    component="span"
                    color={
                      log.level === 'error' ? 'error.main' :
                      log.level === 'warning' ? 'warning.main' :
                      'text.primary'
                    }
                  >
                    {log.message}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        </TabPanel>
      )}
    </Paper>
  );
};
