import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cortensor Router API (update this when you have the actual endpoint)
const CORTENSOR_ROUTER_URL = Deno.env.get("CORTENSOR_ROUTER_URL") || "";

interface MinerResponse {
  miner_id: string;
  response: string;
  latency: number;
}

interface InferenceResult {
  miners: MinerResponse[];
  agreement_score: number;
  validator_score: number;
  final_output: string;
  decision: "approved" | "rejected";
  rejection_reason?: string;
  is_demo_mode: boolean;
}

// Levenshtein distance for string similarity
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateSimilarity(a: string, b: string): number {
  const normalizedA = a.toLowerCase().trim();
  const normalizedB = b.toLowerCase().trim();
  if (normalizedA === normalizedB) return 100;
  if (!normalizedA || !normalizedB) return 0;
  const maxLen = Math.max(normalizedA.length, normalizedB.length);
  const distance = levenshteinDistance(normalizedA, normalizedB);
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

function calculateAgreementScore(responses: string[]): number {
  if (responses.length < 2) return 100;
  let totalSimilarity = 0;
  let pairCount = 0;

  for (let i = 0; i < responses.length; i++) {
    for (let j = i + 1; j < responses.length; j++) {
      totalSimilarity += calculateSimilarity(responses[i], responses[j]);
      pairCount++;
    }
  }
  return pairCount > 0 ? Math.round(totalSimilarity / pairCount) : 100;
}

// Demo mode: Generate simulated miner responses
function generateDemoResponses(prompt: string): MinerResponse[] {
  const baseResponses: Record<string, string[]> = {
    "What is the capital of France?": [
      "The capital of France is Paris.",
      "Paris is the capital city of France.",
      "France's capital is Paris.",
    ],
    "Calculate 15 * 23": [
      "15 * 23 = 345",
      "The result of 15 multiplied by 23 is 345.",
      "15 × 23 equals 345",
    ],
    "Explain quantum computing in one sentence": [
      "Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously to perform complex calculations exponentially faster than classical computers.",
      "Quantum computing harnesses quantum mechanical phenomena like superposition and entanglement to process information in ways impossible for traditional computers.",
      "Quantum computers leverage qubits and quantum phenomena to solve certain problems much faster than classical computers.",
    ],
    "What is the boiling point of water in Celsius?": [
      "The boiling point of water is 100°C at standard atmospheric pressure.",
      "Water boils at 100 degrees Celsius under normal conditions.",
      "100°C is the boiling point of water at sea level.",
    ],
  };

  // Check if we have a predefined response set
  let responses = baseResponses[prompt];

  // If not, generate generic responses
  if (!responses) {
    responses = [
      `Based on the query "${prompt.slice(0, 50)}...", the answer is derived from consensus analysis.`,
      `Analyzing "${prompt.slice(0, 50)}..." - The consensus response indicates a verified result.`,
      `For query "${prompt.slice(0, 50)}...", multiple validators have confirmed this response.`,
    ];
  }

  // Add some variation to latencies
  return responses.map((response, index) => ({
    miner_id: `miner_${String.fromCharCode(65 + index)}_${Math.random().toString(36).slice(2, 6)}`,
    response,
    latency: Math.floor(Math.random() * 200) + 50 + index * 30,
  }));
}

// Try to call Cortensor Router API
async function callCortensorRouter(prompt: string): Promise<MinerResponse[] | null> {
  if (!CORTENSOR_ROUTER_URL) {
    console.log("Cortensor Router URL not configured, using demo mode");
    return null;
  }

  try {
    // Check router health first
    const statusResponse = await fetch(`${CORTENSOR_ROUTER_URL}/api/v1/status`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!statusResponse.ok) {
      console.log("Cortensor Router not available:", statusResponse.status);
      return null;
    }

    // Get available miners
    const minersResponse = await fetch(`${CORTENSOR_ROUTER_URL}/api/v1/miners`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });

    if (!minersResponse.ok) {
      console.log("Failed to get miners list");
      return null;
    }

    const miners = await minersResponse.json();
    if (!miners || miners.length < 3) {
      console.log("Not enough miners available");
      return null;
    }

    // Send inference request to multiple miners
    const minerResponses: MinerResponse[] = [];
    const selectedMiners = miners.slice(0, 3); // Use first 3 miners

    for (const miner of selectedMiners) {
      const startTime = Date.now();
      try {
        const completionResponse = await fetch(`${CORTENSOR_ROUTER_URL}/api/v1/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            miner_id: miner.id,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (completionResponse.ok) {
          const result = await completionResponse.json();
          minerResponses.push({
            miner_id: miner.id,
            response: result.completion || result.text || "",
            latency: Date.now() - startTime,
          });
        }
      } catch (err) {
        console.log(`Miner ${miner.id} failed:`, err);
      }
    }

    if (minerResponses.length >= 3) {
      return minerResponses;
    }

    console.log("Not enough successful miner responses");
    return null;
  } catch (err) {
    console.log("Cortensor Router call failed:", err);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, task } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing inference request for task: ${task}`);
    console.log(`Prompt: ${prompt.slice(0, 100)}...`);

    // Try Cortensor Router first, fall back to demo mode
    let minerResponses: MinerResponse[] = await callCortensorRouter(prompt) ?? generateDemoResponses(prompt);
    const isDemoMode = !(await callCortensorRouter(prompt));

    console.log(isDemoMode ? "Using demo mode with simulated responses" : "Using Cortensor Router");

    // Calculate validation metrics
    const responses = minerResponses.map((m) => m.response);
    const agreement_score = calculateAgreementScore(responses);

    // Calculate validator scores for each miner
    const avgLength = responses.reduce((sum, r) => sum + r.length, 0) / responses.length;
    const avgLatency = minerResponses.reduce((sum, m) => sum + m.latency, 0) / minerResponses.length;

    const minerScores = minerResponses.map((miner, i) => {
      const similarities = responses.map((r, j) =>
        i === j ? 100 : calculateSimilarity(miner.response, r)
      );
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
      const latencyPenalty = miner.latency > avgLatency * 2 ? 10 : 0;
      const lengthDiff = Math.abs(miner.response.length - avgLength) / avgLength;
      const lengthPenalty = lengthDiff > 0.5 ? 15 : 0;
      return Math.max(0, Math.min(100, Math.round(avgSimilarity - latencyPenalty - lengthPenalty)));
    });

    // Calculate final validator score
    const validator_score = Math.round(
      minerScores.reduce((sum, s) => sum + s, 0) / minerScores.length
    );

    // Make decision
    let decision: "approved" | "rejected" = "approved";
    let rejection_reason: string | undefined;

    if (agreement_score < 60) {
      decision = "rejected";
      rejection_reason = `Agreement score (${agreement_score}%) below threshold (60%)`;
    } else if (validator_score < 70) {
      decision = "rejected";
      rejection_reason = `Validator score (${validator_score}) below threshold (70)`;
    }

    // Select best output
    const bestMinerIndex = minerScores.indexOf(Math.max(...minerScores));
    const final_output = minerResponses[bestMinerIndex].response;

    const result: InferenceResult = {
      miners: minerResponses,
      agreement_score,
      validator_score,
      final_output,
      decision,
      rejection_reason,
      is_demo_mode: isDemoMode,
    };

    console.log(`Inference complete: ${decision} (agreement: ${agreement_score}%, validator: ${validator_score})`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Inference error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
