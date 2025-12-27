import { motion } from 'framer-motion';
import { VALIDATION_THRESHOLDS } from '@/types';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2,
  Target,
  TrendingUp
} from 'lucide-react';

interface TrustGaugeProps {
  agreementScore: number;
  validatorScore: number;
  decision: 'approved' | 'rejected' | null;
}

export function TrustGauge({ agreementScore, validatorScore, decision }: TrustGaugeProps) {
  const isApproved = decision === 'approved';
  const agreementPasses = agreementScore >= VALIDATION_THRESHOLDS.MIN_AGREEMENT;
  const validatorPasses = validatorScore >= VALIDATION_THRESHOLDS.MIN_TRUST_SCORE;

  // SVG arc calculations
  const radius = 80;
  const strokeWidth = 14;
  const normalizedScore = Math.min(100, Math.max(0, validatorScore));
  const circumference = Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  // Threshold position on arc (70% = ~126 degrees from start)
  const thresholdAngle = (VALIDATION_THRESHOLDS.MIN_TRUST_SCORE / 100) * 180;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-5 h-5 text-trust-cyan" />
          Trust Validation (PoUW)
        </h3>
        
        {decision && (
          <motion.span 
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isApproved 
                ? 'bg-trust-green/20 text-trust-green border border-trust-green/30' 
                : 'bg-destructive/20 text-destructive border border-destructive/30'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {decision}
          </motion.span>
        )}
      </div>

      {/* Gauge visualization */}
      <div className="flex justify-center">
        <div className="relative w-52 h-28">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--trust-amber))" />
                <stop offset="50%" stopColor="hsl(var(--trust-cyan))" />
                <stop offset="100%" stopColor="hsl(var(--trust-green))" />
              </linearGradient>
              <linearGradient id="gaugeGradientRed" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--destructive))" />
                <stop offset="100%" stopColor="hsl(var(--trust-amber))" />
              </linearGradient>
            </defs>
            
            {/* Colored arc */}
            <motion.path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={isApproved ? 'url(#gaugeGradient)' : decision === 'rejected' ? 'url(#gaugeGradientRed)' : 'hsl(var(--trust-cyan))'}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />

            {/* Threshold marker line */}
            <g transform={`rotate(${thresholdAngle - 90}, 100, 100)`}>
              <line
                x1="100"
                y1="12"
                x2="100"
                y2="28"
                stroke="hsl(var(--foreground))"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.5"
              />
            </g>

            {/* Threshold label */}
            <text
              x="100"
              y="8"
              textAnchor="middle"
              className="text-[8px] fill-muted-foreground"
              transform={`rotate(${thresholdAngle - 90}, 100, 100) translate(0, -2)`}
            >
              {VALIDATION_THRESHOLDS.MIN_TRUST_SCORE}
            </text>

            {/* Min/Max labels */}
            <text x="15" y="108" className="text-[10px] fill-muted-foreground">0</text>
            <text x="180" y="108" className="text-[10px] fill-muted-foreground">100</text>
          </svg>

          {/* Score display */}
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-end pb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <span className={`text-4xl font-bold ${
              isApproved ? 'text-trust-green' : decision === 'rejected' ? 'text-destructive' : 'text-foreground'
            }`}>
              {validatorScore}
            </span>
            <span className="text-xs text-muted-foreground">Validator Score</span>
          </motion.div>
        </div>
      </div>

      {/* Threshold checks */}
      <div className="space-y-3">
        {/* Agreement check */}
        <motion.div 
          className={`
            flex items-center justify-between p-4 rounded-xl border transition-all
            ${agreementPasses 
              ? 'bg-trust-green/5 border-trust-green/30' 
              : 'bg-destructive/5 border-destructive/30'
            }
          `}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            {agreementPasses ? (
              <div className="w-8 h-8 rounded-full bg-trust-green/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-trust-green" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">Agreement Score (PoI)</p>
              <p className="text-xs text-muted-foreground">Min: {VALIDATION_THRESHOLDS.MIN_AGREEMENT}%</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold font-mono ${agreementPasses ? 'text-trust-green' : 'text-destructive'}`}>
              {agreementScore}%
            </span>
          </div>
        </motion.div>

        {/* Validator check */}
        <motion.div 
          className={`
            flex items-center justify-between p-4 rounded-xl border transition-all
            ${validatorPasses 
              ? 'bg-trust-green/5 border-trust-green/30' 
              : 'bg-destructive/5 border-destructive/30'
            }
          `}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3">
            {validatorPasses ? (
              <div className="w-8 h-8 rounded-full bg-trust-green/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-trust-green" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">Validator Score (PoUW)</p>
              <p className="text-xs text-muted-foreground">Min: {VALIDATION_THRESHOLDS.MIN_TRUST_SCORE}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-bold font-mono ${validatorPasses ? 'text-trust-green' : 'text-destructive'}`}>
              {validatorScore}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Decision explanation */}
      {decision && (
        <motion.div
          className={`
            p-4 rounded-xl text-center font-medium border-2
            ${isApproved 
              ? 'bg-trust-green/10 border-trust-green/40 text-trust-green' 
              : 'bg-destructive/10 border-destructive/40 text-destructive'
            }
          `}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <div className="flex items-center justify-center gap-2">
            {isApproved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>CONSENSUS ACHIEVED — Output Verified</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" />
                <span>TRUST THRESHOLD NOT MET — Rejected</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
