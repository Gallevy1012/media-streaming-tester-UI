import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { TesterProvider } from './contexts/TesterContext';
import { WizardProvider } from './contexts/WizardContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout, SidebarLayout } from './components/layout';
import { TesterSelection, TesterFunctionSelection } from './components/testerSelection';
import { SipTestForm, CreateSipTesterForm, RemoveSipTesterForm, SendSipInviteForm, SendSipByeForm } from './components/forms/sip';
import { RtpTestForm } from './components/forms/rtp';
import { MediaTestForm, SendMediaInviteForm } from './components/forms/media';
import { PersistentAuthBox } from './components/auth';
import type { TesterType } from './types';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5', 
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#f44336',
      dark: '#c62828',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8faff',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.02em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.05)',
    '0px 2px 6px rgba(0, 0, 0, 0.08)',
    '0px 4px 12px rgba(0, 0, 0, 0.1)',
    '0px 6px 18px rgba(0, 0, 0, 0.12)',
    '0px 8px 24px rgba(0, 0, 0, 0.14)',
    '0px 10px 30px rgba(0, 0, 0, 0.16)',
    '0px 12px 36px rgba(0, 0, 0, 0.18)',
    '0px 14px 42px rgba(0, 0, 0, 0.2)',
    '0px 16px 48px rgba(0, 0, 0, 0.22)',
    '0px 18px 54px rgba(0, 0, 0, 0.24)',
    '0px 20px 60px rgba(0, 0, 0, 0.26)',
    '0px 22px 66px rgba(0, 0, 0, 0.28)',
    '0px 24px 72px rgba(0, 0, 0, 0.3)',
    '0px 26px 78px rgba(0, 0, 0, 0.32)',
    '0px 28px 84px rgba(0, 0, 0, 0.34)',
    '0px 30px 90px rgba(0, 0, 0, 0.36)',
    '0px 32px 96px rgba(0, 0, 0, 0.38)',
    '0px 34px 102px rgba(0, 0, 0, 0.4)',
    '0px 36px 108px rgba(0, 0, 0, 0.42)',
    '0px 38px 114px rgba(0, 0, 0, 0.44)',
    '0px 40px 120px rgba(0, 0, 0, 0.46)',
    '0px 42px 126px rgba(0, 0, 0, 0.48)',
    '0px 44px 132px rgba(0, 0, 0, 0.5)',
    '0px 46px 138px rgba(0, 0, 0, 0.52)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#1976d2 transparent',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9rem',
          padding: '10px 20px',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0px)',
          },
          '&:focus-visible': {
            outline: '2px solid',
            outlineOffset: 2,
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1565c0 0%, #2196f3 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            background: 'rgba(25, 118, 210, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          fontSize: '0.8rem',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#42a5f5',
                borderWidth: 2,
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
                borderColor: '#1976d2',
                boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
              },
            },
            '&.Mui-error': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#d32f2f',
              },
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '12px !important',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: '8px 0',
            boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.8rem',
          fontWeight: 500,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
        },
      },
    },
  },
});

