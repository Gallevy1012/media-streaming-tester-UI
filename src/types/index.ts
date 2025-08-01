// Authentication Types
export interface User {
  username: string;
  environment: Environment;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  environment: Environment;
  expirationTime: Date | null;
  username?: string;
  user?: User | null;
  loginResponse?: AuthResponse | null;
  error?: string | null;
}

export type Environment = 'Dev' | 'test' | 'perf-wcx';

export interface LoginCredentials {
  email: string;
  password: string;
  environment: Environment;
}

export interface AuthResponse {
  access_token?: string; // Keep for backward compatibility
  token: string; // The actual token field from the API
  token_type?: string;
  expires_in?: number; // Keep for backward compatibility
  tokenExpirationTimeSec: number; // The actual expiration field from the API
  refreshToken: string;
  refreshTokenExpirationTimeSec: number;
  user: {
    id: string;
    username: string;
    email: string;
    roles?: string[];
  };
}

// Tester Types
export type TesterType = 'sip-tester' | 'rtp-tester' | 'media-tester';

export type TesterRole =
  | 'AVAYA_SBC'
  | 'CISCO_SBC'
  | 'TEAMS_SBC'
  | 'RECORDER'
  | 'SUPERVISOR'
  | 'RTIG'
  | 'ESFU'
  | 'SIP_LB'
  | 'VRSP';

export type TransportProtocol = 'UDP' | 'TCP';

export type MediaSourceType = 'SIP' | 'DMCC';

export type MediaCodec = 'PCMU' | 'PCMA' | 'G729' | 'DEFAULT';

export type ChannelType = 'MONO' | 'STEREO';

export type StreamType = 'MONO' | 'STEREO';

// SIP Tester Types
export interface CommunicationAddress {
  ip: string;
  port: number;
  transportProtocol: TransportProtocol;
  alias?: string;  // Made optional to match Java (no @NotNull)
}

export interface SipTesterConfig {
  testerKeyName: string;  // Made required
  testerRole: TesterRole;
  listeningAddress: CommunicationAddress;
  mediaSourceType?: MediaSourceType;
  unsupportedCodecs?: MediaCodec[];
  saveDialog?: boolean;
  isStateless?: boolean;
  imrRequesterId?: number;
}

export interface CreateSipTesterRequest {
  requestId: string;
  config: SipTesterConfig;
  useDefaultHandlers?: boolean;
  customSessionExpiration?: number;
}

// New interface for remove SIP tester
export interface RemoveSipTesterRequest {
  requestId: string;
  sipTesterId: string;  // UUID as string
}

export interface ChannelConfiguration {
  mediaType: string;
  port: number;
  codec: MediaCodec;
  payloadType: number;
}

export interface SdpConfiguration {
  channelType: ChannelType;
  channels: ChannelConfiguration[];
}

// Updated to match Java SendInviteRequest
export interface Connection {
  networkType: 'IN'; // IN = Internet
  addressType: 'IP4' | 'IP6'; // IP4 or IP6
  ip: string;
}

export interface Timing {
  startTime: number;
  stopTime: number;
}

export interface Origin {
  userName: string;
  sessionId: string;
  sessionVersion: number;
  networkType: 'IN';
  addressType: 'IP4' | 'IP6';
  ip: string;
}

export interface Channel {
  mediaType: string;
  port: number;
  transportProtocol: string;
  connectionAddress?: string;
  attributes?: Record<string, string>;
  codecs?: number[];
}

export interface SdpDto {
  sessionVersion: number;
  origin: Origin;
  sessionName: string;
  sessionInformation?: string;
  connection: Connection;
  timing: Timing;
  channels: Channel[];
}

export interface SendInviteRequest {
  testerId: string; // UUID as string
  destinationAddress: CommunicationAddress;
  customHeaders?: Record<string, string>; // optional custom SIP headers
  sdp: SdpDto;
}

export interface SendByeRequest {
  testerId: string; // UUID as string
  dialogId: string;
}

export interface SendCancelRequest {
  testerId: string;
  callId: string;
}

export interface QueryIncomingRequestsParams {
  testerId: string;
  method?: string;
  callId?: string;
  fromTime?: string;
  toTime?: string;
}

