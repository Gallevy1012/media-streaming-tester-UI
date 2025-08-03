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
let addDialogIdFunction: ((testerId: string, dialogId: string) => void) | null = null;

// Function to set the addTester function from the context
export const setMediaTesterAddFunction = (addFn: (type: 'media-tester', details: any, additionalData?: any) => void) => {
  addTesterFunction = addFn;
};

// Function to set the removeTester function from the context
export const setMediaTesterRemoveFunction = (removeFn: (type: 'media-tester', testerId: string) => void) => {
  removeTesterFunction = removeFn;
};

// Function to set the addDialogId function from the context
export const setMediaTesterAddDialogIdFunction = (addDialogIdFn: (testerId: string, dialogId: string) => void) => {
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
          sipTesterId: mediaTesterId, // Set sipTesterId to mediaTesterId for dialog ID matching
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
      console.log('🎯 Media Tester Service - Sending invite with testerId:', request.testerId);
      const response = await testerHttpClient.post('/media-tester/send-invite', request);

      // Extract dialogId from response and add it to the tester's dialog list
      if (response && (response as any).dialogId && addDialogIdFunction) {
        console.log('🎯 Media Tester Service - Adding dialog ID:', (response as any).dialogId, 'to testerId:', request.testerId);
        addDialogIdFunction(request.testerId, (response as any).dialogId);
      } else {
        console.log('🎯 Media Tester Service - No dialog ID found in response or addDialogIdFunction not available');
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
      return await testerHttpClient.post('/media-tester/got-incoming-requests', request);
    } catch (error) {
      throw error;
    }
  }

  async gotIncomingResponses(request: SipQueryListRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/media-tester/got-incoming-responses', request);
    } catch (error) {
      throw error;
    }
  }

  async sentOutgoingRequests(request: SipQueryListRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/media-tester/sent-outgoing-requests', request);
    } catch (error) {
      throw error;
    }
  }

  async sentOutgoingResponses(request: SipQueryListRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/media-tester/sent-outgoing-responses', request);
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
