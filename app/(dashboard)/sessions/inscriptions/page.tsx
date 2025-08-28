'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Stack, Text, Loader } from '@mantine/core';

export default function SessionsInscriptionsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection automatique vers la page de création de session
    router.replace('/sessions/new');
  }, [router]);

  return (
    <Center h="100vh">
      <Stack align="center">
        <Loader size="lg" />
        <Text c="dimmed">Redirection vers la page d\'inscription...</Text>
      </Stack>
    </Center>
  );
}