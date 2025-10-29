
import { useState, useCallback } from 'react';

type CopyStatus = 'inactive' | 'copied' | 'failed';

export function useCopyToClipboard(): [CopyStatus, (text: string) => void] {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('inactive');

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('inactive'), 2000);
      },
      () => {
        setCopyStatus('failed');
        setTimeout(() => setCopyStatus('inactive'), 2000);
      }
    );
  }, []);

  return [copyStatus, copy];
}
