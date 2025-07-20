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

  const handleBreadcrumbClick = (href: string) => {
    navigate(href);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MS-Tester UI
          </Typography>

          {user && (
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" color="inherit">
                Welcome, {user.username}
              </Typography>
              
              <IconButton
                edge="end"
                color="inherit"
                onClick={handleMenuOpen}
                aria-label="account menu"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  <AccountIcon />
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={handleMenuClose}>
                  <AccountIcon sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          )}

          {!user && (
            <Typography variant="body2" color="inherit" sx={{ opacity: 0.7 }}>
              Please sign in to access all features
            </Typography>
          )}
        </Toolbar>
      </AppBar>

      {breadcrumbs.length > 0 && (
        <Box sx={{ bgcolor: 'grey.100', py: 1 }}>
          <Container maxWidth="lg">
            <Breadcrumbs separator="›" aria-label="breadcrumb">
              <Link
                component="button"
                variant="body2"
                onClick={() => handleBreadcrumbClick('/')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  color: 'inherit',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />
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
                      sx={{ fontWeight: isLast ? 600 : 400 }}
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
                      color: 'inherit',
                      '&:hover': { textDecoration: 'underline' },
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

      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>

      <Box component="footer" sx={{ bgcolor: 'grey.100', py: 2, mt: 'auto' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 MS-Tester UI. Built for comprehensive communication testing.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};
