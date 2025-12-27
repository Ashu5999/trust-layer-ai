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
  Check 
} from 'lucide-react';
import { toast } from 'sonner';

interface TrustReceiptProps {
  receipt: TrustReceiptType;
}

export function TrustReceipt({ receipt }: TrustReceiptProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const receiptJson = JSON.stringify(receipt, null, 2);

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
    a.download = `trust-receipt-${receipt.receipt_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Receipt downloaded');
  };

  const isApproved = receipt.decision === 'approved';

  return (
    <motion.div
      className="border border-border rounded-lg overflow-hidden bg-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isApproved ? 'bg-trust-green/20' : 'bg-destructive/20'
          }`}>
            <FileText className={`w-5 h-5 ${isApproved ? 'text-trust-green' : 'text-destructive'}`} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">Trust Receipt</h3>
            <p className="text-xs text-muted-foreground font-mono">{receipt.receipt_id.slice(0, 8)}...</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isApproved 
              ? 'bg-trust-green/20 text-trust-green' 
              : 'bg-destructive/20 text-destructive'
          }`}>
            {receipt.decision.toUpperCase()}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {/* Summary grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Task</p>
                  <p className="text-sm font-medium text-foreground truncate">{receipt.task}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Timestamp</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(receipt.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Agreement Score</p>
                  <p className={`text-lg font-bold ${receipt.agreement_score >= 60 ? 'text-trust-green' : 'text-destructive'}`}>
                    {receipt.agreement_score}%
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Validator Score</p>
                  <p className={`text-lg font-bold ${receipt.validator_score >= 70 ? 'text-trust-green' : 'text-destructive'}`}>
                    {receipt.validator_score}
                  </p>
                </div>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Input Prompt</p>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-sm text-foreground">{receipt.input}</p>
                </div>
              </div>

              {/* Final output */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Final Output</p>
                <div className="bg-trust-cyan/10 border border-trust-cyan/30 rounded-lg p-3">
                  <p className="text-sm text-foreground font-mono">{receipt.final_output}</p>
                </div>
              </div>

              {/* Miners list */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Participating Miners ({receipt.miners.length})</p>
                <div className="flex flex-wrap gap-2">
                  {receipt.miners.map((minerId) => (
                    <span 
                      key={minerId}
                      className="px-2 py-1 bg-trust-purple/20 text-trust-purple text-xs font-mono rounded"
                    >
                      {minerId}
                    </span>
                  ))}
                </div>
              </div>

              {/* JSON preview */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Raw Receipt (JSON)</p>
                <pre className="bg-muted/50 rounded-lg p-3 text-xs text-foreground font-mono overflow-x-auto max-h-48 overflow-y-auto">
                  {receiptJson}
                </pre>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex-1"
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
                  size="sm"
                  onClick={handleDownload}
                  className="flex-1"
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
