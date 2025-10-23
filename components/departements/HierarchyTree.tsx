'use client';

import { useState } from 'react';
import {
  Box,
  Group,
  Text,
  ActionIcon,
  Collapse,
  Badge,
  Stack,
  Paper,
  Tooltip,
  Menu,
} from '@mantine/core';
import {
  CaretRight,
  CaretDown,
  Eye,
  PencilSimple,
  Trash,
  Users,
  Plus,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { HierarchyNode } from '@/lib/types';
import { TypeBadge } from './TypeBadge';

interface HierarchyTreeProps {
  nodes: HierarchyNode[];
  onEdit?: (node: HierarchyNode) => void;
  onDelete?: (node: HierarchyNode) => void;
  onAddChild?: (parentNode: HierarchyNode) => void;
  level?: number;
}

interface TreeNodeProps {
  node: HierarchyNode;
  onEdit?: (node: HierarchyNode) => void;
  onDelete?: (node: HierarchyNode) => void;
  onAddChild?: (parentNode: HierarchyNode) => void;
  level: number;
}

function TreeNode({ node, onEdit, onDelete, onAddChild, level }: TreeNodeProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(level < 2); // Ouvrir automatiquement les 2 premiers niveaux
  const hasChildren = node.children && node.children.length > 0;

  const paddingLeft = level * 24;

  return (
    <Box>
      <Paper
        p="xs"
        mb="xs"
        withBorder
        style={{
          marginLeft: paddingLeft,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        className="hover:shadow-sm"
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" style={{ flex: 1 }}>
            {/* Bouton collapse/expand */}
            {hasChildren ? (
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }}
              >
                {isOpen ? <CaretDown size={16} /> : <CaretRight size={16} />}
              </ActionIcon>
            ) : (
              <Box w={28} /> // Espace vide pour alignement
            )}

            {/* Nom et type */}
            <Group gap="xs" style={{ flex: 1 }}>
              <Text fw={500} size="sm">
                {node.nomDepartement}
              </Text>
              {node.codeDepartement && (
                <Text size="xs" c="dimmed">
                  ({node.codeDepartement})
                </Text>
              )}
              <TypeBadge type={node.type} size="xs" variant="light" />
            </Group>

            {/* Statistiques */}
            <Group gap="sm">
              <Tooltip label="Nombre de collaborateurs">
                <Badge
                  variant="light"
                  color="blue"
                  leftSection={<Users size={12} />}
                  size="sm"
                >
                  {node.nombreCollaborateurs}
                </Badge>
              </Tooltip>

              {hasChildren && (
                <Badge variant="light" color="gray" size="sm">
                  {node.children.length} sous-{node.type === 'EQUIPE' ? 'équipe(s)' : 'département(s)'}
                </Badge>
              )}

              {!node.actif && (
                <Badge variant="light" color="red" size="sm">
                  Inactif
                </Badge>
              )}
            </Group>
          </Group>

          {/* Actions */}
          <Group gap="xs">
            <Tooltip label="Voir les détails">
              <ActionIcon
                variant="light"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/collaborateurs/departements/${node.id}`);
                }}
              >
                <Eye size={16} />
              </ActionIcon>
            </Tooltip>

            {onAddChild && (
              <Tooltip label="Ajouter une équipe">
                <ActionIcon
                  variant="light"
                  color="green"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddChild(node);
                  }}
                >
                  <Plus size={16} />
                </ActionIcon>
              </Tooltip>
            )}

            {onEdit && (
              <Tooltip label="Modifier">
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(node);
                  }}
                >
                  <PencilSimple size={16} />
                </ActionIcon>
              </Tooltip>
            )}

            {onDelete && (
              <Tooltip label="Supprimer">
                <ActionIcon
                  variant="light"
                  color="red"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(node);
                  }}
                >
                  <Trash size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Enfants (récursif) */}
      {hasChildren && (
        <Collapse in={isOpen}>
          <Box>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                level={level + 1}
              />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}

export function HierarchyTree({ nodes, onEdit, onDelete, onAddChild, level = 0 }: HierarchyTreeProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Text c="dimmed" ta="center">
          Aucun département ou équipe à afficher
        </Text>
      </Paper>
    );
  }

  return (
    <Stack gap="xs">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          level={level}
        />
      ))}
    </Stack>
  );
}
