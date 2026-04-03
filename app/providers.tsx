'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { mantineTheme } from '@/lib/mantine-theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { NavigationProgress } from '@mantine/nprogress';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={mantineTheme} defaultColorScheme="light">
      <NavigationProgress />
      <Notifications position="top-right" />
      <AuthProvider>
        {children}
      </AuthProvider>
    </MantineProvider>
  );
}
