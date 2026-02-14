'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Center, Loader, Stack, Text } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import dynamic from 'next/dynamic';

const SpotlightSearch = dynamic(
  () => import('@/components/layout/SpotlightSearch').then(mod => ({ default: mod.SpotlightSearch })),
  { ssr: false }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Only RH users can access dashboard routes
    if (!isLoading && isAuthenticated && user?.role === 'MANAGER') {
      router.push('/manager/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader size="xl" variant="bars" />
          <Text c="dimmed">Chargement...</Text>
        </Stack>
      </Center>
    );
  }

  if (!isAuthenticated || user?.role === 'MANAGER') {
    return null;
  }

  return (
    <ModalsProvider>
      <MainLayout user={user}>
        {children}
        <SpotlightSearch />
      </MainLayout>
    </ModalsProvider>
  );
}
