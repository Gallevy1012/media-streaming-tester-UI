import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { TesterProvider } from './contexts/TesterContext';
import { WizardProvider } from './contexts/WizardContext';
import { Layout, SidebarLayout } from './components/layout';
import { TesterSelection, TesterFunctionSelection } from './components/testerSelection';
import { SipTestForm, CreateSipTesterForm, RemoveSipTesterForm, SendSipInviteForm, SendSipByeForm } from './components/forms/sip';
import { RtpTestForm } from './components/forms/rtp';
import { MediaTestForm } from './components/forms/media';
import { PersistentAuthBox } from './components/auth';
import type { TesterType } from './types';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
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
      <Box sx={{ p: 3, position: 'relative' }}>
        {/* Persistent Authentication Box in top-left corner */}
        <PersistentAuthBox />
        
        <Box sx={{ mb: 3, textAlign: 'center', mt: 8 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome to MS-Tester UI
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Choose a testing module to get started. Authentication is available in the top-left corner.
          </Typography>
        </Box>
        
        <TesterSelection onTesterSelect={handleTesterSelect} />
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
      <Box sx={{ 
        px: 2, // Minimal horizontal padding
        py: 2, // Minimal vertical padding
        minHeight: '100vh', 
        width: '100%', 
        maxWidth: 'none', // Remove max width restriction
        overflow: 'visible' // Ensure no hidden content
      }}>
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
        return <MediaTestForm functionId={functionId} onTestComplete={handleTestComplete} onBack={handleBack} />;
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
      <Box sx={{ 
        pl: 1, // Minimal left padding since sidebar is on the left
        pr: 3, 
        py: 3, 
        minHeight: '100vh', 
        width: '100%', 
        maxWidth: '100%' 
      }}>
        {renderForm()}
      </Box>
    </SidebarLayout>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
                
                {/* Legacy SIP tester direct route for backward compatibility */}
                <Route 
                  path="/sip-tester/create-tester" 
                  element={
                    <Layout>
                      <SipTestForm />
                    </Layout>
                  } 
                />
              </Routes>
            </Router>
          </WizardProvider>
        </TesterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
