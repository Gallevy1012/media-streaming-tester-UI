import { testerHttpClient } from './testerHttpClient';
import type {
  OpenReceivingPointsRequest,
  StartStreamRequest,
  StreamedPacketsCountRequest,
  QueryRequest,
} from '../types';

class RtpTesterService {
  async openReceivingPoints(request: OpenReceivingPointsRequest): Promise<any> {
    return testerHttpClient.post('/rtp-tester/openReceivingPoints', request);
  }

  async startStream(request: StartStreamRequest): Promise<any> {
    return testerHttpClient.post('/rtp-tester/startStream', request);
  }

  async removeRtpTester(request: { rtpTesterId: string; interactionKey: string }): Promise<any> {
    return testerHttpClient.post('/rtp-tester/removeRtpTester', request);
  }

  async updateSenderSendDestination(request: any): Promise<any> {
    return testerHttpClient.post('/rtp-tester/updateSenderSendDestination', request);
  }

  async resolveReceiverQuery(request: QueryRequest): Promise<any> {
    return testerHttpClient.post('/rtp-tester/resolveReceiverQuery', request);
  }

  async resolveSenderQuery(request: QueryRequest): Promise<any> {
    return testerHttpClient.post('/rtp-tester/resolveSenderQuery', request);
  }

  async getStreamedPacketsCount(request: StreamedPacketsCountRequest): Promise<any> {
    return testerHttpClient.post('/rtp-tester/streamedPacketsCount', request);
  }
}

export const rtpTesterService = new RtpTesterService();
