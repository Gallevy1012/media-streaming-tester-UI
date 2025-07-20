import { httpClient } from './httpClientFile';
import type {
  OpenReceivingPointsRequest,
  StartStreamRequest,
  RemoveRtpTesterRequest,
  UpdateSenderSendDestinationRequest,
  QueryRequest,
  QueryResponse,
  StreamedPacketsCountRequest,
  StreamedPacketsCountResponse,
  CreateTesterResponse,
  RtpStatistics,
  ApiResponse,
} from '../types';

class RtpTesterService {
  private readonly basePath = '/rtp-tester';

  async openReceivingPoints(request: OpenReceivingPointsRequest): Promise<ApiResponse<CreateTesterResponse>> {
    return httpClient.post<CreateTesterResponse>(`${this.basePath}/openReceivingPoints`, request);
  }

  async startStream(request: StartStreamRequest): Promise<ApiResponse<CreateTesterResponse>> {
    return httpClient.post<CreateTesterResponse>(`${this.basePath}/startStream`, request);
  }

  async removeRtpTester(request: RemoveRtpTesterRequest): Promise<ApiResponse<any>> {
    return httpClient.post<any>(`${this.basePath}/remove-rtp-tester`, request);
  }

  async updateSenderSendDestination(request: UpdateSenderSendDestinationRequest): Promise<ApiResponse<any>> {
    return httpClient.post<any>(`${this.basePath}/update-sender-send-destination`, request);
  }

  async resolveReceiverQuery(request: QueryRequest): Promise<ApiResponse<QueryResponse>> {
    return httpClient.post<QueryResponse>(`${this.basePath}/resolve-receiver-query`, request);
  }

  async resolveSenderQuery(request: QueryRequest): Promise<ApiResponse<QueryResponse>> {
    return httpClient.post<QueryResponse>(`${this.basePath}/resolve-sender-query`, request);
  }

  async getStreamedPacketsCount(request: StreamedPacketsCountRequest): Promise<ApiResponse<StreamedPacketsCountResponse>> {
    return httpClient.post<StreamedPacketsCountResponse>(`${this.basePath}/stream-packets-count`, request);
  }

  // Legacy methods
  async startRtpStream(rtpTesterId: string, request: { durationMs: number; audioFile?: string }): Promise<ApiResponse<void>> {
    return httpClient.post<void>(`${this.basePath}/start-stream/${rtpTesterId}`, request);
  }

  async stopRtpStream(rtpTesterId: string): Promise<ApiResponse<void>> {
    return httpClient.post<void>(`${this.basePath}/stop-stream/${rtpTesterId}`);
  }

  async getRtpStatistics(rtpTesterId: string): Promise<ApiResponse<RtpStatistics>> {
    return httpClient.get<RtpStatistics>(`${this.basePath}/statistics/${rtpTesterId}`);
  }
}

export const rtpTesterService = new RtpTesterService();