export interface GetDialogDetailsParams {
  testerId: string;  // UUID as string (renamed from testerId)
  dialogId: string;  // Made required (removed ?)
}

// SIP Query Types
export type SipMethod = 'INVITE' | 'ACK' | 'BYE' | 'CANCEL' | 'OPTIONS' | 'REGISTER' | 'PRACK' | 'SUBSCRIBE' | 'NOTIFY' | 'PUBLISH' | 'INFO' | 'REFER' | 'MESSAGE' | 'UPDATE';

export type SipStatusCode = '100' | '180' | '181' | '182' | '183' | '199' | '200' | '202' | '300' | '301' | '302' | '305' | '380' | '400' | '401' | '402' | '403' | '404' | '405' | '406' | '407' | '408' | '410' | '413' | '414' | '415' | '416' | '420' | '421' | '423' | '480' | '481' | '482' | '483' | '484' | '485' | '486' | '487' | '488' | '491' | '493' | '500' | '501' | '502' | '503' | '504' | '505' | '513' | '600' | '603' | '604' | '606';

export type ChannelState = 'SEND' | 'RECEIVE' | 'SEND_AND_RECEIVE' | 'INACTIVE';

export interface SipComparator {
  expected_CallId?: string;
  expected_InteractionKey?: string;
  expected_SipMethod?: SipMethod;
  expected_SipStatusCode?: SipStatusCode;
  expected_FromDisplayName?: string;
  expected_ToDisplayName?: string;
  expected_ContactUri?: string;
  expected_CSeqMethod?: string;
  expected_CSeqNumber?: number;
  expected_MediaSourceType?: MediaSourceType;
  expected_Content?: Record<string, string>;
  expected_SdpDto?: any;
  expected_SdpChannels?: any[];
  expected_ChannelsStatus?: ChannelState;
  expected_ChannelsConnection?: any[];
  expected_Origin?: any;
  expected_Connection?: any;
  expected_RequiredHeader?: { first: string; second: string };
  expected_SessionExpiresHeader?: any;
  expected_AllowHeader?: { first: string; second: string };
  expected_ReasonHeader?: any;
  expected_ToTag?: string;
  expected_NoToTag?: boolean;
  expected_FromTag?: string;
  expected_NoFromTag?: boolean;
  expected_IsImrHeader?: boolean;
  expected_ImrTypeHeader?: string;
  expected_ImrIdHeader?: string;
  expected_ContactIdHeader?: string;
  expected_RequestUri?: string;
  actual_CallId?: string;
}

export interface SipQueryRequest {
  testerId: string; // UUID as string
  dialogId: string;
  sipComparator: SipComparator;
  timeout: number;
}

export interface SipQueryListRequest {
  sipQueryRequests: SipQueryRequest[];
}

// RTP Tester Types
export interface OpenReceivingPointsRequest {
  ssrcs: number[];
  packetCount: number;
  interactionKey: string;
}

export interface TestStreamConfiguration {
  ssrc: number;
  streamSize: string; // Duration format (ISO or seconds as string)
  sourcePort: number;
  targetIp: string;
  targetPort: number;
}

export interface StartStreamRequest {
  testStreamConfigurations: TestStreamConfiguration[];
  streamType: StreamType;
  rtpCodec: MediaCodec;
  interactionKey: string;
  intervalInMs?: number;
}

export interface RemoveRtpTesterRequest {
  rtpTesterId: string; // UUID as string
  interactionKey: string;
}

export interface TestUpdateSenderCommunicationConfiguration {
  ssrc: number;
  sourcePort: number;
  targetIp: string;
  targetPort: number;
}

export interface UpdateSenderSendDestinationRequest {
  testCommunicationConfigurations: TestUpdateSenderCommunicationConfiguration[];
  rtpTesterId: string; // UUID as string
  senderId: string; // UUID as string
  streamType: StreamType;
  interactionKey: string;
}

export type RtpTesterQuery =
  | 'IS_SAME_SSRC'
  | 'NUM_OF_PACKETS'
  | 'SEQUENCE_NUMBER_ORDER'
  | 'TIMESTAMP_ORDER_DELTA'
  | 'PACKET_RECEIVING_STATUS';

