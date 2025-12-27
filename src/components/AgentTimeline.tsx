import { motion } from 'framer-motion';
import { AgentState } from '@/types';
import { 
  Circle, 
  Cpu, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Zap 
} from 'lucide-react';

interface AgentTimelineProps {
  currentState: AgentState;
}

const STATES: { key: AgentState; label: string; icon: React.ElementType }[] = [
  { key: 'idle', label: 'Idle', icon: Circle },
  { key: 'inferencing', label: 'Inferencing', icon: Cpu },
  { key: 'validating', label: 'Validating', icon: Shield },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'executed', label: 'Executed', icon: Zap },
];

const REJECTED_STATE = { key: 'rejected' as AgentState, label: 'Rejected', icon: XCircle };

function getStateIndex(state: AgentState): number {
  if (state === 'rejected') return 3; // Same position as approved
  return STATES.findIndex(s => s.key === state);
}

export function AgentTimeline({ currentState }: AgentTimelineProps) {
  const currentIndex = getStateIndex(currentState);
  const isRejected = currentState === 'rejected';

  const displayStates = isRejected 
    ? [...STATES.slice(0, 3), REJECTED_STATE, STATES[4]]
    : STATES;

  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-muted -translate-y-1/2 z-0">
          <motion.div
            className={`h-full ${isRejected ? 'bg-destructive' : 'bg-trust-green'}`}
            initial={{ width: '0%' }}
            animate={{ 
              width: `${(currentIndex / (displayStates.length - 1)) * 100}%` 
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        {/* State nodes */}
        {displayStates.map((stateItem, index) => {
          const Icon = stateItem.icon;
          const isActive = stateItem.key === currentState;
          const isPast = index < currentIndex;
          const isFuture = index > currentIndex;

          return (
            <motion.div
              key={stateItem.key}
              className="relative z-10 flex flex-col items-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors
                  ${isActive ? 'border-trust-cyan bg-trust-cyan/20' : ''}
                  ${isPast ? (isRejected && index === 3 ? 'border-destructive bg-destructive/20' : 'border-trust-green bg-trust-green/20') : ''}
                  ${isFuture ? 'border-muted bg-background' : ''}
                `}
                animate={isActive ? {
                  scale: [1, 1.1, 1],
                  boxShadow: ['0 0 0 0 hsl(var(--trust-cyan) / 0)', '0 0 20px 5px hsl(var(--trust-cyan) / 0.4)', '0 0 0 0 hsl(var(--trust-cyan) / 0)'],
                } : {}}
                transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
              >
                <Icon 
                  className={`w-5 h-5 
                    ${isActive ? 'text-trust-cyan' : ''}
                    ${isPast ? (isRejected && index === 3 ? 'text-destructive' : 'text-trust-green') : ''}
                    ${isFuture ? 'text-muted-foreground' : ''}
                  `}
                />
              </motion.div>
              
              <span className={`
                mt-2 text-xs font-medium
                ${isActive ? 'text-trust-cyan' : ''}
                ${isPast ? 'text-foreground' : ''}
                ${isFuture ? 'text-muted-foreground' : ''}
              `}>
                {stateItem.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
