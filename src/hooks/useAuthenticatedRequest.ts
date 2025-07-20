import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UseAuthenticatedRequestOptions {
  requireAuth?: boolean;
  onAuthRequired?: () => void;
}

interface UseAuthenticatedRequestReturn {
  isAuthDialogOpen: boolean;
  openAuthDialog: () => void;
  closeAuthDialog: () => void;
  executeWithAuth: <T>(
    requestFn: () => Promise<T>,
    options?: UseAuthenticatedRequestOptions
  ) => Promise<T | null>;
}

export const useAuthenticatedRequest = (): UseAuthenticatedRequestReturn => {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const { state } = useAuth();

  const openAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(true);
  }, []);

  const closeAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(false);
  }, []);

  const executeWithAuth = useCallback(async <T>(
    requestFn: () => Promise<T>,
    options: UseAuthenticatedRequestOptions = {}
  ): Promise<T | null> => {
    const { requireAuth = true, onAuthRequired } = options;

    if (requireAuth && !state.isAuthenticated) {
      // User is not authenticated, show auth dialog
      setIsAuthDialogOpen(true);
      onAuthRequired?.();
      return null;
    }

    try {
      return await requestFn();
    } catch (error) {
      // If we get a 401 error, the token might be expired
      if (error instanceof Error && error.message.includes('401')) {
        setIsAuthDialogOpen(true);
        onAuthRequired?.();
        return null;
      }
      throw error;
    }
  }, [state.isAuthenticated]);

  return {
    isAuthDialogOpen,
    openAuthDialog,
    closeAuthDialog,
    executeWithAuth,
  };
};
