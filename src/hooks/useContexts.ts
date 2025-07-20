import { useContext } from 'react';
import { WizardContext } from '../contexts/WizardContext';
import type { WizardContextType } from '../contexts/WizardContext';



export const useWizard = (): WizardContextType => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};