function MainPage() {
  const navigate = useNavigate();

  const handleTesterSelect = (testerType: TesterType) => {
    // Navigate to the specific tester configuration page
    navigate(`/${testerType}`);
  };

  return (
    <Layout>
      <Box 
        sx={{ 
          position: 'relative',
          minHeight: '100vh',
          background: 'transparent',
        }}
        className="page-transition"
      >
        {/* Persistent Authentication Box in top-left corner */}
        <PersistentAuthBox />
        
        {/* Hero Section */}
        <Box sx={{ 
          textAlign: 'center', 
          pt: { xs: 4, sm: 6 }, 
          pb: { xs: 30, sm: 4 },
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.03) 0%, rgba(66, 165, 245, 0.06) 50%, rgba(25, 118, 210, 0.03) 100%)',
          borderRadius: 4,
          mb: { xs: 3, sm: 4 },
          mx: { xs: 1, sm: 2 },
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(25, 118, 210, 0.08)',
        }}>
          {/* Background decoration */}
          <Box sx={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(25, 118, 210, 0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-20px) rotate(180deg)' },
            },
          }} />
          <Box sx={{
            position: 'absolute',
            bottom: -800,
            right: -80,
            width: 160,
            height: 1660,
            background: 'radial-gradient(circle, rgba(66, 165, 245, 0.05) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse',
          }} />
          
          <Typography 
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 50%, #1976d2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              letterSpacing: '-0.02em',
              position: 'relative',
              zIndex: 100,
            }}
          >
            🚀 MS-Tester
          </Typography>
          <Typography 
            variant="h5" 
            color="text.secondary"
            sx={{ 
              maxWidth: { xs: 300, sm: 500, md: 700 }, 
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.4,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              position: 'relative',
              zIndex: 1,
            }}
          >
            Professional testing suite for{' '}
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
              SIP, RTP, and Media
            </Box>{' '}
            streaming protocols
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              mt: 2,
              opacity: 0.8,
              fontStyle: 'italic',
              fontSize: { xs: '0.9rem', sm: '1rem' },
              position: 'relative',
              zIndex: 1,
            }}
          >
            Choose a testing module below to get started • Authentication available in the top-left corner
          </Typography>

          {/* CTA Indicators */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 2, 
            mt: 3,
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
          }}>
            {['🎯 Reliable', '⚡ Fast', '📊 Detailed'].map((feature, index) => (
              <Box
                key={index}
                sx={{
                  px: 2,
                  py: 0.8,
                  background: 'rgba(25, 118, 210, 0.08)',
                  borderRadius: 20,
                  border: '1px solid rgba(25, 118, 210, 0.15)',
                  backdropFilter: 'blur(10px)',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.2}s both`,
                  '@keyframes fadeInUp': {
                    from: { opacity: 0, transform: 'translateY(20px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.dark' }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        
        {/* Main Content */}
        <Box sx={{ mx: 2 }}>
          <TesterSelection onTesterSelect={handleTesterSelect} />
        </Box>

        {/* Feature Highlights */}
        <Box sx={{ 
          mt: { xs: 4, sm: 6 }, 
          mx: { xs: 1, sm: 2 },
          p: { xs: 3, sm: 4 }, 
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.03) 0%, rgba(139, 195, 74, 0.06) 50%, rgba(76, 175, 80, 0.03) 100%)',
          borderRadius: 4,
          textAlign: 'center',
          border: '1px solid rgba(76, 175, 80, 0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background pattern */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(76, 175, 80, 0.02) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 195, 74, 0.02) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />
          
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              fontWeight: 700, 
              mb: 4,
              position: 'relative',
              zIndex: 1,
              background: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ✨ Why Choose MS-Tester ?
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, 
            gap: { xs: 3, sm: 4 },
            textAlign: 'left',
            position: 'relative',
            zIndex: 1,
          }}>
            {[
              {
                icon: '🎯',
                title: 'Comprehensive Testing',
                desc: 'Full-featured testing for SIP, RTP, and Media protocols with real-time monitoring and detailed analytics',
                color: 'primary.main',
              },
              {
                icon: '🔧',
                title: 'Easy Configuration',
                desc: 'Intuitive interface for quick test setup, parameter configuration, and automated test execution',
                color: 'warning.main',
              },
              {
                icon: '📊',
                title: 'Detailed Analytics',
                desc: 'In-depth reporting, visual charts, and comprehensive test result analysis with export capabilities',
                color: 'success.main',
              },
            ].map((feature, index) => (
              <Box 
                key={index}
                sx={{
                  p: 3,
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `slideInUp 0.6s ease-out ${index * 0.2}s both`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    '& .feature-icon': {
                      transform: 'scale(1.1) rotate(5deg)',
                    },
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${feature.color} 0%, transparent 100%)`,
                    borderRadius: '3px 3px 0 0',
                  },
                  '@keyframes slideInUp': {
                    from: { opacity: 0, transform: 'translateY(30px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box 
                    className="feature-icon"
                    sx={{ 
                      fontSize: '2rem',
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      color: feature.color,
                    }}
                  >
                    {feature.title}
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    lineHeight: 1.6,
                    fontSize: '0.9rem',
                  }}
                >
                  {feature.desc}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Bottom CTA */}
          <Box sx={{ 
            mt: 4, 
            pt: 3,
            borderTop: '1px solid rgba(76, 175, 80, 0.1)',
            position: 'relative',
            zIndex: 1,
          }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontStyle: 'italic',
                opacity: 0.8,
              }}
            >
              Ready to start testing? Select a module above and begin your professional testing journey! 🚀
            </Typography>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}