export type ReceiverStatus = 'STOPPED' | 'RECEIVING';

export interface QueryRequest {
  rtpTesterId: string;
  ssrc: number;
  rtpQuery: RtpTesterQuery;
  expectedValue?: number;
  receiverStatus?: ReceiverStatus;
  acceptedMismatchPercentage?: number;
  timeoutMs: number;
  interactionKey: string;
}

export interface QueryResponse {
  message: boolean;
  actualValue?: number;
}

export interface StreamedPacketsCountRequest {
  rtpTesterId: string;
  ssrcs: number[];
  interactionKey: string;
}

export interface StreamedPacketsCountResponse {
  packetsCount: number;
}

// Media Tester Types
export interface MediaTesterConfig {
  sipTesterConfig: SipTesterConfig;
  rtpSendingPorts: number[];
  rtpReceivingPorts: number[];
  streamsDuration: string; // Duration format
  channelSsrcs: number[];
  sipSessionExpiration?: number;
  isGlobalIpReceiver?: boolean;
  isLocalRun?: boolean;
}

export interface CreateMediaTesterRequest {
  requestId: string;
  config: MediaTesterConfig;
}

export interface RemoveMediaTesterRequest {
  requestId: string;
  mediaTesterId: string; // UUID as string
}

export interface SendMediaInviteRequest {
  testerId: string;
  destinationAddress: CommunicationAddress;
  customHeaders?: Record<string, string>;
  sdp: SdpDto;
}

// Function Types
export interface TesterFunction {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: 1 | 2 | 3;
  icon: string;
  testerType: TesterType;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
}

// Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  status: number;
  statusText: string;
  timestamp: Date;
  error?: string;
  headers?: Record<string, string>;
}

export interface CreateTesterResponse {
  testerId: string;
  ip: string;
  port: number;
  allocatedPorts?: number[];
}

export interface SendMessageResponse {
  messageId: string;
  callId?: string;
  sent: boolean;
  timestamp: string;
}

export interface IncomingRequest {
  messageId: string;
  method: string;
  callId: string;
  fromUri: string;
  toUri: string;
  timestamp: string;
  headers: Record<string, string>;
  body?: string;
  mediaInfo?: {
    channels: ChannelConfiguration[];
  };
}

export interface DialogDetails {
  callId: string;
  dialogState: string;
  localUri: string;
  remoteUri: string;
  startTime: string;
  endTime?: string;
  messageSequence: Array<{
    direction: 'INCOMING' | 'OUTGOING';
    method?: string;
    statusCode?: number;
    reasonPhrase?: string;
    timestamp: string;
  }>;
  mediaDetails?: {
    channels: Array<{
      localPort: number;
      remotePort: number;
      codec: string;
      rtpStatistics?: {
        packetsSent: number;
        packetsReceived: number;
        packetsLost: number;
      };
    }>;
  };
}

export interface RtpStatistics {
  packetsSent: number;
  packetsReceived: number;
  bytesSent: number;
  bytesReceived: number;
  packetsLost: number;
  jitter: number;
  latencyMs: number;
}

// Test Response Types
export interface TestMetric {
  name: string;
  description: string;
  value: string | number;
  unit?: string;
  status: string;
  threshold?: string;
}

export interface TestLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface TestResponse {
  testId: string;
  success: boolean;
  message?: string;
  timestamp: string;
  duration?: number;
  metrics?: TestMetric[];
  logs?: TestLog[];
  data?: Record<string, unknown>;
}

// Wizard State Types
export interface WizardState {
  currentStep: number;
  testerType: TesterType | null;
  selectedFunction: TesterFunction | null;
  formData: Record<string, unknown>;
}

// Form State Types
export interface FormFieldError {
  message: string;
  type: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, FormFieldError>;
}

// UI State Types
export interface ResponseViewState {
  response: ApiResponse | null;
  isLoading: boolean;
  error: string | null;
}

// Utility Types
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object
    ? RecursivePartial<T[P]>
    : T[P];
};
