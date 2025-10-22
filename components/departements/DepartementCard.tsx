'use client';

import { Card, Text, Badge, Group, ActionIcon, Menu, Stack, Divider, Tooltip } from '@mantine/core';
import { DepartementDetail } from '@/lib/types';
import {
  DotsThreeVertical,
  PencilSimple,
  Trash,
  Eye,
  Users,
  Buildings
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';

interface DepartementCardProps {
  departement: DepartementDetail;
  onEdit: (departement: DepartementDetail) => void;
  onDelete: (departement: DepartementDetail) => void;
}

export function DepartementCard({ departement, onEdit, onDelete }: DepartementCardProps) {
  const router = useRouter();

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      className="hover:shadow-md transition-shadow cursor-pointer"
    >
      <Card.Section inheritPadding py="md">
        <Group justify="space-between" align="flex-start">
          <Group gap="xs">
            <Buildings size={24} weight="duotone" className="text-blue-500" />
            <Stack gap={0}>
              <Text fw={600} size="lg">
                {departement.nomDepartement}
              </Text>
              {departement.codeDepartement && (
                <Text size="sm" c="dimmed">
                  {departement.codeDepartement}
                </Text>
              )}
            </Stack>
          </Group>

          <Group gap="xs">
            <Badge color={departement.actif ? 'green' : 'gray'} variant="light">
              {departement.actif ? 'Actif' : 'Inactif'}
            </Badge>

            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DotsThreeVertical size={18} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<Eye size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/collaborateurs/departements/${departement.id}`);
                  }}
                >
                  Voir les détails
                </Menu.Item>
                <Menu.Item
                  leftSection={<PencilSimple size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(departement);
                  }}
                >
                  Modifier
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<Trash size={16} />}
                  color="red"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(departement);
                  }}
                >
                  Supprimer
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Card.Section>

      <Divider my="sm" />

      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Users size={18} className="text-gray-500" />
            <Text size="sm" c="dimmed">
              Collaborateurs
            </Text>
          </Group>
          <Tooltip label={`${departement.nombreCollaborateursActifs} actifs sur ${departement.nombreCollaborateurs} au total`}>
            <Text size="lg" fw={600} className="text-blue-600">
              {departement.nombreCollaborateursActifs}
              <Text span size="sm" c="dimmed" fw={400}>
                {' '}/ {departement.nombreCollaborateurs}
              </Text>
            </Text>
          </Tooltip>
        </Group>
      </Stack>

      <Card.Section inheritPadding py="sm" mt="md">
        <Group justify="flex-end" gap="xs">
          <Tooltip label="Voir les détails">
            <ActionIcon
              variant="light"
              size="lg"
              onClick={() => router.push(`/collaborateurs/departements/${departement.id}`)}
            >
              <Eye size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label="Modifier">
            <ActionIcon
              variant="light"
              color="blue"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(departement);
              }}
            >
              <PencilSimple size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Card.Section>
    </Card>
  );
}
