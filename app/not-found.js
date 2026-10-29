'use client';
import Link from 'next/link';
import { useApp } from '@/components/Providers';
import { BackButton, EmptyState } from '@/components/ui';

export default function NotFound() {
  const { t } = useApp();
  return (
    <div className="container">
      <BackButton />
      <EmptyState icon="search" title={`404 — ${t('notFound')}`} text={t('notFoundText')} action={<Link href="/" className="btn btn-primary">{t('home')}</Link>} />
    </div>
  );
}
