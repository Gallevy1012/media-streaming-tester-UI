import { testerHttpClient } from './testerHttpClient';
import type {
  CreateMediaTesterRequest,
  SendMediaInviteRequest,
  QueryIncomingRequestsParams,
  GetDialogDetailsParams,
} from '../types';

class MediaTesterService {
  async createMediaTester(request: CreateMediaTesterRequest): Promise<any> {
    return testerHttpClient.post('/media-tester/create', request);
  }

  async removeMediaTester(mediaTesterId: string): Promise<any> {
    return testerHttpClient.delete(`/media-tester/remove/${mediaTesterId}`);
  }

  async sendMediaInvite(request: SendMediaInviteRequest): Promise<any> {
    return testerHttpClient.post('/media-tester/send-invite', request);
  }

  async queryIncomingRequests(params: QueryIncomingRequestsParams): Promise<any> {
    const queryParams = new URLSearchParams();
    
    if (params.method) queryParams.append('method', params.method);
    if (params.callId) queryParams.append('callId', params.callId);
    if (params.fromTime) queryParams.append('fromTime', params.fromTime);
    if (params.toTime) queryParams.append('toTime', params.toTime);

    const url = `/media-tester/gotIncomingRequests/${params.testerId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return testerHttpClient.get(url);
  }

  async getDialogDetails(params: GetDialogDetailsParams): Promise<any> {
    const url = `/media-tester/getDialogDetails/${params.testerId}/${params.dialogId}`;
    return testerHttpClient.get(url);
  }

  async getMediaStatistics(mediaTesterId: string, callId?: string): Promise<any> {
    const url = `/media-tester/getMediaStatistics/${mediaTesterId}${callId ? `/${callId}` : ''}`;
    return testerHttpClient.get(url);
  }
}

export const mediaTesterService = new MediaTesterService();
