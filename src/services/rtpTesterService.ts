import { testerHttpClient } from './testerHttpClient';
import type {
  OpenReceivingPointsRequest,
  StartStreamRequest,
  StreamedPacketsCountRequest,
  QueryRequest,
  UpdateSenderSendDestinationRequest,
  RemoveRtpTesterRequest,
} from '../types';

// Import the tester context to add/remove testers from the list
let addTesterFunction: ((type: 'rtp-tester', details: any, additionalData?: any) => void) | null = null;
let removeTesterFunction: ((type: 'rtp-tester', testerId: string) => void) | null = null;

// Function to set the addTester function from the context
export const setRtpTesterAddFunction = (addFn: (type: 'rtp-tester', details: any, additionalData?: any) => void) => {
  addTesterFunction = addFn;
};

// Function to set the removeTester function from the context
export const setRtpTesterRemoveFunction = (removeFn: (type: 'rtp-tester', testerId: string) => void) => {
  removeTesterFunction = removeFn;
};

// Function to check if addTesterFunction is available
export const isAddTesterFunctionAvailable = () => {
  return addTesterFunction !== null && addTesterFunction !== undefined;
};

class RtpTesterService {
  async openReceivingPoints(request: OpenReceivingPointsRequest): Promise<any> {
    try {
      const response = await testerHttpClient.post('/rtp-tester/openReceivingPoints', request);
      
      // Add tester to list automatically only on success
      if (response && addTesterFunction) {
        const rtpTesterId = (response as any).rtpTesterId || (response as any).id || `rtp-open-${Date.now()}`;
        addTesterFunction('rtp-tester', response, {
          interactionKey: request.interactionKey || 'default-key',
          rtpTesterId: rtpTesterId,
          operation: 'openReceivingPoints'
        });
      }
      
      return response;
    } catch (error) {
      // Don't save tester on error, just throw the error for UI to display
      throw error;
    }
  }

  async startStream(request: StartStreamRequest): Promise<any> {
    try {
      const response = await testerHttpClient.post('/rtp-tester/startStream', request);
      
      // Add tester to list automatically only on success
      if (response && addTesterFunction) {
        const rtpTesterId = (response as any).rtpTesterId || (response as any).id || `rtp-stream-${Date.now()}`;
        const senderId = (response as any).senderId;
          
        const additionalData = {
          interactionKey: request.interactionKey || 'default-key',
          rtpTesterId: rtpTesterId,
          senderId: senderId,
          operation: 'startStream'
        };
          
        addTesterFunction('rtp-tester', response, additionalData);
      }
      
      return response;
    } catch (error) {
      // Don't save tester on error, just throw the error for UI to display
      throw error;
    }
  }

  async removeRtpTester(request: RemoveRtpTesterRequest): Promise<any> {
    try {
      const response = await testerHttpClient.post('/rtp-tester/removeRtpTester', request);
      
      // Remove tester from list automatically only on success
      if (response && removeTesterFunction) {
        removeTesterFunction('rtp-tester', request.rtpTesterId);
      }
      
      return response;
    } catch (error) {
      // Don't remove tester on error, just throw the error for UI to display
      throw error;
    }
  }

  async updateSenderSendDestination(request: UpdateSenderSendDestinationRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/rtp-tester/updateSenderSendDestination', request);
    } catch (error) {
      throw error;
    }
  }

  async resolveReceiverQuery(request: QueryRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/rtp-tester/resolveReceiverQuery', request);
    } catch (error) {
      throw error;
    }
  }

  async resolveSenderQuery(request: QueryRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/rtp-tester/resolveSenderQuery', request);
    } catch (error) {
      throw error;
    }
  }

  async getStreamedPacketsCount(request: StreamedPacketsCountRequest): Promise<any> {
    try {
      return await testerHttpClient.post('/rtp-tester/streamedPacketsCount', request);
    } catch (error) {
      throw error;
    }
  }
}

export const rtpTesterService = new RtpTesterService();
