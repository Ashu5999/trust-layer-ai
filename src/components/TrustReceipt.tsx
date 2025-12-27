import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrustReceipt as TrustReceiptType } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Copy, 
  Check,
  Hash,
  Clock,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface TrustReceiptProps {
  receipt: TrustReceiptType;
}

export function TrustReceipt({ receipt }: TrustReceiptProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const receiptJson = JSON.stringify(receipt, null, 2);
  const isApproved = receipt.decision === 'approved';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(receiptJson);
    setCopied(true);
    toast.success('Receipt copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([receiptJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trustlayer-receipt-${receipt.receipt_id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Receipt downloaded');
  };

  return (
    <motion.div
      className={`
        rounded-xl overflow-hidden border-2 transition-all
        ${isApproved 
          ? 'border-trust-green/30 bg-gradient-to-br from-card to-trust-green/5' 
          : 'border-destructive/30 bg-gradient-to-br from-card to-destructive/5'
        }
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-4">
          <motion.div 
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isApproved ? 'bg-trust-green/20' : 'bg-destructive/20'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            <FileText className={`w-6 h-6 ${isApproved ? 'text-trust-green' : 'text-destructive'}`} />
          </motion.div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground text-lg">Trust Receipt</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <Hash className="w-3 h-3" />
              <span className="font-mono">{receipt.receipt_id.slice(0, 16)}...</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <motion.span 
            className={`px-4 py-1.5 rounded-full text-sm font-bold ${
              isApproved 
                ? 'bg-trust-green/20 text-trust-green' 
                : 'bg-destructive/20 text-destructive'
            }`}
            whileHover={{ scale: 1.05 }}
          >
            {receipt.decision.toUpperCase()}
          </motion.span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 space-y-5">
              {/* Stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Timestamp</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(receipt.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">Miners</span>
                  </div>
                  <p className="text-sm font-bold text-trust-purple">{receipt.miners.length}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs">Agreement</span>
                  </div>
                  <p className={`text-sm font-bold ${receipt.agreement_score >= 60 ? 'text-trust-green' : 'text-destructive'}`}>
                    {receipt.agreement_score}%
                  </p>
                </div>
                <div className="bg-muted/30 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <Zap className="w-4 h-4" />
                    <span className="text-xs">Trust Score</span>
                  </div>
                  <p className={`text-sm font-bold ${receipt.validator_score >= 70 ? 'text-trust-green' : 'text-destructive'}`}>
                    {receipt.validator_score}
                  </p>
                </div>
              </div>

              {/* Task info */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Task Name
                </label>
                <div className="bg-muted/30 rounded-lg px-4 py-3">
                  <p className="text-sm font-mono text-foreground">{receipt.task}</p>
                </div>
              </div>

              {/* Input prompt */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Input Prompt
                </label>
                <div className="bg-muted/30 rounded-lg px-4 py-3 max-h-32 overflow-y-auto">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{receipt.input}</p>
                </div>
              </div>

              {/* Final output */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Verified Output
                </label>
                <div className={`
                  rounded-lg px-4 py-3 border-2
                  ${isApproved 
                    ? 'bg-trust-green/5 border-trust-green/30' 
                    : 'bg-destructive/5 border-destructive/30'
                  }
                `}>
                  <p className="text-sm font-mono text-foreground whitespace-pre-wrap">
                    {receipt.final_output}
                  </p>
                </div>
              </div>

              {/* Miners list */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Participating Miners
                </label>
                <div className="flex flex-wrap gap-2">
                  {receipt.miners.map((minerId, i) => (
                    <motion.span 
                      key={minerId}
                      className="px-3 py-1.5 bg-trust-purple/10 border border-trust-purple/30 text-trust-purple text-xs font-mono rounded-lg"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      {minerId}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Raw JSON */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Raw Receipt (JSON)
                </label>
                <pre className="bg-background/80 border border-border rounded-lg p-4 text-xs text-foreground/80 font-mono overflow-x-auto max-h-48 overflow-y-auto">
                  {receiptJson}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="flex-1 border-border hover:border-trust-cyan hover:text-trust-cyan"
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2 text-trust-green" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex-1 border-border hover:border-trust-green hover:text-trust-green"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Receipt
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
