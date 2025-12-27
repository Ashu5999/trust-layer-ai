// Agent Pipeline States
export type AgentState = 'idle' | 'connecting' | 'inferencing' | 'validating' | 'approved' | 'rejected' | 'executed';

// Miner response from Cortensor
export interface MinerResponse {
  miner_id: string;
  response: string;
  latency: number;
}

// Validation result for a single miner
export interface MinerValidation {
  miner_id: string;
  score: number;
  isOutlier: boolean;
}

// Complete inference result from edge function
export interface InferenceResult {
  miners: MinerResponse[];
  agreement_score: number;
  validator_score: number;
  final_output: string;
  decision: 'approved' | 'rejected';
  rejection_reason?: string;
  is_demo_mode: boolean;
}

// Trust Receipt - exact schema as specified
export interface TrustReceipt {
  receipt_id: string;
  task: string;
  input: string;
  miners: string[];
  outputs: string[];
  agreement_score: number;
  validator_score: number;
  final_output: string;
  decision: 'approved' | 'rejected';
  timestamp: string;
}

// Cortensor API Types
export interface CortensorConfig {
  router_url: string;
  api_key: string;
  session_id?: number;
  timeout_ms: number;
  retry_attempts: number;
}

export interface CortensorRouterInfo {
  version: string;
  node_id: string;
  status: string;
}

export interface CortensorRouterStatus {
  healthy: boolean;
  connected_miners: number;
  active_sessions: number;
}

export interface CortensorMiner {
  id: string;
  address: string;
  model: string;
  status: 'online' | 'offline' | 'busy';
}

export interface CortensorSession {
  id: number;
  created_at: string;
  status: 'active' | 'completed' | 'failed';
}

export interface CortensorCompletionRequest {
  prompt: string;
  stream?: boolean;
  timeout?: number;
  session_id?: number;
}

export interface CortensorCompletionResponse {
  task_id: number;
  session_id: number;
  response: string;
  miner_id: string;
  latency_ms: number;
}

export interface CortensorError {
  code: 'CONNECTION_FAILED' | 'AUTH_FAILED' | 'TIMEOUT' | 'MINER_UNAVAILABLE' | 'UNKNOWN';
  message: string;
  is_recoverable: boolean;
}

// Demo prompts
export const DEMO_PROMPTS = [
  {
    name: "AI Trust Analysis",
    prompt: "Explain why decentralized AI inference is more trustworthy than centralized AI.\nGive 3 clear reasons and 1 potential limitation.\nKeep the answer under 100 words.",
  },
  {
    name: "Factual Query",
    prompt: "What are the three laws of thermodynamics? Explain each in one sentence.",
  },
  {
    name: "Mathematical Reasoning",
    prompt: "If a train travels 120km in 2 hours, then 180km in 3 hours, what is the average speed?",
  },
];

// Thresholds for validation
export const VALIDATION_THRESHOLDS = {
  MIN_AGREEMENT: 60,
  MIN_TRUST_SCORE: 70,
} as const;
