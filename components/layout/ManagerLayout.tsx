'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  AppShell,
  Group,
  Text,
  UnstyledButton,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Avatar,
  Menu,
  Badge,
  Flex,
  Burger,
  Container,
  ThemeIcon,
  useMantineTheme,
  Progress,
} from '@mantine/core';
import { useDisclosure, useWindowScroll } from '@mantine/hooks';
import { useMantineColorScheme } from '@mantine/core';
import { NavigationProgress } from '@mantine/nprogress';
import { House } from '@phosphor-icons/react/dist/ssr/House';
import { UsersThree } from '@phosphor-icons/react/dist/ssr/UsersThree';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { ChartBar } from '@phosphor-icons/react/dist/ssr/ChartBar';
import { SignOut } from '@phosphor-icons/react/dist/ssr/SignOut';
import { User } from '@phosphor-icons/react/dist/ssr/User';
import { Moon } from '@phosphor-icons/react/dist/ssr/Moon';
import { Sun } from '@phosphor-icons/react/dist/ssr/Sun';
import { Gear } from '@phosphor-icons/react/dist/ssr/Gear';
import { useAuth } from '@/contexts/AuthContext';

interface ManagerLayoutProps {
  children: React.ReactNode;
  user?: any;
}

const managerNavItems = [
  {
    icon: House,
    label: 'Dashboard',
    href: '/manager/dashboard',
    color: 'blue',
  },
  {
    icon: UsersThree,
    label: 'Mon equipe',
    href: '/manager/equipe',
    color: 'teal',
  },
  {
    icon: GraduationCap,
    label: 'Formations',
    href: '/manager/formations',
    color: 'violet',
  },
  {
    icon: ChartBar,
    label: 'Statistiques',
    href: '/manager/stats',
    color: 'orange',
  },
];

export function ManagerLayout({ children, user: propsUser }: ManagerLayoutProps) {
  const theme = useMantineTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [opened, { toggle }] = useDisclosure(false);
  const { user: authUser, logout } = useAuth();
  const user = propsUser || authUser;
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const [scroll] = useWindowScroll();

  const lastScrollState = useRef<boolean>(false);
  useEffect(() => {
    const header = document.getElementById('manager-header');
    if (!header) return;

    const isScrolled = scroll.y > 50;
    if (isScrolled === lastScrollState.current) return;
    lastScrollState.current = isScrolled;

    header.style.transition = 'box-shadow 0.3s ease';
    header.style.boxShadow = isScrolled ? '0 1px 3px rgba(0, 0, 0, .1)' : 'none';
  }, [scroll]);

  return (
    <>
      <NavigationProgress />
      <AppShell
        navbar={{
          width: 260,
          breakpoint: 'sm',
          collapsed: { mobile: !opened },
        }}
        header={{ height: 60 }}
        padding="md"
      >
        <AppShell.Header id="manager-header">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              padding: '0 1rem',
            }}
          >
            <Burger
              opened={opened}
              onClick={toggle}
              size="sm"
              color={theme.colors.gray[6]}
              mr="xl"
              hiddenFrom="sm"
            />

            <Flex justify="space-between" style={{ flex: 1 }}>
              <Group>
                <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                  <GraduationCap size={22} weight="bold" />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={700}>Portail Manager</Text>
                  <Text size="xs" c="dimmed">My Training HQ</Text>
                </div>
              </Group>

              <Group gap="md">
                <ActionIcon
                  variant="light"
                  size="lg"
                  onClick={() => toggleColorScheme()}
                >
                  {colorScheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </ActionIcon>

                <Menu width={260} position="bottom-end" withinPortal>
                  <Menu.Target>
                    <UnstyledButton>
                      <Group gap={7}>
                        <Avatar alt={user?.nom} radius="xl" size={35} color="blue">
                          {user?.prenom?.[0]?.toUpperCase() || user?.nom?.[0]?.toUpperCase() || 'M'}
                        </Avatar>
                        <div style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>
                            {user?.prenom && user?.nom
                              ? `${user.prenom} ${user.nom}`
                              : user?.email || 'Manager'}
                          </Text>
                          <Text c="dimmed" size="xs">Manager</Text>
                        </div>
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>Compte</Menu.Label>
                    <Menu.Item leftSection={<User size={14} />}>Mon profil</Menu.Item>
                    <Menu.Item leftSection={<Gear size={14} />}>Parametres</Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      leftSection={<SignOut size={14} />}
                      onClick={logout}
                    >
                      Deconnexion
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Flex>
          </div>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <AppShell.Section grow component={ScrollArea}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {managerNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                  <UnstyledButton
                    key={item.href}
                    component={Link}
                    href={item.href}
                    style={(theme) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 8,
                      fontWeight: isActive ? 600 : 400,
                      backgroundColor: isActive
                        ? `var(--mantine-color-${item.color}-light)`
                        : 'transparent',
                      color: isActive
                        ? `var(--mantine-color-${item.color}-filled)`
                        : undefined,
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        backgroundColor: isActive
                          ? `var(--mantine-color-${item.color}-light)`
                          : 'var(--mantine-color-default-hover)',
                      },
                    })}
                  >
                    <ThemeIcon
                      variant={isActive ? 'filled' : 'light'}
                      color={item.color}
                      size={32}
                      radius="md"
                    >
                      <Icon size={18} weight={isActive ? 'bold' : 'regular'} />
                    </ThemeIcon>
                    <Text size="sm">{item.label}</Text>
                  </UnstyledButton>
                );
              })}
            </div>
          </AppShell.Section>

          <AppShell.Section>
            <div style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: 12 }}>
              <Group gap="sm" px="xs">
                <Avatar size={32} radius="xl" color="blue">
                  {user?.prenom?.[0]?.toUpperCase() || 'M'}
                </Avatar>
                <div style={{ flex: 1 }}>
                  <Text size="xs" fw={500} lineClamp={1}>
                    {user?.prenom && user?.nom
                      ? `${user.prenom} ${user.nom}`
                      : user?.email || 'Manager'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {user?.departement || 'Manager'}
                  </Text>
                </div>
              </Group>
            </div>
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main>
          <Container size="xl" px="xl">
            <div style={{ animation: 'pageContentIn 0.3s ease both' }}>
              {children}
            </div>
          </Container>
        </AppShell.Main>
      </AppShell>
    </>
  );
}
