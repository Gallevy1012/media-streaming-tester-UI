import { testerHttpClient } from './testerHttpClient';
import type {
  CreateSipTesterRequest,
  SendInviteRequest,
  SendByeRequest,
  SendCancelRequest,
  QueryIncomingRequestsParams,
  GetDialogDetailsParams,
} from '../types';

class SipTesterService {
  async createSipTester(request: CreateSipTesterRequest): Promise<any> {
    return testerHttpClient.post('/sip-tester/create', request);
  }

  async removeSipTester(testerId: string): Promise<any> {
    return testerHttpClient.delete(`/sip-tester/remove/${testerId}`);
  }

  async sendInvite(request: SendInviteRequest): Promise<any> {
    return testerHttpClient.post('/sip-tester/send-invite', request);
  }

  async sendBye(request: SendByeRequest): Promise<any> {
    return testerHttpClient.post('/sip-tester/send-bye', request);
  }

  async sendCancel(request: SendCancelRequest): Promise<any> {
    return testerHttpClient.post('/sip-tester/send-cancel', request);
  }

  async queryIncomingRequests(params: QueryIncomingRequestsParams): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params.method) queryParams.append('method', params.method);
    if (params.callId) queryParams.append('callId', params.callId);
    if (params.fromTime) queryParams.append('fromTime', params.fromTime);
    if (params.toTime) queryParams.append('toTime', params.toTime);

    const url = `/sip-tester/gotIncomingRequests/${params.testerId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return testerHttpClient.get(url);
  }

  async getDialogDetails(params: GetDialogDetailsParams): Promise<any> {
    const url = `/sip-tester/dialog-details/${params.testerId}/${params.dialogId}`;
    return testerHttpClient.get(url);
  }
}

export const sipTesterService = new SipTesterService();
