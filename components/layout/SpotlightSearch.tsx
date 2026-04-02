'use client';

import { Spotlight, spotlight } from '@mantine/spotlight';
export { spotlight };
import { House } from '@phosphor-icons/react/dist/ssr/House';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { FileText } from '@phosphor-icons/react/dist/ssr/FileText';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';

const spotlightActions = [
  {
    id: 'home',
    label: 'Accueil',
    description: 'Retour à l\'accueil',
    onClick: () => window.location.href = '/',
    leftSection: <House size={20} />,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Voir le tableau de bord',
    onClick: () => window.location.href = '/dashboard',
    leftSection: <ChartBar size={20} />,
  },
  {
    id: 'formations',
    label: 'Formations',
    description: 'Gérer les formations',
    onClick: () => window.location.href = '/formations',
    leftSection: <FileText size={20} />,
  },
  {
    id: 'collaborateurs',
    label: 'Collaborateurs',
    description: 'Gérer les collaborateurs',
    onClick: () => window.location.href = '/collaborateurs',
    leftSection: <UsersThree size={20} />,
  },
];

export function SpotlightSearch() {
  return <Spotlight actions={spotlightActions} />;
}
