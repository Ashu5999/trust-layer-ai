import { motion, AnimatePresence } from 'framer-motion';
import { MinerResponse } from '@/types';
import { calculateSimilarity } from '@/lib/validation';
import { 
  Server, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Zap
} from 'lucide-react';

interface MinerComparisonTableProps {
  miners: MinerResponse[];
}

export function MinerComparisonTable({ miners }: MinerComparisonTableProps) {
  if (miners.length === 0) return null;

  // Calculate pairwise similarities
  const similarities = miners.map((miner, i) => {
    const scores = miners.map((other, j) => 
      i === j ? 100 : calculateSimilarity(miner.response, other.response)
    );
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  });
  
  const avgSimilarity = Math.round(similarities.reduce((a, b) => a + b, 0) / similarities.length);
  const avgLatency = Math.round(miners.reduce((sum, m) => sum + m.latency, 0) / miners.length);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Server className="w-5 h-5 text-trust-purple" />
          Miner Responses
          <span className="ml-2 px-2 py-0.5 bg-trust-purple/20 text-trust-purple text-xs rounded-full">
            {miners.length} miners
          </span>
        </h3>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="w-4 h-4" />
            <span>Avg: {avgLatency}ms</span>
          </div>
          <div className={`flex items-center gap-2 ${avgSimilarity >= 60 ? 'text-trust-green' : 'text-trust-amber'}`}>
            <Zap className="w-4 h-4" />
            <span>{avgSimilarity}% consensus</span>
          </div>
        </div>
      </div>

      {/* Miner cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {miners.map((miner, index) => {
            const similarity = similarities[index];
            const isHighSimilarity = similarity >= 70;
            const isLowSimilarity = similarity < 50;
            const isSlowResponse = miner.latency > avgLatency * 1.5;

            return (
              <motion.div
                key={miner.miner_id}
                className={`
                  relative overflow-hidden rounded-xl border transition-all duration-300
                  ${isLowSimilarity 
                    ? 'border-destructive/50 bg-destructive/5' 
                    : 'border-border bg-card hover:border-trust-cyan/30'
                  }
                `}
                initial={{ opacity: 0, x: -30, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                {/* Gradient accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  isLowSimilarity 
                    ? 'bg-destructive' 
                    : isHighSimilarity 
                      ? 'bg-trust-green' 
                      : 'bg-trust-amber'
                }`} />

                <div className="p-4 pl-5">
                  {/* Miner header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isLowSimilarity 
                            ? 'bg-destructive/20' 
                            : 'bg-trust-purple/20'
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Server className={`w-5 h-5 ${isLowSimilarity ? 'text-destructive' : 'text-trust-purple'}`} />
                      </motion.div>
                      <div>
                        <span className="font-mono text-sm font-medium text-foreground">
                          {miner.miner_id}
                        </span>
                        {isLowSimilarity && (
                          <span className="ml-2 px-2 py-0.5 bg-destructive/20 text-destructive text-xs rounded">
                            OUTLIER
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Latency */}
                      <div className={`flex items-center gap-1.5 text-sm ${
                        isSlowResponse ? 'text-trust-amber' : 'text-muted-foreground'
                      }`}>
                        <Clock className="w-4 h-4" />
                        <span className="font-mono">{miner.latency}ms</span>
                      </div>

                      {/* Similarity badge */}
                      <div className={`
                        flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
                        ${isHighSimilarity 
                          ? 'bg-trust-green/20 text-trust-green' 
                          : isLowSimilarity 
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-trust-amber/20 text-trust-amber'
                        }
                      `}>
                        {isHighSimilarity ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <span>{similarity}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Response content */}
                  <motion.div 
                    className="bg-muted/30 rounded-lg p-4 border border-border/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                  >
                    <p className="text-sm text-foreground/90 font-mono leading-relaxed whitespace-pre-wrap break-words">
                      {miner.response}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Summary bar */}
      <motion.div 
        className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl border border-border"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-trust-cyan" />
          <span className="text-sm text-muted-foreground">Proof of Inference</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Avg Latency</p>
            <p className="font-mono font-bold text-foreground">{avgLatency}ms</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Agreement</p>
            <p className={`font-mono font-bold ${avgSimilarity >= 60 ? 'text-trust-green' : 'text-destructive'}`}>
              {avgSimilarity}%
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
