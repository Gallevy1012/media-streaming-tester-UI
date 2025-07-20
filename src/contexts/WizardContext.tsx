/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { WizardState, TesterType, TesterFunction } from '../types';

export interface WizardContextType {
  state: WizardState;
  setTesterType: (testerType: TesterType) => void;
  setSelectedFunction: (func: TesterFunction) => void;
  updateFormData: (data: Record<string, unknown>) => void;
  clearFormData: () => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const initialState: WizardState = {
  currentStep: 0,
  testerType: null,
  selectedFunction: null,
  formData: {},
};

type WizardAction =
  | { type: 'SET_TESTER_TYPE'; payload: TesterType }
  | { type: 'SET_SELECTED_FUNCTION'; payload: TesterFunction }
  | { type: 'UPDATE_FORM_DATA'; payload: Record<string, unknown> }
  | { type: 'CLEAR_FORM_DATA' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' };

const wizardReducer = (state: WizardState, action: WizardAction): WizardState => {
  switch (action.type) {
    case 'SET_TESTER_TYPE':
      return {
        ...state,
        testerType: action.payload,
        currentStep: 1,
        selectedFunction: null,
        formData: {},
      };
    case 'SET_SELECTED_FUNCTION':
      return {
        ...state,
        selectedFunction: action.payload,
        currentStep: 2,
        formData: {},
      };
    case 'UPDATE_FORM_DATA':
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
      };
    case 'CLEAR_FORM_DATA':
      return {
        ...state,
        formData: {},
      };
    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: action.payload,
      };
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: state.currentStep + 1,
      };
    case 'PREV_STEP':
      return {
        ...state,
        currentStep: Math.max(0, state.currentStep - 1),
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export const WizardContext = createContext<WizardContextType | undefined>(undefined);

interface WizardProviderProps {
  children: ReactNode;
}

export const WizardProvider: React.FC<WizardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const setTesterType = useCallback((testerType: TesterType) => {
    dispatch({ type: 'SET_TESTER_TYPE', payload: testerType });
  }, []);

  const setSelectedFunction = useCallback((func: TesterFunction) => {
    dispatch({ type: 'SET_SELECTED_FUNCTION', payload: func });
  }, []);

  const updateFormData = useCallback((data: Record<string, unknown>) => {
    dispatch({ type: 'UPDATE_FORM_DATA', payload: data });
  }, []);

  const clearFormData = useCallback(() => {
    dispatch({ type: 'CLEAR_FORM_DATA' });
  }, []);

  const goToStep = useCallback((step: number) => {
    dispatch({ type: 'GO_TO_STEP', payload: step });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const prevStep = useCallback(() => {
    dispatch({ type: 'PREV_STEP' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value: WizardContextType = {
    state,
    setTesterType,
    setSelectedFunction,
    updateFormData,
    clearFormData,
    goToStep,
    nextStep,
    prevStep,
    reset,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
};
