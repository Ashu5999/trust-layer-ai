// ═══════════════════════════════════════════════════════════════════════════
// TrustLayer AI - Cortensor Inference Edge Function
// Implements PoI (Proof of Inference) and PoUW (Proof of Useful Work)
// ═══════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const CORTENSOR_ROUTER_URL = Deno.env.get("CORTENSOR_ROUTER_URL") || "";
const CORTENSOR_API_KEY = Deno.env.get("CORTENSOR_API_KEY") || "default-dev-token";

const VALIDATION_THRESHOLDS = {
  MIN_AGREEMENT: 60,
  MIN_TRUST_SCORE: 70,
  MIN_MINERS: 3,
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface MinerResponse {
  miner_id: string;
  response: string;
  latency: number;
}

interface ValidatorScore {
  miner_id: string;
  response_quality: number;
  latency_score: number;
  consistency_score: number;
  final_score: number;
  is_outlier: boolean;
}

interface InferenceResult {
  miners: MinerResponse[];
  agreement_score: number;
  validator_score: number;
  final_output: string;
  decision: "approved" | "rejected";
  rejection_reason?: string;
  is_demo_mode: boolean;
  validator_details?: ValidatorScore[];
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMILARITY ALGORITHMS (PoI)
// ─────────────────────────────────────────────────────────────────────────────

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

function levenshteinSimilarity(a: string, b: string): number {
  const normA = a.toLowerCase().trim();
  const normB = b.toLowerCase().trim();
  if (normA === normB) return 100;
  if (!normA || !normB) return 0;
  const maxLen = Math.max(normA.length, normB.length);
  const distance = levenshteinDistance(normA, normB);
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

function jaccardSimilarity(a: string, b: string): number {
  const tokenize = (s: string): Set<string> => 
    new Set(s.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(t => t.length > 0));
  
  const setA = tokenize(a);
  const setB = tokenize(b);
  
  if (setA.size === 0 && setB.size === 0) return 100;
  if (setA.size === 0 || setB.size === 0) return 0;
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return Math.round((intersection.size / union.size) * 100);
}

function combinedSimilarity(a: string, b: string): number {
  const lev = levenshteinSimilarity(a, b);
  const jac = jaccardSimilarity(a, b);
  // Weighted: Jaccard (semantic) > Levenshtein (character)
  return Math.round(jac * 0.6 + lev * 0.4);
}

function calculateAgreementScore(responses: string[]): number {
  if (responses.length < 2) return 100;
  
  let totalSimilarity = 0;
  let pairCount = 0;

  for (let i = 0; i < responses.length; i++) {
    for (let j = i + 1; j < responses.length; j++) {
      totalSimilarity += combinedSimilarity(responses[i], responses[j]);
      pairCount++;
    }
  }
  
  return pairCount > 0 ? Math.round(totalSimilarity / pairCount) : 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATOR SCORING (PoUW)
// ─────────────────────────────────────────────────────────────────────────────

function scoreResponseQuality(response: string): number {
  if (!response || response.length === 0) return 0;
  
  let score = 50;
  const wordCount = response.split(/\s+/).length;
  
  // Length scoring
  if (wordCount >= 10 && wordCount <= 500) score += 20;
  else if (wordCount >= 5 && wordCount <= 1000) score += 10;
  
  // Structure scoring
  if (response.includes("\n")) score += 5;
  if (/[.!?]/.test(response)) score += 5;
  if (/\d/.test(response)) score += 5;
  
  // Penalty for errors
  if (/error|exception|undefined|null/i.test(response)) score -= 20;
  if (response.length < 20) score -= 30;
  
  return Math.max(0, Math.min(100, score));
}

function scoreLatency(latencyMs: number): number {
  if (latencyMs < 500) return 100;
  if (latencyMs < 1000) return 90;
  if (latencyMs < 2000) return 80;
  if (latencyMs < 3000) return 70;
  if (latencyMs < 5000) return 50;
  return Math.max(0, 100 - Math.floor(latencyMs / 100));
}

function calculateValidatorScores(
  miners: MinerResponse[],
  responses: string[]
): ValidatorScore[] {
  const avgLatency = miners.reduce((sum, m) => sum + m.latency, 0) / miners.length;
  const avgLength = responses.reduce((sum, r) => sum + r.length, 0) / responses.length;
  
  return miners.map((miner, i) => {
    // Calculate consistency with all other responses
    const consistencyScores = responses.map((r, j) => 
      i === j ? 100 : combinedSimilarity(miner.response, r)
    );
    const consistencyScore = Math.round(
      consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length
    );
    
    // Response quality
    const responseQuality = scoreResponseQuality(miner.response);
    
    // Latency score
    const latencyScore = scoreLatency(miner.latency);
    
    // Length penalty
    const lengthDiff = Math.abs(miner.response.length - avgLength) / avgLength;
    const lengthPenalty = lengthDiff > 0.5 ? 15 : 0;
    
    // Calculate final score (consistency weighted highest)
    const baseScore = (
      consistencyScore * 0.55 +
      responseQuality * 0.25 +
      latencyScore * 0.20
    ) - lengthPenalty;
    
    const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));
    const isOutlier = consistencyScore < 50 || finalScore < 40;
    
    return {
      miner_id: miner.miner_id,
      response_quality: responseQuality,
      latency_score: latencyScore,
      consistency_score: consistencyScore,
      final_score: finalScore,
      is_outlier: isOutlier,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DEMO MODE RESPONSES
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_RESPONSES: Record<string, string[]> = {
  "What is the capital of France?": [
    "The capital of France is Paris. It has been the capital since the 10th century and is the country's largest city.",
    "Paris is the capital city of France. It is known for the Eiffel Tower and serves as the political and cultural center.",
    "France's capital is Paris, a global center for art, fashion, and culture located on the River Seine.",
  ],
  "What are the three laws of thermodynamics? Explain each in one sentence.": [
    "1) Energy cannot be created or destroyed, only transformed. 2) Entropy of an isolated system always increases. 3) Absolute zero temperature is impossible to reach.",
    "First Law: Energy is conserved in any process. Second Law: Heat flows from hot to cold spontaneously. Third Law: Perfect crystals at absolute zero have zero entropy.",
    "The laws are: 1) Conservation of energy - total energy is constant. 2) Entropy increases in closed systems. 3) Entropy approaches zero as temperature approaches absolute zero.",
  ],
  "If a train travels 120km in 2 hours, then 180km in 3 hours, what is the average speed?": [
    "Total distance = 120 + 180 = 300km. Total time = 2 + 3 = 5 hours. Average speed = 300/5 = 60 km/h.",
    "Average speed = Total distance / Total time = (120km + 180km) / (2h + 3h) = 300km / 5h = 60 km/h.",
    "The train covers 300km in 5 hours total. Therefore, average speed = 300 ÷ 5 = 60 kilometers per hour.",
  ],
};

function generateDemoResponses(prompt: string): MinerResponse[] {
  // Check for matching demo responses
  for (const [key, responses] of Object.entries(DEMO_RESPONSES)) {
    if (prompt.toLowerCase().includes(key.toLowerCase().slice(0, 30))) {
      return responses.map((response, i) => ({
        miner_id: `miner_${String.fromCharCode(65 + i)}_${crypto.randomUUID().slice(0, 4)}`,
        response,
        latency: Math.floor(Math.random() * 300) + 100 + i * 50,
      }));
    }
  }
  
  // Generate context-aware demo responses for any prompt
  const promptPreview = prompt.slice(0, 60).replace(/\n/g, " ");
  const baseLatency = Math.floor(Math.random() * 200) + 150;
  
  return [
    {
      miner_id: `miner_A_${crypto.randomUUID().slice(0, 4)}`,
      response: `Regarding "${promptPreview}...": This query has been processed through decentralized inference. The consensus among validators indicates a verified response based on distributed AI computation across the Cortensor network.`,
      latency: baseLatency,
    },
    {
      miner_id: `miner_B_${crypto.randomUUID().slice(0, 4)}`,
      response: `Analysis of "${promptPreview}...": Multiple independent miners have processed this query. The validated consensus response demonstrates the reliability of decentralized AI inference with cryptographic verification.`,
      latency: baseLatency + 75,
    },
    {
      miner_id: `miner_C_${crypto.randomUUID().slice(0, 4)}`,
      response: `For the query "${promptPreview}...": This response represents the consensus output from redundant inference across the Cortensor network, validated using Proof of Inference and Proof of Useful Work protocols.`,
      latency: baseLatency + 120,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// CORTENSOR ROUTER API
// ─────────────────────────────────────────────────────────────────────────────

async function callCortensorRouter(prompt: string): Promise<MinerResponse[] | null> {
  if (!CORTENSOR_ROUTER_URL) {
    console.log("Cortensor Router URL not configured");
    return null;
  }

  const headers = {
    "Authorization": `Bearer ${CORTENSOR_API_KEY}`,
    "Content-Type": "application/json",
  };

  try {
    // 1. Check router health
    console.log(`Connecting to Cortensor Router: ${CORTENSOR_ROUTER_URL}`);
    const statusRes = await fetch(`${CORTENSOR_ROUTER_URL}/api/v1/status`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!statusRes.ok) {
      console.log(`Router status check failed: ${statusRes.status}`);
      return null;
    }

    const status = await statusRes.json();
    console.log(`Router status: ${JSON.stringify(status)}`);

    // 2. Get available miners
    const minersRes = await fetch(`${CORTENSOR_ROUTER_URL}/api/v1/miners`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(5000),
    });

    if (!minersRes.ok) {
      console.log(`Failed to get miners: ${minersRes.status}`);
      return null;
    }

    const miners = await minersRes.json();
    console.log(`Available miners: ${miners?.length || 0}`);

    if (!miners || miners.length < VALIDATION_THRESHOLDS.MIN_MINERS) {
      console.log(`Insufficient miners: ${miners?.length || 0} < ${VALIDATION_THRESHOLDS.MIN_MINERS}`);
      return null;
    }

    // 3. Get sessions
    const sessionsRes = await fetch(`${CORTENSOR_ROUTER_URL}/api/v1/sessions`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(5000),
    });

    let sessionId = 0;
    if (sessionsRes.ok) {
      const sessions = await sessionsRes.json();
      if (sessions && sessions.length > 0) {
        sessionId = sessions[0].id;
      }
    }
    console.log(`Using session ID: ${sessionId}`);

    // 4. Send inference requests to multiple miners
    const minerResponses: MinerResponse[] = [];
    const selectedMiners = miners.slice(0, 3);

    for (const miner of selectedMiners) {
      const startTime = Date.now();
      try {
        console.log(`Sending prompt to miner: ${miner.id || miner.address}`);
        
        const completionRes = await fetch(
          `${CORTENSOR_ROUTER_URL}/api/v1/completions/${sessionId}`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              prompt,
              stream: false,
              timeout: 30,
            }),
            signal: AbortSignal.timeout(30000),
          }
        );

        const latency = Date.now() - startTime;

        if (completionRes.ok) {
          const result = await completionRes.json();
          minerResponses.push({
            miner_id: result.miner_id || miner.id || `miner_${minerResponses.length}`,
            response: result.response || result.completion || result.text || "",
            latency,
          });
          console.log(`Miner ${miner.id} responded in ${latency}ms`);
        } else {
          console.log(`Miner ${miner.id} failed: ${completionRes.status}`);
        }
      } catch (err) {
        console.log(`Miner ${miner.id} error: ${err}`);
      }
    }

    if (minerResponses.length >= VALIDATION_THRESHOLDS.MIN_MINERS) {
      console.log(`Got ${minerResponses.length} valid miner responses`);
      return minerResponses;
    }

    console.log(`Insufficient responses: ${minerResponses.length}`);
    return null;
  } catch (err) {
    console.log(`Cortensor Router error: ${err}`);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  // Handle CORS
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

    const taskName = task || "inference-task";
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Task: ${taskName}`);
    console.log(`Prompt: ${prompt.slice(0, 100)}${prompt.length > 100 ? "..." : ""}`);
    console.log(`${"=".repeat(60)}`);

    // Try Cortensor Router, fallback to demo mode
    let minerResponses = await callCortensorRouter(prompt);
    const isDemoMode = !minerResponses;

    if (!minerResponses) {
      console.log("Using demo mode");
      minerResponses = generateDemoResponses(prompt);
    }

    console.log(`Mode: ${isDemoMode ? "DEMO" : "LIVE"}`);
    console.log(`Miners: ${minerResponses.length}`);

    // Extract responses for analysis
    const responses = minerResponses.map((m) => m.response);

    // PoI: Calculate agreement
    const agreementScore = calculateAgreementScore(responses);
    console.log(`Agreement Score: ${agreementScore}%`);

    // PoUW: Calculate validator scores
    const validatorScores = calculateValidatorScores(minerResponses, responses);
    
    // Aggregate validator score (excluding outliers)
    const nonOutliers = validatorScores.filter((v) => !v.is_outlier);
    const validatorScore = nonOutliers.length > 0
      ? Math.round(nonOutliers.reduce((sum, v) => sum + v.final_score, 0) / nonOutliers.length)
      : Math.round(validatorScores.reduce((sum, v) => sum + v.final_score, 0) / validatorScores.length);
    
    console.log(`Validator Score: ${validatorScore}`);
    console.log(`Outliers: ${validatorScores.filter((v) => v.is_outlier).map((v) => v.miner_id).join(", ") || "none"}`);

    // Decision
    let decision: "approved" | "rejected" = "approved";
    let rejectionReason: string | undefined;

    if (agreementScore < VALIDATION_THRESHOLDS.MIN_AGREEMENT) {
      decision = "rejected";
      rejectionReason = `Agreement score (${agreementScore}%) below threshold (${VALIDATION_THRESHOLDS.MIN_AGREEMENT}%)`;
    } else if (validatorScore < VALIDATION_THRESHOLDS.MIN_TRUST_SCORE) {
      decision = "rejected";
      rejectionReason = `Validator score (${validatorScore}) below threshold (${VALIDATION_THRESHOLDS.MIN_TRUST_SCORE})`;
    }

    console.log(`Decision: ${decision.toUpperCase()}`);
    if (rejectionReason) console.log(`Reason: ${rejectionReason}`);

    // Select best output (highest scoring non-outlier)
    const sortedScores = [...validatorScores]
      .filter((v) => !v.is_outlier)
      .sort((a, b) => b.final_score - a.final_score);
    
    const bestMinerId = sortedScores[0]?.miner_id || validatorScores[0]?.miner_id;
    const finalOutput = minerResponses.find((m) => m.miner_id === bestMinerId)?.response || responses[0];

    const result: InferenceResult = {
      miners: minerResponses,
      agreement_score: agreementScore,
      validator_score: validatorScore,
      final_output: finalOutput,
      decision,
      rejection_reason: rejectionReason,
      is_demo_mode: isDemoMode,
      validator_details: validatorScores,
    };

    console.log(`\n✓ Inference complete\n`);

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
