import { useState } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

interface TaskInputProps {
  onSubmit: (prompt: string, taskName: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function TaskInput({ onSubmit, isLoading, disabled }: TaskInputProps) {
  const [prompt, setPrompt] = useState('');
  const [taskName, setTaskName] = useState('inference-task');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim(), taskName.trim() || 'inference-task');
    }
  };

  return (
    <motion.form 
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Task Name</label>
        <Input
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="inference-task"
          className="bg-muted/50 border-border focus:border-trust-cyan"
          disabled={isLoading || disabled}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Inference Prompt</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt for decentralized inference..."
          className="min-h-[120px] bg-muted/50 border-border focus:border-trust-cyan resize-none"
          disabled={isLoading || disabled}
        />
      </div>

      <Button
        type="submit"
        disabled={!prompt.trim() || isLoading || disabled}
        className="w-full bg-trust-cyan hover:bg-trust-cyan/90 text-background font-semibold"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Run Inference
          </>
        )}
      </Button>
    </motion.form>
  );
}
