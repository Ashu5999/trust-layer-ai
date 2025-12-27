import { motion } from 'framer-motion';
import { VALIDATION_THRESHOLDS } from '@/types';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TrustGaugeProps {
  agreementScore: number;
  validatorScore: number;
  decision: 'approved' | 'rejected' | null;
}

export function TrustGauge({ agreementScore, validatorScore, decision }: TrustGaugeProps) {
  const isApproved = decision === 'approved';
  const agreementPasses = agreementScore >= VALIDATION_THRESHOLDS.MIN_AGREEMENT;
  const validatorPasses = validatorScore >= VALIDATION_THRESHOLDS.MIN_TRUST_SCORE;

  // Calculate gauge rotation (0-180 degrees)
  const gaugeRotation = (validatorScore / 100) * 180;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Shield className="w-5 h-5 text-trust-cyan" />
        Trust Validation
      </h3>

      {/* Gauge visualization */}
      <div className="relative w-48 h-24 mx-auto">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Colored arc */}
          <motion.path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={isApproved ? 'hsl(var(--trust-green))' : decision === 'rejected' ? 'hsl(var(--destructive))' : 'hsl(var(--trust-amber))'}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: validatorScore / 100 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {/* Threshold marker */}
          <line
            x1="100"
            y1="20"
            x2="100"
            y2="35"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            strokeDasharray="4 2"
            transform={`rotate(${(VALIDATION_THRESHOLDS.MIN_TRUST_SCORE / 100) * 180 - 90}, 100, 100)`}
          />
        </svg>

        {/* Score display */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <motion.span 
            className={`text-3xl font-bold ${isApproved ? 'text-trust-green' : decision === 'rejected' ? 'text-destructive' : 'text-foreground'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {validatorScore}
          </motion.span>
        </div>
      </div>

      {/* Threshold checks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2">
            {agreementPasses ? (
              <CheckCircle2 className="w-5 h-5 text-trust-green" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-destructive" />
            )}
            <span className="text-sm text-foreground">Agreement Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold ${agreementPasses ? 'text-trust-green' : 'text-destructive'}`}>
              {agreementScore}%
            </span>
            <span className="text-xs text-muted-foreground">
              (min: {VALIDATION_THRESHOLDS.MIN_AGREEMENT}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2">
            {validatorPasses ? (
              <CheckCircle2 className="w-5 h-5 text-trust-green" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-destructive" />
            )}
            <span className="text-sm text-foreground">Validator Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold ${validatorPasses ? 'text-trust-green' : 'text-destructive'}`}>
              {validatorScore}
            </span>
            <span className="text-xs text-muted-foreground">
              (min: {VALIDATION_THRESHOLDS.MIN_TRUST_SCORE})
            </span>
          </div>
        </div>
      </div>

      {/* Decision badge */}
      {decision && (
        <motion.div
          className={`text-center py-3 rounded-lg font-semibold ${
            isApproved 
              ? 'bg-trust-green/20 text-trust-green border border-trust-green/30' 
              : 'bg-destructive/20 text-destructive border border-destructive/30'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {isApproved ? 'APPROVED ✓' : 'REJECTED ✗'}
        </motion.div>
      )}
    </motion.div>
  );
}
