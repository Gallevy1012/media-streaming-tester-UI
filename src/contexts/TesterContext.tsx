import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';

export interface TesterInstance {
  id: string;
  name: string; // e.g., "sip-tester-1", "rtp-tester-1"
  type: 'sip-tester' | 'rtp-tester' | 'media-tester';
  details: any; // The response from create API
  createdAt: Date;
  // Additional fields for remove operations
  interactionKey?: string; // For RTP tester
  requestId?: string; // For SIP tester and others
  rtpTesterId?: string; // For RTP tester
  sipTesterId?: string; // For SIP tester
  mediaTesterId?: string; // For Media tester
  senderId?: string; // For RTP startStream operations
  operation?: string; // The operation that created this tester (e.g., 'create', 'openReceivingPoints', 'startStream')
  dialogIds?: string[]; // List of dialog IDs for SIP testers
}

interface TesterState {
  testers: TesterInstance[];
  counters: {
    'sip-tester': number;
    'rtp-tester': number;
    'media-tester': number;
  };
}

type TesterAction =
  | { type: 'ADD_TESTER'; payload: { 
      type: TesterInstance['type']; 
      details: any; 
      alias?: string;
      interactionKey?: string; 
      requestId?: string;
      rtpTesterId?: string;
      sipTesterId?: string;
      mediaTesterId?: string;
      senderId?: string;
      operation?: string;
    } }
  | { type: 'REMOVE_TESTER'; payload: { id: string } }
  | { type: 'ADD_DIALOG_ID'; payload: { sipTesterId: string; dialogId: string } }
  | { type: 'LOAD_FROM_STORAGE' };

const initialState: TesterState = {
  testers: [],
  counters: {
    'sip-tester': 0,
    'rtp-tester': 0,
    'media-tester': 0,
  },
};

function testerReducer(state: TesterState, action: TesterAction): TesterState {
  switch (action.type) {
    case 'ADD_TESTER': {
      const { type, details, interactionKey, requestId, rtpTesterId, sipTesterId, mediaTesterId, senderId, operation , alias } = action.payload;
      console.log('TesterContext: Adding tester', { type, rtpTesterId, sipTesterId, mediaTesterId, senderId, operation });
      const newCounter = state.counters[type] + 1;
      const newTester: TesterInstance = {
        id: `${type}-${newCounter}`,
        name: alias ? alias : `${type}-${newCounter}`,
        type,
        details,
        createdAt: new Date(),
        interactionKey,
        requestId,
        rtpTesterId,
        sipTesterId,
        mediaTesterId,
        senderId,
        operation,
        dialogIds: type === 'sip-tester' ? [] : undefined,
      };
      console.log('TesterContext: Created new tester', newTester);

      const newState = {
        ...state,
        testers: [...state.testers, newTester],
        counters: {
          ...state.counters,
          [type]: newCounter,
        },
      };
      console.log('TesterContext: New state', newState);

      // Save to localStorage
      localStorage.setItem('tester-instances', JSON.stringify(newState));
      return newState;
    }

    case 'REMOVE_TESTER': {
      const newState = {
        ...state,
        testers: state.testers.filter(t => t.id !== action.payload.id),
      };

      // Save to localStorage
      localStorage.setItem('tester-instances', JSON.stringify(newState));
      return newState;
    }

    case 'ADD_DIALOG_ID': {
      const { sipTesterId, dialogId } = action.payload;
      console.log('ADD_DIALOG_ID: Looking for sipTesterId:', sipTesterId);
      
      const newState = {
        ...state,
        testers: state.testers.map(tester => {
          console.log('Checking tester:', { 
            id: tester.id, 
            type: tester.type, 
            sipTesterId: tester.sipTesterId,
            detailsSipTesterId: tester.details?.sipTesterId,
            detailsTesterId: tester.details?.testerId
          });
          
          // Primary match: by sipTesterId
          if (tester.type === 'sip-tester' && tester.sipTesterId === sipTesterId) {
            console.log('MATCH by sipTesterId! Adding dialog ID:', dialogId);
            return {
              ...tester,
              dialogIds: [...(tester.dialogIds || []), dialogId]
            };
          }
          
          // Fallback match: if sipTesterId is undefined, try to match by the sipTesterId in the details
          if (tester.type === 'sip-tester' && 
              !tester.sipTesterId && 
              tester.details && 
              (tester.details.sipTesterId === sipTesterId || tester.details.testerId === sipTesterId)) {
            console.log('FALLBACK MATCH by details! Adding dialog ID:', dialogId, 'and fixing sipTesterId');
            return {
              ...tester,
              sipTesterId: sipTesterId, // Fix the missing sipTesterId
              dialogIds: [...(tester.dialogIds || []), dialogId]
            };
          }
          
          return tester;
        }),
      };
      
      console.log('Result: Updated testers:', newState.testers.filter(t => t.type === 'sip-tester').map(t => ({ 
        id: t.id, 
        sipTesterId: t.sipTesterId, 
        dialogIds: t.dialogIds 
      })));
      
      // Save to localStorage
      localStorage.setItem('tester-instances', JSON.stringify(newState));
      return newState;
    }

    case 'LOAD_FROM_STORAGE': {
      try {
        const stored = localStorage.getItem('tester-instances');
        if (stored) {
          const parsedState = JSON.parse(stored);
          return {
            ...parsedState,
            testers: parsedState.testers.map((t: any) => ({
              ...t,
              createdAt: new Date(t.createdAt),
            })),
          };
        }
      } catch (error) {
        console.error('Error loading tester instances from storage:', error);
      }
      return state;
    }

    default:
      return state;
  }
}

