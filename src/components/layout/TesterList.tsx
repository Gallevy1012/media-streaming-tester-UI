import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useTester } from '../../contexts/TesterContext';
import { sipTesterService } from '../../services/sipTesterService';
import { rtpTesterService } from '../../services/rtpTesterService';
import type { TesterInstance } from '../../contexts/TesterContext';

interface TesterListProps {
  compact?: boolean;
}

export const TesterList: React.FC<TesterListProps> = ({ compact = false }) => {
  const { state, removeTester } = useTester();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tester?: TesterInstance }>({ open: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const theme = useTheme();

  const getTesterDisplayName = (tester: TesterInstance) => {
    // For SIP testers, try to use alias from response
    if (tester.type === 'sip-tester') {
      // Check if alias exists in the response details
      const alias = tester.details?.config?.listeningAddress?.alias ||
                   tester.details?.listeningAddress?.alias ||
                   tester.details?.alias;
      if (alias) {
        return alias;
      }
    }

    // For Media testers, try to use alias from response
    if (tester.type === 'media-tester') {
      // Check if alias exists in the response details
      const alias = tester.details?.listeningAddress?.alias;
      if (alias) {
        return alias;
      }
    }

    // Fallback to tester name or default naming
    return tester.name || `${tester.type} ${tester.id.slice(0, 8)}`;
  };

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

  const handleDeleteClick = (tester: TesterInstance) => {
    // For media testers, automatically call the remove API
    if (tester.type === 'media-tester') {
      handleMediaTesterRemoval(tester);
      return;
    }
    
    // For other tester types, show the delete dialog
    setDeleteDialog({ open: true, tester });
  };

  const handleMediaTesterRemoval = async (tester: TesterInstance) => {
    if (!tester.mediaTesterId && !tester.details?.mediaTesterId) {
      console.error('Cannot remove media tester: Media Tester ID not found');
      return;
    }

    const mediaTesterId = tester.mediaTesterId || tester.details?.mediaTesterId;
    const requestId = tester.requestId || `remove-${Date.now()}`;

    try {
      // Import the mediaTesterService dynamically to avoid circular imports
      const { mediaTesterService } = await import('../../services/mediaTesterService');
      
      const response = await mediaTesterService.removeMediaTester({
        requestId: requestId,
        mediaTesterId: mediaTesterId
      });

      console.log('Media Tester removal response:', response);
    } catch (error) {
      console.error('Error removing media tester:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.tester) return;
    
    setIsDeleting(true);
    const tester = deleteDialog.tester;
    
    try {
      if (tester.type === 'sip-tester') {
        // Remove SIP tester
        if (tester.requestId && tester.sipTesterId) {
          await sipTesterService.removeSipTester({
            requestId: tester.requestId,
            sipTesterId: tester.sipTesterId
          });
        }
      } else if (tester.type === 'rtp-tester') {
        // Remove RTP tester
        if (tester.interactionKey && tester.rtpTesterId) {
          await rtpTesterService.removeRtpTester({
            rtpTesterId: tester.rtpTesterId,
            interactionKey: tester.interactionKey
          });
        }
      }
      
      // Remove from local list
      removeTester(tester.id);
      setDeleteDialog({ open: false });
    } catch (error) {
      console.error('Error removing tester:', error);
      // Still remove from local list even if API call fails
      removeTester(tester.id);
      setDeleteDialog({ open: false });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false });
  };

  const renderTesterDetails = (tester: TesterInstance) => {
    return (
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Tester Information:
        </Typography>
        <Box sx={{ mb: 1 }}>
          {tester.operation && (
            <Typography variant="caption" display="block" color="primary.main" sx={{ fontWeight: 'bold' }}>
              Operation: {tester.operation}
            </Typography>
          )}
          {tester.requestId && (
            <Typography variant="caption" display="block" color="text.secondary">
              Request ID: {tester.requestId}
            </Typography>
          )}
          {tester.interactionKey && (
            <Typography variant="caption" display="block" color="text.secondary">
              Interaction Key: {tester.interactionKey}
            </Typography>
          )}
          {tester.sipTesterId && (
            <Typography variant="caption" display="block" color="text.secondary">
              SIP Tester ID: {tester.sipTesterId}
            </Typography>
          )}
          {tester.rtpTesterId && (
            <Typography variant="caption" display="block" color="text.secondary">
              RTP Tester ID: {tester.rtpTesterId}
            </Typography>
          )}
          {tester.mediaTesterId && (
            <Typography variant="caption" display="block" color="text.secondary">
              Media Tester ID: {tester.mediaTesterId}
            </Typography>
          )}
          {tester.details?.mediaTesterId && (
            <Typography variant="caption" display="block" color="text.secondary">
              Media Tester ID: {tester.details.mediaTesterId}
            </Typography>
          )}
          {tester.type === 'media-tester' && tester.details?.listeningAddress?.transportProtocol && (
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 1 }}>
              transportProtocol: {tester.details.listeningAddress.transportProtocol}
            </Typography>
          )}
          {tester.type === 'media-tester' && tester.details?.listeningAddress?.sipAddress && (
            <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 1 }}>
              sipAddress: {tester.details.listeningAddress.sipAddress}
            </Typography>
          )}
          {tester.senderId && (
            <Typography variant="caption" display="block" color="primary.main" sx={{ fontWeight: 'bold' }}>
              Sender ID: {tester.senderId}
            </Typography>
          )}
          {tester.requestId && (
            <Typography variant="caption" display="block" color="text.secondary">
              Request ID: {tester.requestId}
            </Typography>
          )}
          {tester.operation && (
            <Typography variant="caption" display="block" color="primary.main" sx={{ fontWeight: 'bold' }}>
              Tester role: {tester.operation}
            </Typography>
          )}
          <Typography variant="caption" display="block" color="text.secondary">
            Created: {tester.createdAt.toLocaleString()}
          </Typography>
        </Box>
        <Typography variant="subtitle2" gutterBottom>
          Response Details:
        </Typography>
        <div style={{ 
          fontSize: '0.85rem', 
          whiteSpace: 'pre-wrap', 
          margin: 0,
          maxHeight: '300px',
          overflow: 'auto',
          background: theme.palette.mode === 'dark' ? theme.palette.grey[900] : '#f8f9fa',
          padding: '12px',
          borderRadius: '6px',
          border: `1px solid ${theme.palette.divider}`,
          fontFamily: 'Monaco, Consolas, "Lucida Console", monospace',
          lineHeight: '1.4'
        }}>
          {formatJsonWithColors(tester.details, 0, true)}
        </div>
      </Box>
    );
  };

  const getTesterColor = (type: string) => {
    switch (type) {
      case 'sip-tester':
        return 'primary';
      case 'rtp-tester':
        return 'secondary';
      case 'media-tester':
        return 'success';
      default:
        return 'default';
    }
  };

  const groupedTesters = {
    'sip-tester': state.testers.filter(t => t.type === 'sip-tester'),
    'rtp-tester': state.testers.filter(t => t.type === 'rtp-tester'),
    'media-tester': state.testers.filter(t => t.type === 'media-tester'),
  };

  if (compact) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Active Testers ({state.testers.length})
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {state.testers.map((tester) => (
            <Box key={tester.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip
                label={getTesterDisplayName(tester)}
                color={getTesterColor(tester.type) as any}
                size="small"
                variant="outlined"
              />
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeleteClick(tester)}
                title="Remove Tester"
                sx={{ ml: 0.5 }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Tester Instances
      </Typography>
      
      {/* Debug info */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
        Total testers: {state.testers.length}
      </Typography>
      
      {Object.entries(groupedTesters).map(([type, testers]) => (
        <Accordion key={type} defaultExpanded={true}>
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              backgroundColor: 'grey.100',
              '&:hover': { backgroundColor: 'grey.200' }
            }}
          >
            <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
              {type.replace('-', ' ')} ({testers.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {testers.length === 0 ? (
              <Typography color="text.secondary" style={{ fontStyle: 'italic' }}>
                No {type} instances created yet
              </Typography>
            ) : (
              <List disablePadding>
                {testers.map((tester, index) => (
                  <React.Fragment key={tester.id}>
                    {index > 0 && <Divider />}
                    <ListItem
                      disablePadding
                      sx={{ 
                        flexDirection: 'column', 
                        alignItems: 'stretch',
                        py: 1 
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        width: '100%',
                        mb: 1,
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        backgroundColor: 'background.default'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle2">
                            {getTesterDisplayName(tester)}
                            {tester.operation && ` (${tester.operation})`}
                          </Typography>
                          <Chip
                            label={tester.type}
                            color={getTesterColor(tester.type) as any}
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            Created: {tester.createdAt.toLocaleString()}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(tester)}
                          title="Remove Tester"
                          sx={{ 
                            border: '1px solid',
                            borderColor: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'white'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      {renderTesterDetails(tester)}
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
      
      {state.testers.length === 0 && (
        <Typography 
          color="text.secondary" 
          sx={{ textAlign: 'center', py: 4, fontStyle: 'italic' }}
        >
          No tester instances created yet. Create a tester to see it listed here with a trash button for removal.
        </Typography>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove {deleteDialog.tester ? getTesterDisplayName(deleteDialog.tester) : 'this tester'}?
            {deleteDialog.tester?.type === 'sip-tester' && ' This will call the remove SIP tester API.'}
            {deleteDialog.tester?.type === 'rtp-tester' && ' This will call the remove RTP tester API.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TesterList;
