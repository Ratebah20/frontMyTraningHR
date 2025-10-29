'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  Group,
  Text,
  Badge,
  Avatar,
  Stack,
  Center,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
  Collapse,
  Paper,
  rem,
  ActionIcon,
} from '@mantine/core';
import {
  User,
  Users,
  CaretDown,
  CaretRight,
  Buildings,
  PencilSimple,
} from '@phosphor-icons/react';
import { HierarchyNode } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { EditManagerModal } from './EditManagerModal';

interface OrganizationChartProps {
  data: HierarchyNode[];
  onNodeClick?: (node: HierarchyNode) => void;
  onRefresh?: () => void;
}

interface NodeCardProps {
  node: HierarchyNode;
  level: number;
  onNodeClick?: (node: HierarchyNode) => void;
  onEditManager?: (node: HierarchyNode) => void;
}

function NodeCard({ node, level, onNodeClick, onEditManager }: NodeCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(level < 2); // Auto-expand premier et deuxième niveau

  const hasChildren = node.children && node.children.length > 0;

  const getColorByLevel = (level: number) => {
    const colors = ['blue', 'violet', 'grape', 'pink', 'orange'];
    return colors[level % colors.length];
  };

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/managers/${node.id}`);
  };

  return (
    <Box>
      <UnstyledButton
        onClick={handleClick}
        style={{ width: '100%' }}
      >
        <Card
          shadow="sm"
          radius="md"
          padding="md"
          withBorder
          style={{
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            borderColor: node.isManager ? `var(--mantine-color-${getColorByLevel(level)}-6)` : undefined,
            borderWidth: node.isManager ? 2 : 1,
          }}
          bg={node.isManager ? `var(--mantine-color-${getColorByLevel(level)}-0)` : 'white'}
        >
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm" style={{ flex: 1 }}>
              <Avatar
                size="md"
                radius="xl"
                color={getColorByLevel(level)}
              >
                {node.nomComplet.split(' ').map(n => n[0]).join('').toUpperCase()}
              </Avatar>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Group gap="xs">
                  <Text size="sm" fw={600} lineClamp={1}>
                    {node.nomComplet}
                  </Text>
                  {node.isManager && (
                    <Tooltip label={`${node.nombreSubordonnes} subordonné(s)`}>
                      <Badge
                        size="sm"
                        variant="filled"
                        color={getColorByLevel(level)}
                        leftSection={<Users size={12} />}
                      >
                        {node.nombreSubordonnes}
                      </Badge>
                    </Tooltip>
                  )}
                </Group>

                <Group gap="xs" mt={4}>
                  {node.matricule && (
                    <Text size="xs" c="dimmed">
                      {node.matricule}
                    </Text>
                  )}
                  {node.titre && (
                    <Badge size="xs" variant="light" color="gray">
                      {node.titre}
                    </Badge>
                  )}
                </Group>

                {node.departement && (
                  <Group gap={4} mt={4}>
                    <Buildings size={12} color="var(--mantine-color-dimmed)" />
                    <Text size="xs" c="dimmed">
                      {node.departement.nomDepartement}
                    </Text>
                  </Group>
                )}
              </div>
            </Group>

            <Group gap="xs">
              <Tooltip label="Modifier le manager">
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditManager?.(node);
                  }}
                >
                  <PencilSimple size={14} />
                </ActionIcon>
              </Tooltip>

              {hasChildren && (
                <UnstyledButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <ThemeIcon
                    variant="light"
                    color={getColorByLevel(level)}
                    size="sm"
                    radius="xl"
                  >
                    {expanded ? <CaretDown size={14} /> : <CaretRight size={14} />}
                  </ThemeIcon>
                </UnstyledButton>
              )}
            </Group>
          </Group>
        </Card>
      </UnstyledButton>

      {hasChildren && (
        <Collapse in={expanded}>
          <Box pl="xl" mt="md" style={{ position: 'relative' }}>
            {/* Ligne verticale de connexion */}
            <Box
              style={{
                position: 'absolute',
                left: rem(12),
                top: 0,
                bottom: 0,
                width: rem(2),
                backgroundColor: 'var(--mantine-color-gray-3)',
              }}
            />

            <Stack gap="md">
              {node.children.map((child) => (
                <Box key={child.id} style={{ position: 'relative' }}>
                  {/* Ligne horizontale de connexion */}
                  <Box
                    style={{
                      position: 'absolute',
                      left: rem(-24),
                      top: '50%',
                      width: rem(24),
                      height: rem(2),
                      backgroundColor: 'var(--mantine-color-gray-3)',
                    }}
                  />
                  <NodeCard
                    node={child}
                    level={level + 1}
                    onNodeClick={onNodeClick}
                    onEditManager={onEditManager}
                  />
                </Box>
              ))}
            </Stack>
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

export function OrganizationChart({ data, onNodeClick, onRefresh }: OrganizationChartProps) {
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);

  const handleEditManager = (node: HierarchyNode) => {
    setSelectedNode(node);
    setEditModalOpened(true);
  };

  const handleEditSuccess = () => {
    setEditModalOpened(false);
    setSelectedNode(null);
    onRefresh?.();
  };

  if (!data || data.length === 0) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <ThemeIcon size={60} radius="xl" variant="light" color="gray">
            <Users size={30} />
          </ThemeIcon>
          <div>
            <Text size="lg" fw={500} ta="center">
              Aucune hiérarchie disponible
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Commencez par assigner des managers aux collaborateurs
            </Text>
          </div>
        </Stack>
      </Center>
    );
  }

  return (
    <>
      <Paper p="lg" radius="md" withBorder>
        <Stack gap="lg">
          {data.map((root) => (
            <NodeCard
              key={root.id}
              node={root}
              level={0}
              onNodeClick={onNodeClick}
              onEditManager={handleEditManager}
            />
          ))}
        </Stack>
      </Paper>

      {selectedNode && (
        <EditManagerModal
          opened={editModalOpened}
          onClose={() => {
            setEditModalOpened(false);
            setSelectedNode(null);
          }}
          collaborateurId={selectedNode.id}
          collaborateurName={selectedNode.nomComplet}
          currentManagerId={selectedNode.managerId}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
