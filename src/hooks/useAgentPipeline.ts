import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AgentState, TrustReceipt, InferenceResult, MinerResponse } from '@/types';
import { toast } from 'sonner';

export interface AgentPipelineResult {
  state: AgentState;
  miners: MinerResponse[];
  receipt: TrustReceipt | null;
  error: string | null;
  isDemoMode: boolean;
}

export function useAgentPipeline() {
  const [state, setState] = useState<AgentState>('idle');
  const [miners, setMiners] = useState<MinerResponse[]>([]);
  const [receipt, setReceipt] = useState<TrustReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const reset = useCallback(() => {
    setState('idle');
    setMiners([]);
    setReceipt(null);
    setError(null);
    setIsDemoMode(false);
  }, []);

  const runInference = useCallback(async (prompt: string, taskName: string = 'inference-task') => {
    reset();
    setError(null);

    try {
      // Step 1: Connecting
      setState('connecting');
      await delay(400);

      // Step 2: Inferencing
      setState('inferencing');
      
      const { data, error: fnError } = await supabase.functions.invoke('cortensor-inference', {
        body: { prompt, task: taskName },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Inference failed');
      }

      const result = data as InferenceResult;
      setMiners(result.miners);
      setIsDemoMode(result.is_demo_mode);

      if (result.is_demo_mode) {
        toast.info('Running in demo mode - Connect Cortensor Router for live inference', {
          duration: 4000,
        });
      }

      // Step 3: Validating
      setState('validating');
      await delay(600);

      // Step 4: Decision
      if (result.decision === 'approved') {
        setState('approved');
        await delay(500);
        setState('executed');
        toast.success('Inference approved and executed!');
      } else {
        setState('rejected');
        toast.error(`Rejected: ${result.rejection_reason}`);
      }

      // Generate receipt
      const trustReceipt: TrustReceipt = {
        receipt_id: crypto.randomUUID(),
        task: taskName,
        input: prompt,
        miners: result.miners.map(m => m.miner_id),
        outputs: result.miners.map(m => m.response),
        agreement_score: result.agreement_score,
        validator_score: result.validator_score,
        final_output: result.final_output,
        decision: result.decision,
        timestamp: new Date().toISOString(),
      };

      setReceipt(trustReceipt);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      setState('idle');
      toast.error(`Pipeline failed: ${message}`);
    }
  }, [reset]);

  return {
    state,
    miners,
    receipt,
    error,
    isDemoMode,
    runInference,
    reset,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
