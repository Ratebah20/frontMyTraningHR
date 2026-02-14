'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Center, Loader, Text, Stack } from '@mantine/core';
import { ManagerLayout } from '@/components/layout/ManagerLayout';

export default function ManagerRouteLayout({
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

    // Only managers can access this route group
    if (!isLoading && isAuthenticated && user?.role !== 'MANAGER') {
      router.push('/dashboard');
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

  if (!isAuthenticated || user?.role !== 'MANAGER') {
    return null;
  }

  return <ManagerLayout user={user}>{children}</ManagerLayout>;
}
