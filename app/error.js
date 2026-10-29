'use client';
import { ErrorState } from '@/components/ui';

export default function Error({ error, reset }) {
  return <div className="container"><ErrorState error={error} onRetry={reset} /></div>;
}
