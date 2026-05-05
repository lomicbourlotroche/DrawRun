'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/components/features/auth';

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
