'use client';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { mantineTheme } from '@/lib/mantine-theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { GSAPProvider } from '@/components/providers/gsap-provider';
import { Spotlight } from '@mantine/spotlight';
import { MagnifyingGlass, House, ChartBar, FileText, UsersThree } from '@phosphor-icons/react';
import { NavigationProgress } from '@mantine/nprogress';

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

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme="light">
      <NavigationProgress />
      <ModalsProvider>
        <Notifications position="top-right" />
        <AuthProvider>
          <GSAPProvider>
            {children}
            <Spotlight
              actions={spotlightActions}
            />
          </GSAPProvider>
        </AuthProvider>
      </ModalsProvider>
    </MantineProvider>
  );
}