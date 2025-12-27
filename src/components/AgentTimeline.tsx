import { motion } from 'framer-motion';
import { AgentState } from '@/types';
import { 
  Circle, 
  Wifi,
  Cpu, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Zap,
  Loader2
} from 'lucide-react';

interface AgentTimelineProps {
  currentState: AgentState;
}

const STATES: { key: AgentState; label: string; icon: React.ElementType }[] = [
  { key: 'idle', label: 'Idle', icon: Circle },
  { key: 'connecting', label: 'Connecting', icon: Wifi },
  { key: 'inferencing', label: 'Inferencing', icon: Cpu },
  { key: 'validating', label: 'Validating', icon: Shield },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'executed', label: 'Executed', icon: Zap },
];

const REJECTED_STATE = { key: 'rejected' as AgentState, label: 'Rejected', icon: XCircle };

function getStateIndex(state: AgentState): number {
  if (state === 'rejected') return 4;
  return STATES.findIndex(s => s.key === state);
}

export function AgentTimeline({ currentState }: AgentTimelineProps) {
  const currentIndex = getStateIndex(currentState);
  const isRejected = currentState === 'rejected';

  const displayStates = isRejected 
    ? [...STATES.slice(0, 4), REJECTED_STATE, STATES[5]]
    : STATES;

  return (
    <div className="w-full py-6 px-4">
      {/* Title */}
      <div className="text-center mb-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Agent Pipeline Status
        </h3>
        <motion.p 
          className="text-lg font-semibold text-foreground mt-1"
          key={currentState}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {currentState === 'idle' && '⏸ Waiting for input...'}
          {currentState === 'connecting' && '🔗 Connecting to Cortensor Network...'}
          {currentState === 'inferencing' && '🧠 Running redundant inference (3+ miners)...'}
          {currentState === 'validating' && '🔍 Validating with PoI + PoUW...'}
          {currentState === 'approved' && '✅ Consensus achieved - Approved!'}
          {currentState === 'rejected' && '❌ Trust threshold not met - Rejected'}
          {currentState === 'executed' && '⚡ Output verified and delivered'}
        </motion.p>
      </div>

      <div className="flex items-center justify-between relative max-w-4xl mx-auto">
        {/* Progress line background */}
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-muted -translate-y-1/2 z-0 rounded-full">
          {/* Animated progress fill */}
          <motion.div
            className={`h-full rounded-full ${
              isRejected 
                ? 'bg-gradient-to-r from-trust-cyan via-trust-purple to-destructive' 
                : 'bg-gradient-to-r from-trust-cyan via-trust-purple to-trust-green'
            }`}
            initial={{ width: '0%' }}
            animate={{ 
              width: `${(currentIndex / (displayStates.length - 1)) * 100}%` 
            }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>

        {/* State nodes */}
        {displayStates.map((stateItem, index) => {
          const Icon = stateItem.icon;
          const isActive = stateItem.key === currentState;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;
          const isProcessing = isActive && (stateItem.key === 'connecting' || stateItem.key === 'inferencing' || stateItem.key === 'validating');

          return (
            <motion.div
              key={stateItem.key}
              className="relative z-10 flex flex-col items-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <motion.div
                className={`
                  w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative
                  ${isActive && !isRejected ? 'border-trust-cyan bg-trust-cyan/20 shadow-lg shadow-trust-cyan/30' : ''}
                  ${isActive && isRejected ? 'border-destructive bg-destructive/20 shadow-lg shadow-destructive/30' : ''}
                  ${isPast && !isRejected ? 'border-trust-green bg-trust-green/20' : ''}
                  ${isPast && isRejected && index === 4 ? 'border-destructive bg-destructive/20' : ''}
                  ${isFuture ? 'border-muted bg-background/50' : ''}
                `}
                animate={isActive ? {
                  scale: [1, 1.05, 1],
                } : {}}
                transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
              >
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 text-trust-cyan animate-spin" />
                ) : (
                  <Icon 
                    className={`w-6 h-6 transition-colors duration-300
                      ${isActive && !isRejected ? 'text-trust-cyan' : ''}
                      ${isActive && isRejected ? 'text-destructive' : ''}
                      ${isPast ? 'text-trust-green' : ''}
                      ${isFuture ? 'text-muted-foreground/50' : ''}
                    `}
                  />
                )}
                
                {/* Pulse ring for active state */}
                {isActive && (
                  <motion.div
                    className={`absolute inset-0 rounded-full ${isRejected ? 'bg-destructive/20' : 'bg-trust-cyan/20'}`}
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
              
              <motion.span 
                className={`
                  mt-3 text-xs font-medium transition-colors duration-300 text-center
                  ${isActive && !isRejected ? 'text-trust-cyan' : ''}
                  ${isActive && isRejected ? 'text-destructive' : ''}
                  ${isPast ? 'text-foreground' : ''}
                  ${isFuture ? 'text-muted-foreground/50' : ''}
                `}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
              >
                {stateItem.label}
              </motion.span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
