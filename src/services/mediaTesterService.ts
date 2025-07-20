import { testerHttpClient } from './testerHttpClient';
import type {
  CreateMediaTesterRequest,
  SendMediaInviteRequest,
  QueryRequest,
  SipQueryListRequest,
  RemoveMediaTesterRequest,
  GetDialogDetailsParams,
  SendByeRequest,
} from '../types';

// Import the tester context to add/remove testers from the list
let addTesterFunction: ((type: 'media-tester', details: any, additionalData?: any) => void) | null = null;
let removeTesterFunction: ((type: 'media-tester', testerId: string) => void) | null = null;
let addDialogIdFunction: ((type: 'media-tester', testerId: string, dialogId: string) => void) | null = null;

// Function to set the addTester function from the context
export const setMediaTesterAddFunction = (addFn: (type: 'media-tester', details: any, additionalData?: any) => void) => {
  addTesterFunction = addFn;
};

// Function to set the removeTester function from the context
export const setMediaTesterRemoveFunction = (removeFn: (type: 'media-tester', testerId: string) => void) => {
  removeTesterFunction = removeFn;
};

// Function to set the addDialogId function from the context
export const setMediaTesterAddDialogIdFunction = (addDialogIdFn: (type: 'media-tester', testerId: string, dialogId: string) => void) => {
  addDialogIdFunction = addDialogIdFn;
};

class MediaTesterService {
  async createMediaTester(request: CreateMediaTesterRequest): Promise<any> {
    try {
      const response = await testerHttpClient.post('/media-tester/create', request);

      // Add tester to list automatically only on success
      if (response && addTesterFunction) {
        const mediaTesterId = (response as any).mediaTesterId || (response as any).id || `media-${Date.now()}`;
        addTesterFunction('media-tester', response, {
          requestId: request.requestId || 'default-request',
          mediaTesterId: mediaTesterId,
          operation: 'createMediaTester'
        });
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async removeMediaTester(request: RemoveMediaTesterRequest): Promise<any> {
    try {
      const response = await testerHttpClient.post('/media-tester/remove', request);

      // Remove tester from list automatically only on success
      if (response && removeTesterFunction && request.mediaTesterId) {
        removeTesterFunction('media-tester', request.mediaTesterId);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async sendInvite(request: SendMediaInviteRequest): Promise<any> {
    try {
      const response = await testerHttpClient.post('/media-tester/send-invite', request);

      // Add dialog ID to tester if response contains it
      if (response && addDialogIdFunction && request.testerId) {
        const dialogId = (response as any).dialogId;
        if (dialogId) {
          addDialogIdFunction('media-tester', request.testerId, dialogId);
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async sendBye(request: SendByeRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/media-tester/send-bye', request);
    } catch (error) {
      throw error;
    }
  }

  async gotIncomingRequests(request: SipQueryListRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/media-tester/gotIncomingRequests', request);
    } catch (error) {
      throw error;
    }
  }

  async gotIncomingResponses(request: SipQueryListRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/media-tester/gotIncomingResponses', request);
    } catch (error) {
      throw error;
    }
  }

  async sentOutgoingRequests(request: SipQueryListRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/media-tester/sentOutgoingRequests', request);
    } catch (error) {
      throw error;
    }
  }

  async sentOutgoingResponses(request: SipQueryListRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/media-tester/sentOutgoingResponses', request);
    } catch (error) {
      throw error;
    }
  }

  async resolveReceiverQuery(request: QueryRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/media-tester/resolveReceiverQuery', request);
    } catch (error) {
      throw error;
    }
  }

  async resolveSenderQuery(request: QueryRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/media-tester/resolveSenderQuery', request);
    } catch (error) {
      throw error;
    }
  }

  async getDialogDetails(params: GetDialogDetailsParams): Promise<any> {
    try {
      return await testerHttpClient.post('/media-tester/getDialogDetails', {
        testerId: params.testerId,
        dialogId: params.dialogId,
      });
    } catch (error) {
      throw error;
    }
  }
}

export const mediaTesterService = new MediaTesterService();
