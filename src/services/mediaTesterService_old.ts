import { httpClient } from './httpClientFile';
import type {
  CreateMediaTesterRequest,
  SendMediaInviteRequest,
  QueryIncomingRequestsParams,
  GetDialogDetailsParams,
  CreateTesterResponse,
  SendMessageResponse,
  IncomingRequest,
  DialogDetails,
  ApiResponse,
} from '../types';

class MediaTesterService {
  private readonly basePath = '/media-tester';

  async createMediaTester(request: CreateMediaTesterRequest): Promise<ApiResponse<CreateTesterResponse & { allocatedRtpPorts: number[] }>> {
    return httpClient.post<CreateTesterResponse & { allocatedRtpPorts: number[] }>(`${this.basePath}/create`, request);
  }

  async removeMediaTester(mediaTesterId: string): Promise<ApiResponse<void>> {
    return httpClient.delete<void>(`${this.basePath}/remove/${mediaTesterId}`);
  }

  async sendMediaInvite(request: SendMediaInviteRequest): Promise<ApiResponse<SendMessageResponse & { rtpSessionsCreated: number }>> {
    return httpClient.post<SendMessageResponse & { rtpSessionsCreated: number }>(`${this.basePath}/send-invite`, request);
  }

  async queryIncomingRequests(params: QueryIncomingRequestsParams): Promise<ApiResponse<{ requests: (IncomingRequest & { rtpSessionsActive: number })[]; totalCount: number }>> {
    const queryParams = new URLSearchParams();
    
    if (params.method) queryParams.append('method', params.method);
    if (params.callId) queryParams.append('callId', params.callId);
    if (params.fromTime) queryParams.append('fromTime', params.fromTime);
    if (params.toTime) queryParams.append('toTime', params.toTime);

    const url = `${this.basePath}/gotIncomingRequests/${params.testerId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return httpClient.get<{ requests: (IncomingRequest & { rtpSessionsActive: number })[]; totalCount: number }>(url);
  }

  async getDialogDetails(params: GetDialogDetailsParams): Promise<ApiResponse<DialogDetails>> {
    const url = `${this.basePath}/getDialogDetails/${params.testerId}/${params.dialogId}`;
    
    return httpClient.get<DialogDetails>(url);
  }
}

export const mediaTesterService = new MediaTesterService();
