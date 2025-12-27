// Agent Pipeline States
export type AgentState = 'idle' | 'inferencing' | 'validating' | 'approved' | 'rejected' | 'executed';

// Miner response from Cortensor
export interface MinerResponse {
  miner_id: string;
  response: string;
  latency: number; // ms
}

// Validation result for a single miner
export interface MinerValidation {
  miner_id: string;
  score: number; // 0-100
  isOutlier: boolean;
}

// Complete inference result from edge function
export interface InferenceResult {
  miners: MinerResponse[];
  agreement_score: number; // percentage 0-100
  validator_score: number; // 0-100
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

// API response types
export interface CortensorStatusResponse {
  status: 'online' | 'offline';
  miners_available: number;
}

export interface CortensorCompletionRequest {
  prompt: string;
  miner_count?: number;
}

// Demo mode configuration
export const DEMO_PROMPTS = [
  "What is the capital of France?",
  "Calculate 15 * 23",
  "Explain quantum computing in one sentence",
  "What is the boiling point of water in Celsius?",
];

// Thresholds for validation
export const VALIDATION_THRESHOLDS = {
  MIN_AGREEMENT: 60, // percentage
  MIN_TRUST_SCORE: 70, // 0-100
} as const;