function TesterFunctionsPage() {
  const { testerType } = useParams<{ testerType: TesterType }>();
  const navigate = useNavigate();

  const handleFunctionSelect = (functionId: string) => {
    navigate(`/${testerType}/${functionId}`);
  };

  if (!testerType) {
    navigate('/');
    return null;
  }

  return (
    <SidebarLayout>
      <Box 
        sx={{ 
          px: 3,
          py: 3,
          minHeight: '100vh', 
          width: '100%', 
          maxWidth: 'none',
          overflow: 'visible',
        }}
        className="page-transition"
      >
        {/* Header Section */}
        <Box sx={{ 
          mb: 4, 
          textAlign: 'center',
          p: 3,
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)',
          borderRadius: 3,
          border: '1px solid rgba(25, 118, 210, 0.1)',
        }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            🎛️ {testerType.charAt(0).toUpperCase() + testerType.slice(1).replace('-', ' ')} Functions
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ 
              maxWidth: 600, 
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Select the specific function you want to execute. Each function provides detailed configuration options and real-time feedback.
          </Typography>
        </Box>

        <TesterFunctionSelection
          testerType={testerType}
          onFunctionSelect={handleFunctionSelect}
        />
      </Box>
    </SidebarLayout>
  );
}

function TesterFormPage() {
  const { testerType, functionId } = useParams<{ testerType: TesterType; functionId: string }>();
  const navigate = useNavigate();

  if (!testerType || !functionId) {
    navigate('/');
    return null;
  }

  const handleTestComplete = (result: any) => {
    console.log('Test completed:', result);
  };

  const handleBack = () => {
    navigate(`/${testerType}`);
  };

  const renderForm = () => {
    switch (testerType) {
      case 'sip-tester':
        switch (functionId) {
          case 'create-tester':
          case 'create':
            return <CreateSipTesterForm onTestComplete={handleTestComplete} onBack={handleBack} />;
          case 'remove':
            return <RemoveSipTesterForm onTestComplete={handleTestComplete} onBack={handleBack} />;
          case 'send-invite':
            return <SendSipInviteForm onTestComplete={handleTestComplete} onBack={handleBack} />;
          case 'send-bye':
            return <SendSipByeForm onTestComplete={handleTestComplete} onBack={handleBack} />;
          default:
            return <SipTestForm functionId={functionId} onTestComplete={handleTestComplete} onBack={handleBack} />;
        }
      case 'rtp-tester':
        return <RtpTestForm functionId={functionId} onTestComplete={handleTestComplete} onBack={handleBack} />;
      case 'media-tester':
        switch (functionId) {
          case 'send-invite':
            return <SendMediaInviteForm onTestComplete={handleTestComplete} onBack={handleBack} />;
          default:
            return <MediaTestForm functionId={functionId} onTestComplete={handleTestComplete} onBack={handleBack} />;
        }
      default:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              Unknown Tester Type
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The tester type "{testerType}" is not recognized.
            </Typography>
          </Box>
        );
    }
  };

  return (
    <SidebarLayout>
      <Box 
        sx={{ 
          pl: 2,
          pr: 4, 
          py: 3, 
          minHeight: '100vh', 
          width: '100%', 
          maxWidth: '100%',
        }}
        className="page-transition"
      >
        {/* Form Header */}
        <Box sx={{ 
          mb: 4, 
          p: { xs: 2.5, sm: 3 },
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 3,
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background decoration */}
          <Box sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            background: 'radial-gradient(circle, rgba(25, 118, 210, 0.08) 0%, transparent 70%)',
            borderRadius: '50%',
          }} />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              ⚙️ {functionId?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Configuration
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                opacity: 0.8,
                lineHeight: 1.6,
                fontSize: { xs: '0.9rem', sm: '1rem' },
              }}
            >
              Configure your <strong>{testerType?.replace('-', ' ')}</strong> parameters and execute the test with precision
            </Typography>
            
            {/* Progress indicator */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mt: 2,
              p: 1.5,
              background: 'rgba(25, 118, 210, 0.05)',
              borderRadius: 2,
              border: '1px solid rgba(25, 118, 210, 0.1)',
            }}>
              <Box sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: 'primary.main',
                animation: 'pulse 2s infinite',
              }} />
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                Configuration Mode Active
              </Typography>
            </Box>
          </Box>
        </Box>

        {renderForm()}
      </Box>
    </SidebarLayout>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AuthProvider>
          <TesterProvider>
            <WizardProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<MainPage />} />
                  <Route path="/dashboard" element={<MainPage />} />
                  
                  {/* Tester function selection pages */}
                  <Route path="/:testerType" element={<TesterFunctionsPage />} />
                  
                  {/* Specific function form pages */}
                  <Route path="/:testerType/:functionId" element={<TesterFormPage />} />
                </Routes>
              </Router>
            </WizardProvider>
          </TesterProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
