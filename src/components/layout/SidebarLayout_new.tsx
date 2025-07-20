import React, { useState } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  ChevronLeft as ChevronLeftIcon,
  Computer as ComputerIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useTester } from '../../contexts/TesterContext';
import type { TesterType } from '../../types';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 350;

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'sip-tester': false,
    'rtp-tester': false,
    'media-tester': false,
  });
  const [selectedTester, setSelectedTester] = useState<string | null>(null);
  
  const { state } = useTester();

  const handleDrawerToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleSectionToggle = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
    setSelectedTester(null);
  };

  const handleTesterClick = (testerId: string) => {
    setSelectedTester(selectedTester === testerId ? null : testerId);
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
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
            Created: {new Date(tester.createdAt).toLocaleString()}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 100, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'flex-start',
        borderBottom: 1,
        borderColor: 'divider'
      }}>
        <Typography variant="h6" component="h2">
          Active Testers
        </Typography>
        <IconButton onClick={handleDrawerToggle} size="small">
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      {/* Tester Categories */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List dense>
          {(['sip-tester', 'rtp-tester', 'media-tester'] as TesterType[]).map((testerType) => {
            const testers = getTestersByType(testerType);
            const isExpanded = expandedSections[testerType];
            
            return (
              <React.Fragment key={testerType}>
                <ListItemButton onClick={() => handleSectionToggle(testerType)}>
                  <ListItemIcon>
                    {getTesterIcon(testerType)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={getTesterTypeLabel(testerType)}
                    secondary={`${testers.length} active`}
                  />
                  <Chip size="small" label={testers.length} color="primary" />
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {testers.length === 0 ? (
                      <ListItem sx={{ pl: 4 }}>
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
                            sx={{ pl: 4 }}
                            onClick={() => handleTesterClick(tester.id)}
                            selected={selectedTester === tester.id}
                          >
                            <ListItemText
                              primary={tester.name || `${testerType} ${tester.id.slice(0, 8)}`}
                              secondary={`ID: ${tester.id.slice(0, 8)}...`}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItemButton>
                          {selectedTester === tester.id && renderTesterDetails(tester)}
                        </React.Fragment>
                      ))
                    )}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar Drawer */}
      <Drawer
        variant="persistent"
        anchor="right"
        open={isOpen}
        sx={{
          width: isOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            borderLeft: 1,
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          transition: 'margin 0.3s',
          marginRight: isOpen ? `${DRAWER_WIDTH}px` : 0,
          overflow: 'auto',
          minHeight: '100vh',
        }}
      >
        {/* Toggle Button when sidebar is closed */}
        {!isOpen && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 1300,
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        {children}
      </Box>
    </Box>
  );
};
