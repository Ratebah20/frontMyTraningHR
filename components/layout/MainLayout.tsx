'use client';

import { useState, useEffect } from 'react';
import {
  AppShell,
  Group,
  Avatar,
  Text,
  Menu,
  UnstyledButton,
  Badge,
  ActionIcon,
  Indicator,
  Tooltip,
  Progress,
  Paper,
  Container,
  Burger,
  useMantineTheme,
  Flex,
  Button,
} from '@mantine/core';
import { useDisclosure, useWindowScroll, useHotkeys } from '@mantine/hooks';
import { useMantineColorScheme } from '@mantine/core';
import { NavigationProgress, nprogress } from '@mantine/nprogress';
import { notifications } from '@mantine/notifications';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ChatCircle,
  Gear,
  SignOut,
  User,
  MagnifyingGlass,
  Moon,
  Sun,
  ArrowsClockwise,
  Plus
} from '@phosphor-icons/react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
  user?: any;
}

export function MainLayout({ children, user: propsUser }: MainLayoutProps) {
  const theme = useMantineTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [opened, { toggle }] = useDisclosure(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user: authUser, logout } = useAuth();
  const user = propsUser || authUser;
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [scroll] = useWindowScroll();
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Breadcrumb basé sur le pathname
  const getBreadcrumbs = () => {
    const paths = pathname.split('/').filter(Boolean);
    return paths.map((path, index) => ({
      title: path.charAt(0).toUpperCase() + path.slice(1),
      href: '/' + paths.slice(0, index + 1).join('/')
    }));
  };

  // Simuler une synchronisation
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSyncing) {
        setSyncProgress((prev) => {
          if (prev >= 100) {
            setIsSyncing(false);
            notifications.show({
              title: 'Synchronisation terminée',
              message: 'Les données ont été synchronisées avec succès',
              color: 'green',
            });
            return 0;
          }
          return prev + 10;
        });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isSyncing]);

  // Animation de la navbar au scroll
  useEffect(() => {
    const header = document.getElementById('main-header');
    if (!header) return;

    if (scroll.y > 50) {
      gsap.to(header, {
        boxShadow: '0 1px 3px rgba(0, 0, 0, .1)',
        duration: 0.3,
      });
    } else {
      gsap.to(header, {
        boxShadow: 'none',
        duration: 0.3,
      });
    }
  }, [scroll]);

  // Raccourcis clavier
  useHotkeys([
    ['ctrl+K', () => notifications.show({ message: 'Recherche activée' })],
    ['ctrl+B', () => setSidebarCollapsed(!sidebarCollapsed)],
    ['ctrl+S', () => setIsSyncing(true)],
  ]);

  return (
    <>
      <NavigationProgress />
      <AppShell
        navbar={{ 
          width: sidebarCollapsed ? 80 : 300,
          breakpoint: 'sm',
          collapsed: { mobile: !opened }
        }}
        header={{ height: 70 }}
        footer={{ height: 60 }}
        padding="md"
      >
        <AppShell.Header>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            padding: '0 1rem',
          }}>
            <Burger
              opened={opened}
              onClick={toggle}
              size="sm"
              color={theme.colors.gray[6]}
              mr="xl"
              hiddenFrom="sm"
            />

            <Flex justify="space-between" style={{ flex: 1 }}>
              {/* Breadcrumbs */}
              <Group>
                {getBreadcrumbs().map((crumb, index) => (
                  <motion.div
                    key={crumb.href}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Text
                      component="a"
                      href={crumb.href}
                      size="sm"
                      c={index === getBreadcrumbs().length - 1 ? 'blue' : 'dimmed'}
                      fw={index === getBreadcrumbs().length - 1 ? 600 : 400}
                    >
                      {crumb.title}
                    </Text>
                    {index < getBreadcrumbs().length - 1 && (
                      <Text span size="sm" c="dimmed" mx="xs">/</Text>
                    )}
                  </motion.div>
                ))}
              </Group>

              {/* Actions */}
              <Group gap="md">
                {/* Nouvelle session */}
                <Button
                  leftSection={<Plus size={16} />}
                  variant="filled"
                  onClick={() => router.push('/sessions/new')}
                >
                  Nouvelle session
                </Button>

                {/* Recherche */}
                <Tooltip label="Recherche (Ctrl+K)" position="bottom">
                  <ActionIcon variant="light" size="lg">
                    <MagnifyingGlass size={20} />
                  </ActionIcon>
                </Tooltip>

                {/* Rafraîchir */}
                <Tooltip label="Synchroniser (Ctrl+S)" position="bottom">
                  <ActionIcon
                    variant="light"
                    size="lg"
                    onClick={() => setIsSyncing(true)}
                    loading={isSyncing}
                  >
                    <ArrowsClockwise size={20} />
                  </ActionIcon>
                </Tooltip>

                {/* Notifications */}
                <Indicator processing color="red" size={10}>
                  <ActionIcon variant="light" size="lg">
                    <Bell size={20} />
                  </ActionIcon>
                </Indicator>

                {/* Messages */}
                <Indicator label="3" size={16}>
                  <ActionIcon variant="light" size="lg">
                    <ChatCircle size={20} />
                  </ActionIcon>
                </Indicator>

                {/* Thème */}
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={() => toggleColorScheme()}
                >
                  <AnimatePresence mode="wait">
                    {colorScheme === 'dark' ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                      >
                        <Sun size={20} />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                      >
                        <Moon size={20} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </ActionIcon>

                {/* Menu utilisateur */}
                <Menu
                  width={260}
                  position="bottom-end"
                  transitionProps={{ transition: 'pop-top-right' }}
                  withinPortal
                >
                  <Menu.Target>
                    <UnstyledButton>
                      <Group gap={7}>
                        <Avatar 
                          alt={user?.username} 
                          radius="xl" 
                          size={35}
                          color="blue"
                        >
                          {user?.username?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>
                            {user?.full_name || user?.username || 'Utilisateur'}
                          </Text>
                          <Text c="dimmed" size="xs">
                            {user?.email || 'user@example.com'}
                          </Text>
                        </div>
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Application</Menu.Label>
                    <Menu.Item leftSection={<User size={14} />}>
                      Mon profil
                    </Menu.Item>
                    <Menu.Item leftSection={<Gear size={14} />}>
                      Paramètres
                    </Menu.Item>
                    
                    <Menu.Divider />
                    
                    <Menu.Label>Formation</Menu.Label>
                    <Menu.Item>
                      <Flex justify="space-between">
                        <Text size="xs">Heures validées</Text>
                        <Badge size="xs">24h</Badge>
                      </Flex>
                    </Menu.Item>
                    <Menu.Item>
                      <Flex justify="space-between">
                        <Text size="xs">Certifications</Text>
                        <Badge size="xs" color="green">3</Badge>
                      </Flex>
                    </Menu.Item>
                    
                    <Menu.Divider />
                    
                    <Menu.Item 
                      color="red" 
                      leftSection={<SignOut size={14} />}
                      onClick={logout}
                    >
                      Déconnexion
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Flex>
          </div>

          {/* Progress bar de sync */}
          {isSyncing && (
            <Progress
              value={syncProgress}
              size="xs"
              radius={0}
              striped
              animated
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
              }}
            />
          )}
        </AppShell.Header>

        <AppShell.Navbar>
          <Sidebar collapsed={sidebarCollapsed} onCollapse={setSidebarCollapsed} />
        </AppShell.Navbar>

        <AppShell.Footer>
          <div style={{ padding: '1rem' }}>
            <Flex justify="space-between">
              <Text size="sm" c="dimmed">
                © 2024 My Training HQ - Tous droits réservés
              </Text>
              <Group gap="xs">
                <Text size="sm" c="dimmed">Version 1.0.0</Text>
                <Badge size="sm" variant="dot" color={isSyncing ? 'yellow' : 'green'}>
                  {isSyncing ? 'Synchronisation...' : 'Connecté'}
                </Badge>
              </Group>
            </Flex>
          </div>
        </AppShell.Footer>

        <AppShell.Main>
          <Container size="xl" px="xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </Container>
        </AppShell.Main>
      </AppShell>
    </>
  );
}