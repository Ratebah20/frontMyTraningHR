'use client';

import { useEffect, useState } from 'react';
import { Breadcrumbs, Anchor, Text, Group, Skeleton } from '@mantine/core';
import { House } from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { departementsService } from '@/lib/services';
import { PathNode } from '@/lib/types';
import { TypeBadge } from './TypeBadge';

interface DepartementBreadcrumbProps {
  departementId: number;
}

export function DepartementBreadcrumb({ departementId }: DepartementBreadcrumbProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pathNodes, setPathNodes] = useState<PathNode[]>([]);

  useEffect(() => {
    loadPath();
  }, [departementId]);

  const loadPath = async () => {
    try {
      setLoading(true);
      const { nodes } = await departementsService.getFullPath(departementId);
      setPathNodes(nodes);
    } catch (error) {
      console.error('Erreur lors du chargement du chemin:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Skeleton height={30} width={300} />;
  }

  const items = [
    <Anchor
      key="home"
      onClick={() => router.push('/collaborateurs/departements')}
      size="sm"
    >
      <Group gap="xs">
        <House size={16} weight="fill" />
        <span>Départements</span>
      </Group>
    </Anchor>,
    ...pathNodes.map((node, index) => {
      const isLast = index === pathNodes.length - 1;

      if (isLast) {
        return (
          <Group gap="xs" key={node.id}>
            <Text size="sm" fw={600}>
              {node.nomDepartement}
            </Text>
            <TypeBadge type={node.type} size="xs" />
          </Group>
        );
      }

      return (
        <Anchor
          key={node.id}
          onClick={() => router.push(`/collaborateurs/departements/${node.id}`)}
          size="sm"
        >
          {node.nomDepartement}
        </Anchor>
      );
    }),
  ];

  return <Breadcrumbs separator=">">{items}</Breadcrumbs>;
}
