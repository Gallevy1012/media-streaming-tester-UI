import { testerHttpClient } from './testerHttpClient';
import type {
  CreateSipTesterRequest,
  RemoveSipTesterRequest,
  SendInviteRequest,
  SendByeRequest,
  SendCancelRequest,
  QueryIncomingRequestsParams,
  GetDialogDetailsParams,
  SipQueryListRequest,
} from '../types';

// Import the tester context to add/remove testers from the list
let addTesterFunction: ((type: 'sip-tester', details: any, additionalData?: any) => void) | null = null;
let removeTesterFunction: ((type: 'sip-tester', testerId: string) => void) | null = null;
let addDialogIdFunction: ((sipTesterId: string, dialogId: string) => void) | null = null;

// Function to set the addTester function from the context
export const setSipTesterAddFunction = (addFn: (type: 'sip-tester', details: any, additionalData?: any) => void) => {
  addTesterFunction = addFn;
};

// Function to set the removeTester function from the context
export const setSipTesterRemoveFunction = (removeFn: (type: 'sip-tester', testerId: string) => void) => {
  removeTesterFunction = removeFn;
};

// Function to set the addDialogId function from the context
export const setSipTesterAddDialogIdFunction = (addDialogIdFn: (sipTesterId: string, dialogId: string) => void) => {
  addDialogIdFunction = addDialogIdFn;
};

class SipTesterService {
  async createSipTester(request: CreateSipTesterRequest): Promise<any> {
    try {
      const response = await testerHttpClient.post('/sip-tester/create', request);

      // Add tester to list automatically only on success
      if (response && addTesterFunction) {
        const sipTesterId = (response as any).sipTesterId || (response as any).testerId || (response as any).id || `sip-${Date.now()}`;
        // Use the requestId provided by the user in the request
        const requestId = request.requestId || `req-sip-${Date.now()}`;
        const alias = (response as any).alias;
        addTesterFunction('sip-tester', response, {
          sipTesterId: sipTesterId,
          requestId: requestId,
          alias : alias
        });
      }

      return response;
    } catch (error) {
      // Don't save tester on error, just throw the error for UI to display
      throw error;
    }
  }

  async removeSipTester(request: RemoveSipTesterRequest): Promise<any> {
    try {
      const response = await testerHttpClient.post('/sip-tester/remove', request);

      // Remove tester from list automatically only on success
      if (response && removeTesterFunction) {
        removeTesterFunction('sip-tester', request.sipTesterId);
      }

      return response;
    } catch (error) {
      // Don't remove tester on error, just throw the error for UI to display
      throw error;
    }
  }

  async sendInvite(request: SendInviteRequest): Promise<any> {
    try {
      const response = await testerHttpClient.post('/sip-tester/send-invite', request);

      // Extract dialogId from response and add it to the tester's dialog list
      if (response && (response as any).dialogId && addDialogIdFunction) {
        addDialogIdFunction(request.testerId, (response as any).dialogId);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async sendBye(request: SendByeRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/sip-tester/send-bye', request);
    } catch (error) {
      throw error;
    }
  }

  async sendCancel(request: SendCancelRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/sip-tester/send-cancel', request);
    } catch (error) {
      throw error;
    }
  }

  async queryIncomingRequests(params: QueryIncomingRequestsParams): Promise<any> {
    try {
      const queryParams = new URLSearchParams();

      if (params.method) queryParams.append('method', params.method);
      if (params.callId) queryParams.append('callId', params.callId);
      if (params.fromTime) queryParams.append('fromTime', params.fromTime);
      if (params.toTime) queryParams.append('toTime', params.toTime);

      const url = `/sip-tester/gotIncomingRequests/${params.testerId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      return await testerHttpClient.get(url);
    } catch (error) {
      throw error;
    }
  }

  async getDialogDetails(params: GetDialogDetailsParams): Promise<any> {
    try {
      const url = `/sip-tester/dialog-details`;
      return await testerHttpClient.post(url, params );
    } catch (error) {
      throw error;
    }
  }

  async gotIncomingRequests(request: SipQueryListRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/sip-tester/got-incoming-requests', request);
    } catch (error) {
      throw error;
    }
  }

  async gotIncomingResponses(request: SipQueryListRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/sip-tester/got-incoming-responses', request);
    } catch (error) {
      throw error;
    }
  }

  async sentOutgoingRequests(request: SipQueryListRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/sip-tester/sent-outgoing-requests', request);
    } catch (error) {
      throw error;
    }
  }

  async sentOutgoingResponses(request: SipQueryListRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/sip-tester/sent-outgoing-responses', request);
    } catch (error) {
      throw error;
    }
  }
}

export const sipTesterService = new SipTesterService();
