'use client';

import { Container, Title, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function KPIRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Rediriger vers le dashboard principal
    router.push('/dashboard');
  }, [router]);
  
  return (
    <Container>
      <Title order={2}>Redirection...</Title>
      <Text c="dimmed">Redirection vers le tableau de bord...</Text>
    </Container>
  );
}