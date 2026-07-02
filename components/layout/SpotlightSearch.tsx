'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spotlight } from '@mantine/spotlight';
import { Group, Loader } from '@mantine/core';
import { House } from '@phosphor-icons/react/dist/ssr/House';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import { collaborateursService } from '@/lib/services';
import { Collaborateur } from '@/lib/types';

const navActions = [
  { id: 'home', label: 'Accueil', description: "Retour à l'accueil", path: '/', icon: <House size={20} /> },
  { id: 'dashboard', label: 'Dashboard', description: 'Voir le tableau de bord', path: '/dashboard', icon: <ChartBar size={20} /> },
  { id: 'formations', label: 'Formations', description: 'Gérer les formations', path: '/formations', icon: <FileText size={20} /> },
  { id: 'collaborateurs', label: 'Collaborateurs', description: 'Gérer les collaborateurs', path: '/collaborateurs', icon: <UsersThree size={20} /> },
];

const departementName = (c: Collaborateur): string | undefined =>
  typeof c.departement === 'string' ? c.departement : c.departement?.nomDepartement;

export function SpotlightSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Collaborateur[]>([]);
  const [loading, setLoading] = useState(false);

  // Recherche serveur (collaborateurs) avec debounce ~300ms
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const data = await collaborateursService.searchCollaborateurs(q);
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Erreur lors de la recherche de collaborateurs:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  const go = (path: string) => {
    setQuery('');
    router.push(path);
  };

  // Liens de navigation : filtrage local simple par libellé
  const filteredNav = navActions.filter(
    (a) => query.trim() === '' || a.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const hasResults = filteredNav.length > 0 || results.length > 0;

  return (
    <Spotlight.Root query={query} onQueryChange={setQuery}>
      <Spotlight.Search placeholder="Rechercher..." leftSection={<MagnifyingGlass size={20} />} />
      <Spotlight.ActionsList>
        {filteredNav.length > 0 && (
          <Spotlight.ActionsGroup label="Navigation">
            {filteredNav.map((a) => (
              <Spotlight.Action
                key={a.id}
                label={a.label}
                description={a.description}
                leftSection={a.icon}
                onClick={() => go(a.path)}
              />
            ))}
          </Spotlight.ActionsGroup>
        )}

        {results.length > 0 && (
          <Spotlight.ActionsGroup label="Collaborateurs">
            {results.map((c) => (
              <Spotlight.Action
                key={`collab-${c.id}`}
                label={c.nomComplet || `${c.prenom} ${c.nom}`}
                description={departementName(c)}
                leftSection={<UsersThree size={20} />}
                onClick={() => go(`/collaborateurs/${c.id}`)}
              />
            ))}
          </Spotlight.ActionsGroup>
        )}

        {loading && (
          <Group justify="center" p="md">
            <Loader size="sm" />
          </Group>
        )}

        {!loading && !hasResults && (
          <Spotlight.Empty>
            {query.trim().length < 2 ? 'Tapez au moins 2 caractères…' : 'Aucun résultat'}
          </Spotlight.Empty>
        )}
      </Spotlight.ActionsList>
    </Spotlight.Root>
  );
}
