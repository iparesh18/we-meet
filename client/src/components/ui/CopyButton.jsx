import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ value, label = 'Copy', copiedLabel = 'Copied!', className = '' }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button type="button" onClick={copy} className={`btn ${copied ? 'btn-primary' : 'btn-secondary'} ${className}`}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
