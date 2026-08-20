'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Stack,
  Badge,
  Alert,
  Loader,
  Center,
  Grid,
  SimpleGrid,
} from '@mantine/core';
import { Buildings } from '@phosphor-icons/react/dist/ssr/Buildings';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr/ArrowLeft';
import { PencilSimple } from '@phosphor-icons/react/dist/ssr/PencilSimple';
import { useParams, useRouter } from 'next/navigation';
import { organismesService } from '@/lib/services';
import { OrganismeFormation } from '@/lib/types';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card withBorder radius="md" padding="md">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text fw={700} size="xl" mt={4}>
        {value}
      </Text>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid gutter="xs">
      <Grid.Col span={{ base: 12, sm: 4 }}>
        <Text size="sm" c="dimmed">
          {label}
        </Text>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 8 }}>{value}</Grid.Col>
    </Grid>
  );
}

export default function OrganismeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const organismeId = Number(Array.isArray(params.id) ? params.id[0] : params.id);

  const [organisme, setOrganisme] = useState<OrganismeFormation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(organismeId) || organismeId <= 0) {
      setError("Identifiant d'organisme invalide");
      setIsLoading(false);
      return;
    }

    let annule = false;

    (async () => {
      try {
        const data = await organismesService.getOrganisme(organismeId);
        if (!annule) setOrganisme(data);
      } catch (err: any) {
        if (!annule) setError(err?.message || "Impossible de charger l'organisme");
      } finally {
        if (!annule) setIsLoading(false);
      }
    })();

    return () => {
      annule = true;
    };
  }, [organismeId]);

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Center h={240}>
          <Loader />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Group gap="sm">
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={20} />}
            onClick={() => router.push('/organismes')}
          >
            Retour
          </Button>
        </Group>

        {error || !organisme ? (
          <Alert color="red" title="Erreur">
            {error || 'Organisme introuvable'}
          </Alert>
        ) : (
          <>
            <Group justify="space-between" align="flex-start">
              <div>
                <Group gap="sm" mb="xs">
                  <Buildings size={32} weight="duotone" />
                  <Title order={2}>{organisme.nomOrganisme}</Title>
                  <Badge color={organisme.actif ? 'green' : 'red'} variant="light">
                    {organisme.actif ? 'Actif' : 'Inactif'}
                  </Badge>
                </Group>
                <Text c="dimmed" size="sm">
                  Organisme de formation
                </Text>
              </div>
              <Button
                leftSection={<PencilSimple size={18} />}
                onClick={() => router.push(`/organismes/${organisme.id}/edit`)}
              >
                Modifier
              </Button>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
              <StatCard label="Formations" value={organisme._count?.formations ?? 0} />
              <StatCard
                label="Formations actives"
                value={organisme.statistics?.nbFormationsActives ?? 0}
              />
              <StatCard label="Sessions" value={organisme._count?.sessions ?? 0} />
              <StatCard
                label="Sessions actives"
                value={organisme.statistics?.nbSessionsActives ?? 0}
              />
            </SimpleGrid>

            <Card withBorder radius="md" padding="lg">
              <Stack gap="md">
                <Title order={4}>Informations</Title>
                <InfoRow
                  label="Type d'organisme"
                  value={
                    organisme.typeOrganisme ? (
                      <Badge variant="outline">{organisme.typeOrganisme}</Badge>
                    ) : (
                      <Text size="sm" c="dimmed">
                        Non renseigné
                      </Text>
                    )
                  }
                />
                <InfoRow
                  label="Contact"
                  value={
                    <Text size="sm">
                      {organisme.contact || (
                        <Text component="span" size="sm" c="dimmed">
                          Non renseigné
                        </Text>
                      )}
                    </Text>
                  }
                />
                <InfoRow
                  label="Statut"
                  value={
                    <Badge color={organisme.actif ? 'green' : 'red'} variant="light">
                      {organisme.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  }
                />
              </Stack>
            </Card>
          </>
        )}
      </Stack>
    </Container>
  );
}
