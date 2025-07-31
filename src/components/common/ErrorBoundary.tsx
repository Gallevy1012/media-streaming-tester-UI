import { Component } from 'react';
import type { ReactNode } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Collapse,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRefreshInvites?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      showDetails: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({
      error,
      errorInfo,
    });

    // Log to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }


  handleRetry = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      showDetails: false,
    });
  };

  handleRefreshInvites = () => {
    if (this.props.onRefreshInvites) {
      this.props.onRefreshInvites();
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            p: 3,
          }}
        >
          <Paper
            sx={{
              p: 4,
              maxWidth: 600,
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.05) 0%, rgba(255, 255, 255, 0.95) 100%)',
              border: '1px solid rgba(244, 67, 54, 0.1)',
            }}
          >
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.7 },
                },
              }}
            />

            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Oops! Something went wrong
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.handleRetry}
                sx={{ minWidth: 120 }}
              >
                Try Again
              </Button>
              <Button
                variant="outlined"
                onClick={this.handleRefreshInvites}
                disabled={!this.props.onRefreshInvites}
              >
                Refresh Invites
              </Button>
            </Box>

            {this.state.error && (
              <Box sx={{ mt: 3 }}>
                <Button
                  size="small"
                  endIcon={this.state.showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  onClick={this.toggleDetails}
                  sx={{ mb: 2 }}
                >
                  {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                </Button>

                <Collapse in={this.state.showDetails}>
                  <Alert severity="error" sx={{ textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
                      <strong>Error:</strong> {this.state.error.message}
                    </Typography>
                    {this.state.error.stack && (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {this.state.error.stack}
                      </Typography>
                    )}
                  </Alert>
                </Collapse>
              </Box>
            )}
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
