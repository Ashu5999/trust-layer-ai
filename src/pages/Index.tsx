import { motion } from 'framer-motion';
import { Shield, Cpu, Zap, ExternalLink, Info } from 'lucide-react';
import { useAgentPipeline } from '@/hooks/useAgentPipeline';
import { AgentTimeline } from '@/components/AgentTimeline';
import { TaskInput } from '@/components/TaskInput';
import { MinerComparisonTable } from '@/components/MinerComparisonTable';
import { TrustGauge } from '@/components/TrustGauge';
import { TrustReceipt } from '@/components/TrustReceipt';
import { DemoButton } from '@/components/DemoButton';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const { state, miners, receipt, error, isDemoMode, runInference, reset } = useAgentPipeline();

  const isLoading = state === 'inferencing' || state === 'validating';
  const hasResults = miners.length > 0;
  const isComplete = state === 'approved' || state === 'rejected' || state === 'executed';

  const handleSubmit = (prompt: string, taskName: string) => {
    runInference(prompt, taskName);
  };

  const handleDemo = (prompt: string) => {
    runInference(prompt, 'demo-task');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-trust-cyan/20 flex items-center justify-center glow-cyan">
              <Shield className="w-6 h-6 text-trust-cyan" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient-trust">TrustLayer AI</h1>
              <p className="text-xs text-muted-foreground">Decentralized Inference + Validation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isDemoMode && (
              <span className="px-3 py-1 rounded-full bg-trust-amber/20 text-trust-amber text-xs font-medium">
                Demo Mode
              </span>
            )}
            <a 
              href="https://cortensor.network" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-trust-cyan transition-colors"
            >
              Powered by Cortensor
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <motion.section 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trustless AI Infrastructure
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Decentralized redundant inference with validator consensus. 
            No single point of failure. Verifiable, transparent, and secure.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border">
              <Cpu className="w-5 h-5 text-trust-purple" />
              <span className="text-sm">3+ Miners</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border">
              <Shield className="w-5 h-5 text-trust-cyan" />
              <span className="text-sm">PoI + PoUW</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/30 border border-border">
              <Zap className="w-5 h-5 text-trust-green" />
              <span className="text-sm">Trust Receipts</span>
            </div>
          </div>
        </motion.section>

        {/* Agent Timeline */}
        <section className="mb-8">
          <AgentTimeline currentState={state} />
        </section>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column - Input */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-trust-purple" />
                Inference Request
              </h3>
              
              <TaskInput 
                onSubmit={handleSubmit} 
                isLoading={isLoading}
                disabled={isComplete && !error}
              />

              <div className="mt-4">
                <DemoButton 
                  onDemo={handleDemo} 
                  disabled={isLoading || (isComplete && !error)}
                />
              </div>

              {isComplete && (
                <motion.button
                  onClick={reset}
                  className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ← Start New Inference
                </motion.button>
              )}
            </div>

            {/* Info box */}
            <Alert className="border-trust-cyan/30 bg-trust-cyan/5">
              <Info className="w-4 h-4 text-trust-cyan" />
              <AlertDescription className="text-sm text-muted-foreground">
                <strong className="text-foreground">Why decentralized inference?</strong>
                <br />
                Centralized AI is a single point of failure. TrustLayer sends your prompt to 3+ independent miners, 
                validates consensus using PoI (Proof of Inference), and scores outputs with PoUW (Proof of Useful Work).
                Only high-agreement, high-trust outputs are approved.
              </AlertDescription>
            </Alert>
          </div>

          {/* Right column - Results */}
          <div className="space-y-6">
            {/* Error display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Miner responses */}
            {hasResults && (
              <div className="bg-card border border-border rounded-xl p-6">
                <MinerComparisonTable miners={miners} />
              </div>
            )}

            {/* Trust gauge */}
            {receipt && (
              <div className="bg-card border border-border rounded-xl p-6">
                <TrustGauge 
                  agreementScore={receipt.agreement_score}
                  validatorScore={receipt.validator_score}
                  decision={receipt.decision}
                />
              </div>
            )}

            {/* Trust receipt */}
            {receipt && <TrustReceipt receipt={receipt} />}
          </div>
        </div>

        {/* Footer info */}
        <motion.section 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl bg-muted/20 border border-border">
              <div className="w-12 h-12 rounded-lg bg-trust-purple/20 flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-6 h-6 text-trust-purple" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Proof of Inference (PoI)</h4>
              <p className="text-sm text-muted-foreground">
                Redundant inference across multiple miners ensures no single point of failure.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-muted/20 border border-border">
              <div className="w-12 h-12 rounded-lg bg-trust-cyan/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-trust-cyan" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Proof of Useful Work (PoUW)</h4>
              <p className="text-sm text-muted-foreground">
                Validators score each output, penalize outliers, and produce a trust score.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-muted/20 border border-border">
              <div className="w-12 h-12 rounded-lg bg-trust-green/20 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-trust-green" />
              </div>
              <h4 className="font-semibold text-foreground mb-2">Trust Receipts</h4>
              <p className="text-sm text-muted-foreground">
                Cryptographic proof of consensus for every inference, exportable as JSON.
              </p>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built on Cortensor Protocol — Decentralized AI Infrastructure</p>
          <p className="mt-2">
            Agreement threshold: 60% | Trust score threshold: 70
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
