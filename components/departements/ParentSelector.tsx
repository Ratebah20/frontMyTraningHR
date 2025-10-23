'use client';

import { useEffect, useState } from 'react';
import { Select, Text } from '@mantine/core';
import { departementsService } from '@/lib/services';
import { HierarchyNode } from '@/lib/types';
import { TypeBadge } from './TypeBadge';

interface ParentSelectorProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  currentDepartementId?: number;
  error?: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function ParentSelector({
  value,
  onChange,
  currentDepartementId,
  error,
  label = 'Département parent',
  description = 'Sélectionnez le département ou l\'équipe parent',
  required = false,
}: ParentSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<Array<{ value: string; label: string; node: HierarchyNode }>>([]);

  useEffect(() => {
    loadHierarchy();
  }, [currentDepartementId]);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const hierarchy = await departementsService.getHierarchy(false);

      // Flatten l'arbre et exclure le département actuel et ses descendants
      const flatOptions = flattenHierarchy(hierarchy.nodes, '', currentDepartementId);

      setOptions([
        { value: 'null', label: 'Aucun parent (niveau racine)', node: null as any },
        ...flatOptions,
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement de la hiérarchie:', error);
    } finally {
      setLoading(false);
    }
  };

  const flattenHierarchy = (
    nodes: HierarchyNode[],
    prefix: string = '',
    excludeId?: number
  ): Array<{ value: string; label: string; node: HierarchyNode }> => {
    const result: Array<{ value: string; label: string; node: HierarchyNode }> = [];

    for (const node of nodes) {
      // Exclure le département actuel et ses descendants
      if (excludeId && (node.id === excludeId || isDescendantOf(node, excludeId))) {
        continue;
      }

      const indent = prefix ? prefix + ' > ' : '';
      result.push({
        value: node.id.toString(),
        label: `${indent}${node.nomDepartement} (${node.type === 'DEPARTEMENT' ? 'Département' : 'Équipe'})`,
        node,
      });

      // Ajouter les enfants récursivement
      if (node.children && node.children.length > 0) {
        result.push(...flattenHierarchy(node.children, indent + node.nomDepartement, excludeId));
      }
    }

    return result;
  };

  const isDescendantOf = (node: HierarchyNode, parentId: number): boolean => {
    if (!node.children || node.children.length === 0) {
      return false;
    }

    for (const child of node.children) {
      if (child.id === parentId || isDescendantOf(child, parentId)) {
        return true;
      }
    }

    return false;
  };

  const handleChange = (val: string | null) => {
    if (val === 'null' || val === null) {
      onChange(null);
    } else {
      onChange(parseInt(val, 10));
    }
  };

  return (
    <Select
      label={label}
      description={description}
      placeholder="Sélectionnez un parent"
      data={options.map(opt => ({ value: opt.value, label: opt.label }))}
      value={value === null || value === undefined ? 'null' : value.toString()}
      onChange={handleChange}
      error={error}
      required={required}
      searchable
      clearable
      disabled={loading}
      nothingFoundMessage="Aucun département trouvé"
    />
  );
}
