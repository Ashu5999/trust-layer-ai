import { MinerResponse, MinerValidation, VALIDATION_THRESHOLDS } from '@/types';

// Levenshtein distance for string similarity
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

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

// Calculate similarity score between two strings (0-100)
export function calculateSimilarity(a: string, b: string): number {
  const normalizedA = a.toLowerCase().trim();
  const normalizedB = b.toLowerCase().trim();
  
  if (normalizedA === normalizedB) return 100;
  if (!normalizedA || !normalizedB) return 0;

  const maxLen = Math.max(normalizedA.length, normalizedB.length);
  const distance = levenshteinDistance(normalizedA, normalizedB);
  
  return Math.round(((maxLen - distance) / maxLen) * 100);
}

// Calculate pairwise similarity matrix
export function calculatePairwiseSimilarity(responses: string[]): number[][] {
  const n = responses.length;
  const matrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    matrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 100;
      } else if (j < i) {
        matrix[i][j] = matrix[j][i];
      } else {
        matrix[i][j] = calculateSimilarity(responses[i], responses[j]);
      }
    }
  }

  return matrix;
}

// Calculate overall agreement score
export function calculateAgreementScore(responses: string[]): number {
  if (responses.length < 2) return 100;

  const matrix = calculatePairwiseSimilarity(responses);
  let totalSimilarity = 0;
  let pairCount = 0;

  for (let i = 0; i < responses.length; i++) {
    for (let j = i + 1; j < responses.length; j++) {
      totalSimilarity += matrix[i][j];
      pairCount++;
    }
  }

  return pairCount > 0 ? Math.round(totalSimilarity / pairCount) : 100;
}

// Validate miner responses and score them
export function validateMinerResponses(miners: MinerResponse[]): {
  validations: MinerValidation[];
  validator_score: number;
  agreement_score: number;
} {
  const responses = miners.map(m => m.response);
  const agreement_score = calculateAgreementScore(responses);
  
  // Calculate average response for comparison
  const avgLength = responses.reduce((sum, r) => sum + r.length, 0) / responses.length;
  
  // Score each miner
  const validations: MinerValidation[] = miners.map((miner, i) => {
    // Calculate similarity to all other responses
    const similarities = responses
      .map((r, j) => i === j ? 100 : calculateSimilarity(miner.response, r));
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
    
    // Penalize for extreme latency
    const avgLatency = miners.reduce((sum, m) => sum + m.latency, 0) / miners.length;
    const latencyPenalty = miner.latency > avgLatency * 2 ? 10 : 0;
    
    // Penalize for extreme length difference
    const lengthDiff = Math.abs(miner.response.length - avgLength) / avgLength;
    const lengthPenalty = lengthDiff > 0.5 ? 15 : 0;
    
    const score = Math.max(0, Math.min(100, Math.round(avgSimilarity - latencyPenalty - lengthPenalty)));
    const isOutlier = score < 50;
    
    return {
      miner_id: miner.miner_id,
      score,
      isOutlier,
    };
  });

  // Calculate final validator score (weighted average, excluding outliers)
  const nonOutliers = validations.filter(v => !v.isOutlier);
  const validator_score = nonOutliers.length > 0
    ? Math.round(nonOutliers.reduce((sum, v) => sum + v.score, 0) / nonOutliers.length)
    : validations.reduce((sum, v) => sum + v.score, 0) / validations.length;

  return { validations, validator_score, agreement_score };
}

// Make final decision based on thresholds
export function makeDecision(agreement_score: number, validator_score: number): {
  decision: 'approved' | 'rejected';
  reason?: string;
} {
  if (agreement_score < VALIDATION_THRESHOLDS.MIN_AGREEMENT) {
    return {
      decision: 'rejected',
      reason: `Agreement score (${agreement_score}%) below threshold (${VALIDATION_THRESHOLDS.MIN_AGREEMENT}%)`,
    };
  }

  if (validator_score < VALIDATION_THRESHOLDS.MIN_TRUST_SCORE) {
    return {
      decision: 'rejected',
      reason: `Validator score (${validator_score}) below threshold (${VALIDATION_THRESHOLDS.MIN_TRUST_SCORE})`,
    };
  }

  return { decision: 'approved' };
}

// Select the best final output
export function selectFinalOutput(miners: MinerResponse[], validations: MinerValidation[]): string {
  // Find the miner with highest score that's not an outlier
  const sortedValidations = [...validations]
    .filter(v => !v.isOutlier)
    .sort((a, b) => b.score - a.score);

  if (sortedValidations.length === 0) {
    // All are outliers, return the one with highest score
    const best = [...validations].sort((a, b) => b.score - a.score)[0];
    return miners.find(m => m.miner_id === best.miner_id)?.response || miners[0].response;
  }

  const bestMinerId = sortedValidations[0].miner_id;
  return miners.find(m => m.miner_id === bestMinerId)?.response || miners[0].response;
}
