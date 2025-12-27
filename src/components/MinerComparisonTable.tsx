import { motion } from 'framer-motion';
import { MinerResponse } from '@/types';
import { calculateSimilarity } from '@/lib/validation';
import { Server, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface MinerComparisonTableProps {
  miners: MinerResponse[];
}

export function MinerComparisonTable({ miners }: MinerComparisonTableProps) {
  if (miners.length === 0) return null;

  // Calculate similarity of each miner to the first miner (as reference)
  const referenceResponse = miners[0].response;
  const similarities = miners.map(m => calculateSimilarity(m.response, referenceResponse));
  const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Server className="w-5 h-5 text-trust-cyan" />
        Miner Responses ({miners.length} miners)
      </h3>

      <div className="grid gap-4">
        {miners.map((miner, index) => {
          const similarity = similarities[index];
          const isHighSimilarity = similarity >= 80;

          return (
            <motion.div
              key={miner.miner_id}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-trust-purple/20 flex items-center justify-center">
                    <Server className="w-4 h-4 text-trust-purple" />
                  </div>
                  <span className="font-mono text-sm text-foreground">{miner.miner_id}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{miner.latency}ms</span>
                  </div>

                  <div className={`flex items-center gap-1 text-sm ${isHighSimilarity ? 'text-trust-green' : 'text-trust-amber'}`}>
                    {isHighSimilarity ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>{similarity}% match</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-sm text-foreground font-mono whitespace-pre-wrap break-words">
                  {miner.response}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
        <span className="text-sm text-muted-foreground">Average Agreement</span>
        <span className={`text-lg font-bold ${avgSimilarity >= 60 ? 'text-trust-green' : 'text-destructive'}`}>
          {Math.round(avgSimilarity)}%
        </span>
      </div>
    </motion.div>
  );
}
