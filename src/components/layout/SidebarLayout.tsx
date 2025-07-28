import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useTester } from '../../contexts/TesterContext';
import { sipTesterService } from '../../services/sipTesterService';
import { rtpTesterService } from '../../services/rtpTesterService';
import { mediaTesterService } from '../../services/mediaTesterService';
import type { TesterType } from '../../types';
import type { TesterInstance } from '../../contexts/TesterContext';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 350;

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const [selectedTester, setSelectedTester] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; tester?: TesterInstance }>({ open: false });
  const [removeAllDialog, setRemoveAllDialog] = useState<{ open: boolean; type?: TesterType }>({ open: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [ setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const { state, removeTester } = useTester();
  const navigate = useNavigate();
  const [rtpMenuAnchor, setRtpMenuAnchor] = useState<null | HTMLElement>(null);

  const handleTesterClick = (testerId: string) => {
    setSelectedTester(selectedTester === testerId ? null : testerId);
  };

  const handleDeleteClick = (tester: TesterInstance, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent tester selection when clicking delete

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
      setNotification({
        open: true,
        message: 'Cannot remove media tester: Media Tester ID not found',
        severity: 'error'
      });
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

      // Show success notification
      setNotification({
        open: true,
        message: `${getTesterDisplayName(tester)} removed successfully (200 OK)`,
        severity: 'success'
      });

    } catch (error) {
      console.error('Error removing media tester:', error);
      // Show error notification
      setNotification({
        open: true,
        message: `Failed to remove ${getTesterDisplayName(tester)}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.tester) return;

    setIsDeleting(true);
    const tester = deleteDialog.tester;
    let success = false;

    try {
      if (tester.type === 'sip-tester') {
        // Remove SIP tester
        if (tester.requestId && tester.sipTesterId) {
          const response = await sipTesterService.removeSipTester({
            requestId: tester.requestId,
            sipTesterId: tester.sipTesterId
          });
          console.log('SIP Tester removal response:', response);
          success = true;
        }
      } else if (tester.type === 'rtp-tester') {
        // Remove RTP tester
        if (tester.interactionKey && tester.rtpTesterId) {
          const response = await rtpTesterService.removeRtpTester({
            rtpTesterId: tester.rtpTesterId,
            interactionKey: tester.interactionKey
          });
          console.log('RTP Tester removal response:', response);
          success = true;
        }
      }

      // Remove from local list
      removeTester(tester.id);
      setDeleteDialog({ open: false });

      // If this was the selected tester, clear the selection
      if (selectedTester === tester.id) {
        setSelectedTester(null);
      }

      // Show success notification
      if (success) {
        setNotification({
          open: true,
          message: `${getTesterDisplayName(tester)} removed successfully (200 OK)`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error removing tester:', error);
      // Still remove from local list even if API call fails
      removeTester(tester.id);
      setDeleteDialog({ open: false });
      if (selectedTester === tester.id) {
        setSelectedTester(null);
      }
      // Show error notification
      setNotification({
        open: true,
        message: `Failed to remove ${getTesterDisplayName(tester)}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false });
  };

  const handleRemoveAllClick = (type: TesterType, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent accordion toggle
    setRemoveAllDialog({ open: true, type });
  };

  const handleRemoveAllConfirm = async () => {
    if (!removeAllDialog.type) return;

    setIsDeleting(true);
    const testerType = removeAllDialog.type;
    const testersToRemove = getTestersByType(testerType);
    let successCount = 0;
    let errorCount = 0;

    console.log(`Starting bulk removal of ${testersToRemove.length} ${testerType} testers...`);

    // Process each tester individually
    for (const tester of testersToRemove) {
      try {
        console.log(`Removing ${tester.type} tester:`, tester);

        let apiCallSuccessful = false;

        if (tester.type === 'sip-tester') {
          if (tester.requestId && tester.sipTesterId) {
            const response = await sipTesterService.removeSipTester({
              requestId: tester.requestId,
              sipTesterId: tester.sipTesterId
            });
            console.log('SIP Tester removal response:', response);
            apiCallSuccessful = true;
          } else {
            console.warn('SIP Tester missing required fields:', { requestId: tester.requestId, sipTesterId: tester.sipTesterId });
          }
        } else if (tester.type === 'rtp-tester') {
          if (tester.interactionKey && tester.rtpTesterId) {
            const response = await rtpTesterService.removeRtpTester({
              rtpTesterId: tester.rtpTesterId,
              interactionKey: tester.interactionKey
            });
            console.log('RTP Tester removal response:', response);
            apiCallSuccessful = true;
          } else {
            console.warn('RTP Tester missing required fields:', { interactionKey: tester.interactionKey, rtpTesterId: tester.rtpTesterId });
          }
        } else if (tester.type === 'media-tester') {
          if (tester.requestId && tester.mediaTesterId) {
            const response = await mediaTesterService.removeMediaTester({
              requestId: tester.requestId,
              mediaTesterId: tester.mediaTesterId
            });
            console.log('Media Tester removal response:', response);
            apiCallSuccessful = true;
          } else {
            console.warn('Media Tester missing required fields:', { requestId: tester.requestId, mediaTesterId: tester.mediaTesterId });
          }
        }

        if (apiCallSuccessful) {
          successCount++;
        } else {
          errorCount++;
          console.warn('Skipping API call due to missing required fields');
        }

        // Always remove from local list regardless of API call success
        removeTester(tester.id);

        // Clear selection if this was selected
        if (selectedTester === tester.id) {
          setSelectedTester(null);
        }

      } catch (error) {
        console.error(`Error removing ${tester.type} tester:`, error);
        errorCount++;

        // Still remove from local list even on error
        removeTester(tester.id);
        if (selectedTester === tester.id) {
          setSelectedTester(null);
        }
      }
    }

    setRemoveAllDialog({ open: false });

    // Show summary notification
    const totalProcessed = successCount + errorCount;
    if (errorCount === 0 && successCount > 0) {
      setNotification({
        open: true,
        message: `All ${successCount} ${testerType.replace('-', ' ')} testers removed successfully`,
        severity: 'success'
      });
    } else if (successCount === 0 && totalProcessed > 0) {
      setNotification({
        open: true,
        message: `Failed to remove all ${totalProcessed} ${testerType.replace('-', ' ')} testers via API (removed from UI)`,
        severity: 'error'
      });
    } else if (successCount > 0 && errorCount > 0) {
      setNotification({
        open: true,
        message: `Removed ${successCount} testers successfully, ${errorCount} failed (all removed from UI)`,
        severity: 'error'
      });
    } else if (totalProcessed === 0) {
      setNotification({
        open: true,
        message: `No ${testerType.replace('-', ' ')} testers found to remove`,
        severity: 'success'
      });
    }

    setIsDeleting(false);
  };

  const handleRemoveAllCancel = () => {
    setRemoveAllDialog({ open: false });
  };


  // Navigation handlers for create tester actions
  const handleAddSipTester = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent accordion toggle
    navigate('/sip-tester/create-tester');
  };

  const handleAddRtpTester = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent accordion toggle
    setRtpMenuAnchor(event.currentTarget as HTMLElement);
  };

  const handleAddMediaTester = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent accordion toggle
    navigate('/media-tester/create-media-tester');
  };

  const handleRtpMenuClose = () => {
    setRtpMenuAnchor(null);
  };

  const handleRtpOpenReceivingPoint = () => {
    setRtpMenuAnchor(null);
    navigate('/rtp-tester/open-receiving-points');
  };

  const handleRtpStartStream = () => {
    setRtpMenuAnchor(null);
    navigate('/rtp-tester/start-stream');
  };

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

  const getTestersByType = (type: TesterType) => {
    return state.testers.filter(tester => tester.type === type);
  };

  const getTesterIcon = (type: TesterType) => {
    switch (type) {
      case 'sip-tester': return <ComputerIcon />;
      case 'rtp-tester': return <AnalyticsIcon />;
      case 'media-tester': return <SettingsIcon />;
      default: return <ComputerIcon />;
    }
  };

  const getTesterTypeLabel = (type: TesterType) => {
    switch (type) {
      case 'sip-tester': return 'SIP Testers';
      case 'rtp-tester': return 'RTP Testers';
      case 'media-tester': return 'Media Testers';
      default: return 'Testers';
    }
  };

  const renderTesterDetails = (tester: any) => {
    return (
      <Card sx={{ mt: 1, ml: 2, mr: 1 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant="subtitle2" gutterBottom>
            Tester Details
          </Typography>

          {/* SIP Tester specific details */}
          {tester.type === 'sip-tester' && (
            <>
              {tester.sipTesterId && (
                <Typography variant="caption" display="block" color="text.secondary">
                  {/* SIP Tester ID: {tester.sipTesterId} */}
                </Typography>
              )}
              {tester.details?.sipTesterId && (
                <Typography variant="caption" display="block" color="text.secondary">
                  SIP Tester ID: {tester.details.sipTesterId}
                </Typography>
              )}
              {tester.details?.listeningAddress && (
                <>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1, fontWeight: 'bold' }}>
                    Listening Address:
                  </Typography>
                  {/* <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 1 }}>
                    IP: {tester.details.listeningAddress.ip}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 1 }}>
                    Port: {tester.details.listeningAddress.port}
                  </Typography> */}
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 1 }}>
                    Protocol: {tester.details.listeningAddress.transportProtocol}
                  </Typography>
                  {/* <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 1 }}>
                    Alias: {tester.details.listeningAddress.alias}
                  </Typography> */}
                  {tester.details.listeningAddress.sipAddress && (
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 1 }}>
                      SIP Address: {tester.details.listeningAddress.sipAddress}
                    </Typography>
                  )}
                </>
              )}

              {/* Dialog IDs section */}
              {tester.dialogIds && tester.dialogIds.length > 0 && (
                <>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1, fontWeight: 'bold' }}>
                    Dialog IDs ({tester.dialogIds.length}):
                  </Typography>
                  {tester.dialogIds.map((dialogId: string, index: number) => (
                    <Typography key={index} variant="body2" display="block" color="text.primary" sx={{ ml: 1, fontSize: '0.85rem', fontFamily: 'monospace' }}>
                      {index + 1}. {dialogId}
                    </Typography>
                  ))}
                </>
              )}
            </>
          )}

          {/* RTP Tester specific details */}
          {tester.type === 'rtp-tester' && (
            <>
              {tester.rtpTesterId && (
                <Typography variant="caption" display="block" color="text.secondary">
                  {/* RTP Tester ID: {tester.rtpTesterId} */}
                </Typography>
              )}
              {tester.details?.rtpTesterId && (
                <Typography variant="caption" display="block" color="text.secondary">
                  RTP Tester ID: {tester.details.rtpTesterId}
                </Typography>
              )}
              {tester.senderId && (
                <Typography variant="caption" display="block" color="text.secondary">
                  Sender ID: {tester.senderId}
                </Typography>
              )}
              {tester.details?.senderId && (
                <Typography variant="caption" display="block" color="text.secondary">
                  Sender ID: {tester.details.senderId}
                </Typography>
              )}
            </>
          )}

          {/* Media Tester specific details */}
          {tester.type === 'media-tester' && (
            <>
              {tester.mediaTesterId && (
                <Typography variant="caption" display="block" color="text.secondary">
                  Media Tester ID: {tester.mediaTesterId}
                </Typography>
              )}
              {/*{tester.details?.mediaTesterId && (*/}
              {/*  <Typography variant="caption" display="block" color="text.secondary">*/}
              {/*    Media Tester ID: {tester.details.mediaTesterId}*/}
              {/*  </Typography>*/}
              {/*)}*/}
              {tester.details?.listeningAddress?.transportProtocol && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 1 }}>
                  transportProtocol: {tester.details.listeningAddress.transportProtocol}
                </Typography>
              )}
              {tester.details?.listeningAddress?.sipAddress && (
                <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 1 }}>
                  sipAddress: {tester.details.listeningAddress.sipAddress}
                </Typography>
              )}
            </>
          )}

          {/* Common fields from details */}
          {tester.details?.ip && (
            <Typography variant="caption" display="block" color="text.secondary">
              IP: {tester.details.ip}
            </Typography>
          )}
          {tester.details?.port && (
            <Typography variant="caption" display="block" color="text.secondary">
              Port: {tester.details.port}
            </Typography>
          )}
          {tester.details?.status && (
            <Typography variant="caption" display="block" color="text.secondary">
              Status: {tester.details.status}
            </Typography>
          )}

          {/* Additional metadata */}
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
          {tester.operation && (
            <Typography variant="caption" display="block" color="text.secondary">
              Tester role :
              {tester.operation == 'openReceivingPoints' ? 'Receiver' : 'Streamer'}
            </Typography>
          )}

          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
            Created: {new Date(tester.createdAt).toLocaleString()}
          </Typography>

          {/* Raw response data for debugging (collapsible) */}
          {tester.details && Object.keys(tester.details).length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
                {/* Full Response Data: */}
              </Typography>
              {/* <Box sx={{
                backgroundColor: '#f5f5f5',
                padding: 1,
                borderRadius: 1,
                maxHeight: 200,
                overflow: 'auto',
                fontSize: '0.7rem',
                fontFamily: 'monospace'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(tester.details, null, 2)}
                </pre>
              </Box> */}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{
        p: 2.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
        background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.03) 0%, rgba(66, 165, 245, 0.06) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <Box sx={{
          position: 'absolute',
          top: -10,
          left: -10,
          width: 40,
          height: 40,
          background: 'radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 3s infinite',
        }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(66, 165, 245, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            🔧
          </Box>
          <Box>
            <Typography 
              variant="h6" 
              component="h2"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                fontSize: '1.1rem',
                lineHeight: 1.2,
              }}
            >
              Active Testers
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.75rem',
                opacity: 0.8,
              }}
            >
              Manage your tester instances
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative', zIndex: 1 }}>
          <Chip 
            label={state.testers.length} 
            color="primary" 
            size="small"
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
              '& .MuiChip-label': {
                fontSize: '0.8rem',
              },
            }}
          />
          {state.testers.length > 0 && (
            <Box sx={{ 
              width: 6, 
              height: 6, 
              borderRadius: '50%', 
              backgroundColor: 'success.main',
              animation: 'pulse 2s infinite',
            }} />
          )}
        </Box>
      </Box>

      {/* Tester Categories with Collapsible Sections */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {(['sip-tester', 'rtp-tester', 'media-tester'] as TesterType[]).map((testerType) => {
          const testers = getTestersByType(testerType);

          return (
            <Accordion key={testerType} defaultExpanded={testers.length > 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {getTesterIcon(testerType)}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="subtitle2">
                      {getTesterTypeLabel(testerType)}
                    </Typography>
                  </Box>
                  <Chip size="small" label={testers.length} color="primary" />

                  {/* Add Tester Button */}
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={(event) => {
                      switch (testerType) {
                        case 'sip-tester':
                          handleAddSipTester(event);
                          break;
                        case 'rtp-tester':
                          handleAddRtpTester(event);
                          break;
                        case 'media-tester':
                          handleAddMediaTester(event);
                          break;
                      }
                    }}
                    title={`Add new ${getTesterTypeLabel(testerType).slice(0, -1)}`}
                    sx={{
                      ml: 1,
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'white'
                      }
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>

                  {testers.length > 0 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(event) => handleRemoveAllClick(testerType, event)}
                      title={`Remove all ${getTesterTypeLabel(testerType)}`}
                      sx={{
                        ml: 1,
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white'
                        }
                      }}
                    >
                      <DeleteSweepIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <List component="div" disablePadding>
                  {testers.length === 0 ? (
                    <ListItem sx={{ pl: 2 }}>
                      <ListItemText
                        primary="No active testers"
                        secondary="Create a new tester to get started"
                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ) : (
                    testers.map((tester) => (
                      <React.Fragment key={tester.id}>
                        <ListItemButton
                          sx={{
                            pl: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onClick={() => handleTesterClick(tester.id)}
                          selected={selectedTester === tester.id}
                        >
                          <ListItemText
                            primary={getTesterDisplayName(tester)}
                            secondary={`ID: ${tester.id.slice(0, 8)}...`}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(event) => handleDeleteClick(tester, event)}
                            title="Remove Tester"
                            sx={{
                              ml: 1,
                              '&:hover': {
                                backgroundColor: 'error.light',
                                color: 'white'
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemButton>
                        {selectedTester === tester.id && renderTesterDetails(tester)}
                      </React.Fragment>
                    ))
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* Sidebar Drawer - Always Open */}
      <Box
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          position: 'relative',
          left: 0,
          top: 0,
        }}
      >
        {drawerContent}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          minHeight: '100vh',
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
        }}
      >
        {children}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove {deleteDialog.tester ? getTesterDisplayName(deleteDialog.tester) : 'this tester'}?
            {deleteDialog.tester?.type === 'sip-tester' && ' This will call the remove SIP tester API.'}
            {deleteDialog.tester?.type === 'rtp-tester' && ' This will call the remove RTP tester API.'}
            {deleteDialog.tester?.type === 'media-tester' && ' This will call the remove Media tester API.'}
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
          >
            {isDeleting ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove All Confirmation Dialog */}
      <Dialog open={removeAllDialog.open} onClose={handleRemoveAllCancel}>
        <DialogTitle>Confirm Remove All</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove all {removeAllDialog.type ? getTesterTypeLabel(removeAllDialog.type) : ''}?
            This will remove {removeAllDialog.type ? getTestersByType(removeAllDialog.type).length : 0} testers.
            {removeAllDialog.type === 'sip-tester' && ' This will call the remove SIP tester API for each tester.'}
            {removeAllDialog.type === 'rtp-tester' && ' This will call the remove RTP tester API for each tester.'}
            {removeAllDialog.type === 'media-tester' && ' This will call the remove Media tester API for each tester.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveAllCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleRemoveAllConfirm}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Removing All...' : 'Remove All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      {/* <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar> */}

      {/* RTP Tester Options Menu */}
      <Menu
        anchorEl={rtpMenuAnchor}
        open={Boolean(rtpMenuAnchor)}
        onClose={handleRtpMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={handleRtpOpenReceivingPoint}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AnalyticsIcon sx={{ mr: 1, fontSize: 20 }} />
            Add RTP receiver
          </Box>
        </MenuItem>
        <MenuItem onClick={handleRtpStartStream}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AnalyticsIcon sx={{ mr: 1, fontSize: 20 }} />
            Add RTP streamer
          </Box>
        </MenuItem>
      </Menu>
    </Box>
  );
};
