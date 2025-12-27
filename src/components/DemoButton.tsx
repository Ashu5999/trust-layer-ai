import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { DEMO_PROMPTS } from '@/types';

interface DemoButtonProps {
  onDemo: (prompt: string) => void;
  disabled?: boolean;
}

export function DemoButton({ onDemo, disabled }: DemoButtonProps) {
  const handleDemo = () => {
    const randomPrompt = DEMO_PROMPTS[Math.floor(Math.random() * DEMO_PROMPTS.length)];
    onDemo(randomPrompt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Button
        onClick={handleDemo}
        disabled={disabled}
        variant="outline"
        className="w-full border-trust-purple/50 text-trust-purple hover:bg-trust-purple/10 hover:border-trust-purple"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Try Demo
      </Button>
    </motion.div>
  );
}