interface TesterContextType {
  state: TesterState;
  addTester: (
    type: TesterInstance['type'], 
    details: any, 
    additionalData?: {
      interactionKey?: string;
      requestId?: string;
      rtpTesterId?: string;
      sipTesterId?: string;
      mediaTesterId?: string;
      senderId?: string;
      operation?: string;
    }
  ) => void;
  removeTester: (id: string) => void;
  removeTesterByTesterId: (type: TesterInstance['type'], testerId: string) => void;
  addDialogId: (sipTesterId: string, dialogId: string) => void;
  getTestersByType: (type: TesterInstance['type']) => TesterInstance[];
}

const TesterContext = createContext<TesterContextType | undefined>(undefined);

interface TesterProviderProps {
  children: ReactNode;
}

export const TesterProvider: React.FC<TesterProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(testerReducer, initialState);

  React.useEffect(() => {
    dispatch({ type: 'LOAD_FROM_STORAGE' });
  }, []);

  const addTester = (
    type: TesterInstance['type'], 
    details: any, 
    additionalData?: {
      interactionKey?: string;
      requestId?: string;
      rtpTesterId?: string;
      sipTesterId?: string;
      mediaTesterId?: string;
      senderId?: string;
      operation?: string;
    }
  ) => {
    console.log('TesterContext - Adding tester:', { type, details, additionalData });
    dispatch({ 
      type: 'ADD_TESTER', 
      payload: { 
        type, 
        details, 
        ...additionalData 
      } 
    });
    console.log('TesterContext - Tester added successfully');
  };

  const removeTester = (id: string) => {
    dispatch({ type: 'REMOVE_TESTER', payload: { id } });
  };

  const removeTesterByTesterId = (type: TesterInstance['type'], testerId: string) => {
    // Find testers by their specific tester ID field
    const testersToRemove = state.testers.filter(tester => {
      if (tester.type === type) {
        switch (type) {
          case 'sip-tester':
            return tester.sipTesterId === testerId;
          case 'rtp-tester':
            return tester.rtpTesterId === testerId;
          case 'media-tester':
            return tester.mediaTesterId === testerId;
          default:
            return false;
        }
      }
      return false;
    });

    // Remove all matching testers
    testersToRemove.forEach(tester => {
      dispatch({ type: 'REMOVE_TESTER', payload: { id: tester.id } });
    });
  };

  const getTestersByType = (type: TesterInstance['type']) => {
    return state.testers.filter(t => t.type === type);
  };

  const addDialogId = (sipTesterId: string, dialogId: string) => {
    dispatch({ type: 'ADD_DIALOG_ID', payload: { sipTesterId, dialogId } });
  };

  const value = {
    state,
    addTester,
    removeTester,
    removeTesterByTesterId,
    addDialogId,
    getTestersByType,
  };

  return (
    <TesterContext.Provider value={value}>
      {children}
    </TesterContext.Provider>
  );
};

export const useTester = () => {
  const context = useContext(TesterContext);
  if (context === undefined) {
    throw new Error('useTester must be used within a TesterProvider');
  }
  return context;
};
