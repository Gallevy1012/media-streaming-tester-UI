import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  ExitToApp as LogoutIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ProfileDialog } from '../auth';

interface LayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
}

export const Layout: React.FC<LayoutProps> = ({ children, breadcrumbs = [] }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [profileDialogOpen, setProfileDialogOpen] = React.useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    logout();
    // No navigation needed since we're on the same page with conditional rendering
  };

  const handleProfileClick = () => {
    handleMenuClose();
    setProfileDialogOpen(true);
  };

  const handleProfileClose = () => {
    setProfileDialogOpen(false);
  };

  const handleBreadcrumbClick = (href: string) => {
    navigate(href);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar sx={{ minHeight: 64 }}>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 700,
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            🚀 MS-Tester 
          </Typography>

          {user && (
            <Box display="flex" alignItems="center" gap={2}>
              <Box
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography 
                  variant="body2" 
                  color="inherit"
                  sx={{ fontWeight: 500 }}
                >
                  Welcome, {user.username}
                </Typography>
              </Box>
              
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleMenuOpen}
                aria-label="account menu"
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.2)',
                  },
                }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                  <AccountIcon />
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    mt: 1,
                  },
                }}
              >
                <MenuItem 
                  onClick={handleProfileClick}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    mb: 0.5,
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(66, 165, 245, 0.1) 100%)',
                    },
                  }}
                >
                  <AccountIcon sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <MenuItem 
                  onClick={handleLogout}
                  sx={{
                    borderRadius: 1,
                    mx: 1,
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(244, 67, 54, 0.1) 100%)',
                    },
                  }}
                >
                  <LogoutIcon sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          )}

          {!user && (
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                px: 2,
                py: 0.5,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Typography variant="body2" color="inherit" sx={{ opacity: 0.9 }}>
                Please sign in to access all features
              </Typography>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {breadcrumbs.length > 0 && (
        <Box sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.9)', 
          py: 1.5,
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(10px)',
        }}>
          <Container maxWidth="lg">
            <Breadcrumbs 
              separator="›" 
              aria-label="breadcrumb"
              sx={{
                '& .MuiBreadcrumbs-separator': {
                  mx: 1,
                  color: 'primary.main',
                  fontWeight: 'bold',
                },
              }}
            >
              <Link
                component="button"
                variant="body2"
                onClick={() => handleBreadcrumbClick('/')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'primary.main',
                  fontWeight: 500,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': { 
                    textDecoration: 'underline',
                    transform: 'scale(1.02)',
                  },
                }}
              >
                <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
                Home
              </Link>
              
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                
                if (isLast || !crumb.href) {
                  return (
                    <Typography
                      key={index}
                      variant="body2"
                      color="text.primary"
                      sx={{ 
                        fontWeight: isLast ? 600 : 400,
                        opacity: isLast ? 1 : 0.7,
                      }}
                    >
                      {crumb.label}
                    </Typography>
                  );
                }
                
                return (
                  <Link
                    key={index}
                    component="button"
                    variant="body2"
                    onClick={() => handleBreadcrumbClick(crumb.href!)}
                    sx={{
                      textDecoration: 'none',
                      color: 'primary.main',
                      fontWeight: 500,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': { 
                        textDecoration: 'underline',
                        transform: 'scale(1.02)',
                      },
                    }}
                  >
                    {crumb.label}
                  </Link>
                );
              })}
            </Breadcrumbs>
          </Container>
        </Box>
      )}

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          background: 'transparent',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 0 }}>
          {children}
        </Container>
      </Box>

      <Box 
        component="footer" 
        sx={{ 
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)',
          py: 3, 
          mt: 'auto',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        }}
      >
        <Container maxWidth="lg">
        </Container>
      </Box>

      {/* Profile Dialog */}
      <ProfileDialog 
        open={profileDialogOpen} 
        onClose={handleProfileClose} 
      />
    </Box>
  );
};
