'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ScrollArea, 
  Group, 
  Code,
  Text,
  UnstyledButton,
  Badge,
  Tooltip,
  ActionIcon,
  Transition,
  Box,
  Collapse,
  ThemeIcon,
  Divider,
  TextInput,
  rem,
  useMantineTheme,
  Flex,
  Paper,
  Stack,
  Avatar,
  Indicator,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMantineColorScheme } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Progress } from '@mantine/core';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import {
  House,
  UsersThree,
  Books,
  Calendar,
  Upload,
  Download,
  ChartBar,
  FileText,
  Gear,
  MagnifyingGlass,
  CaretRight,
  CaretDown,
  Clock,
  ArrowsClockwise,
  GraduationCap,
  Certificate,
  ChartLineUp,
  User as UserIcon,
  SignOut as SignOutIcon,
  Wallet,
  ListChecks,
} from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { spotlight } from '@mantine/spotlight';

interface NavigationItem {
  icon: React.FC<any>;
  label: string;
  href: string;
  badge?: number;
  color?: string;
  subItems?: Array<{
    label: string;
    href: string;
  }>;
}

const navigationItems: NavigationItem[] = [
  { 
    icon: House, 
    label: 'Dashboard', 
    href: '/dashboard',
    color: 'blue'
  },
  {
    icon: UsersThree,
    label: 'Collaborateurs',
    href: '/collaborateurs',
    badge: 245,
    color: 'teal',
    subItems: [
      { label: 'Liste', href: '/collaborateurs' },
      { label: 'Nouveau', href: '/collaborateurs/new' },
      { label: 'Import', href: '/collaborateurs/import' },
      { label: 'Managers', href: '/managers' },
      { label: 'Départements', href: '/collaborateurs/departements' },
    ]
  },
  { 
    icon: Books, 
    label: 'Formations', 
    href: '/formations',
    color: 'violet',
    subItems: [
      { label: 'Catalogue', href: '/formations' },
      { label: 'Créer', href: '/formations/new' },
      { label: 'Catégories', href: '/formations/categories' },
      { label: 'Obligatoires', href: '/formations/obligatoires' },
    ]
  },
  {
    icon: Calendar,
    label: 'Sessions',
    href: '/sessions',
    badge: 12,
    color: 'orange',
    subItems: [
      { label: 'Planning', href: '/sessions' },
      { label: 'Calendrier', href: '/sessions/calendar' },
      { label: 'Inscriptions', href: '/sessions/inscriptions' },
    ]
  },
  {
    icon: ListChecks,
    label: 'Templates Tâches',
    href: '/templates',
    color: 'indigo'
  },
  {
    icon: Wallet,
    label: 'Budget',
    href: '/budget',
    color: 'grape',
    subItems: [
      { label: 'Vue d\'ensemble', href: '/budget' },
      { label: 'Dashboard KPIs', href: '/budget/dashboard' },
      { label: 'Analytics Avancés', href: '/budget/analytics' },
    ]
  },
  { 
    icon: Upload, 
    label: 'Import ETL', 
    href: '/import',
    color: 'green'
  },
  {
    icon: ChartBar,
    label: 'KPIs',
    href: '/kpi/formations',
    color: 'red',
    badge: 3,
    subItems: [
      { label: 'Formations', href: '/kpi/formations' },
      { label: 'Collaborateurs', href: '/kpi/collaborateurs' },
      { label: 'Performance', href: '/kpi/performance' },
      { label: 'Rapports', href: '/kpi/reports' },
      { label: 'Statistiques', href: '/kpi/stats' },
    ]
  },
  { 
    icon: Download, 
    label: 'Exports', 
    href: '/exports',
    color: 'cyan'
  },
  { 
    icon: FileText, 
    label: 'Documents', 
    href: '/documents',
    color: 'pink'
  },
  { 
    icon: Gear, 
    label: 'Paramètres', 
    href: '/settings',
    color: 'gray'
  },
];

export function Sidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: (value: boolean) => void }) {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement[]>([]);

  // Animation au montage
  useEffect(() => {
    if (sidebarRef.current) {
      const tl = gsap.timeline();
      
      // Animation de la sidebar
      tl.fromTo(sidebarRef.current,
        { x: -300, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
      );

      // Animation des liens
      tl.fromTo(linksRef.current,
        { x: -50, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: 0.3, 
          stagger: 0.05,
          ease: "power2.out" 
        },
        "-=0.3"
      );
    }
  }, []);

  // Animation de collapse
  useEffect(() => {
    if (sidebarRef.current) {
      gsap.to(sidebarRef.current, {
        width: collapsed ? 80 : 300,
        duration: 0.3,
        ease: "power2.inOut"
      });
    }
  }, [collapsed]);

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: NavigationItem) => {
    if (isActive(item.href)) return true;
    return item.subItems?.some(sub => isActive(sub.href)) || false;
  };

  // Styles inline pour remplacer createStyles
  const navbarStyles = {
    backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
    paddingBottom: 0,
    transition: 'width 200ms ease',
    height: '100%',
    borderRight: `1px solid ${colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]}`,
  };

  const linkStyles = (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    fontSize: theme.fontSizes.sm,
    padding: `${rem(8)} ${theme.spacing.xs}`,
    borderRadius: theme.radius.sm,
    fontWeight: active ? 600 : 500,
    color: active 
      ? theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6]
      : colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],
    backgroundColor: active
      ? colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors[theme.primaryColor][0]
      : 'transparent',
    transition: 'all 100ms ease',
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
      transform: 'translateX(5px)',
    },
  });

  const subLinkStyles = (active: boolean) => ({
    display: 'block',
    padding: `${rem(6)} ${theme.spacing.xs}`,
    paddingLeft: rem(31),
    marginLeft: rem(30),
    fontSize: theme.fontSizes.sm,
    color: active
      ? theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6]
      : colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],
    borderLeft: `${rem(1)} solid ${
      active 
        ? theme.colors[theme.primaryColor][colorScheme === 'dark' ? 4 : 6]
        : colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
    }`,
    fontWeight: active ? 600 : 400,
    transition: 'all 100ms ease',
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[0],
      borderLeftColor: theme.colors[theme.primaryColor][5],
    },
  });

  const links = navigationItems.map((item, index) => {
    const isExpanded = expandedItems.includes(item.label);
    const isParentOrActive = isParentActive(item);

    return (
      <div key={item.label} ref={(el) => {
        if (el) linksRef.current[index] = el;
      }}>
        <UnstyledButton
          onClick={() => {
            if (item.subItems) {
              toggleExpanded(item.label);
            } else {
              // Navigation handled by Link
            }
          }}
          style={linkStyles(isParentOrActive)}
          component={item.subItems ? 'button' : Link as any}
          href={item.subItems ? undefined : item.href}
        >
          <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <ThemeIcon
              color={item.color || 'blue'}
              variant={isParentOrActive ? 'filled' : 'light'}
              size={30}
              style={{
                marginRight: collapsed ? 0 : theme.spacing.sm,
                transition: 'margin 200ms ease',
              }}
            >
              <item.icon size={20} weight="duotone" />
            </ThemeIcon>

            {!collapsed && (
              <>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <Badge size="sm" variant="filled" color={item.color}>
                    {item.badge}
                  </Badge>
                )}
                {item.subItems && (
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CaretRight size={14} />
                  </motion.div>
                )}
              </>
            )}
          </div>
        </UnstyledButton>

        {!collapsed && item.subItems && (
          <Collapse in={isExpanded}>
            <div style={{ marginTop: rem(5) }}>
              {item.subItems.map((subItem) => (
                <UnstyledButton
                  key={subItem.href}
                  component={Link as any}
                  href={subItem.href}
                  style={subLinkStyles(pathname === subItem.href)}
                >
                  {subItem.label}
                </UnstyledButton>
              ))}
            </div>
          </Collapse>
        )}
      </div>
    );
  });

  return (
    <Box
      ref={sidebarRef}
      style={navbarStyles}
    >
      <Stack h="100%" gap={0}>
        {/* Header */}
        <Box p="md" pb={0}>
          <Flex align="center" justify="space-between">
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Group>
                  <ThemeIcon size="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                    <GraduationCap size={28} weight="duotone" />
                  </ThemeIcon>
                  <div>
                    <Text size="lg" fw={700}>My Training HQ</Text>
                    <Text size="xs" c="dimmed">Gestion des formations</Text>
                  </div>
                </Group>
              </motion.div>
            ) : (
              <ThemeIcon size="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                <GraduationCap size={28} weight="duotone" />
              </ThemeIcon>
            )}

            <Tooltip label={collapsed ? "Étendre" : "Réduire"} position="right">
              <ActionIcon
                onClick={() => onCollapse(!collapsed)}
                variant="subtle"
                color="gray"
                style={{
                  transition: 'all 200ms ease',
                  transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <CaretRight size={20} />
              </ActionIcon>
            </Tooltip>
          </Flex>

          {/* Search */}
          {!collapsed && (
            <TextInput
              placeholder="Rechercher..."
              size="sm"
              mt="md"
              leftSection={<MagnifyingGlass size={16} />}
              rightSection={<Code>Ctrl + K</Code>}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              onClick={() => spotlight.open()}
              readOnly
              style={{ cursor: 'pointer' }}
            />
          )}
        </Box>

        <Divider my="sm" />

        {/* Navigation */}
        <ScrollArea style={{ flex: 1 }} px="md">
          <Box pb="md">
            {links}
          </Box>
        </ScrollArea>

        <Divider />

        {/* Footer */}
        <Box p="md">
          {/* User info */}
          <UnstyledButton
            style={{
              display: 'block',
              width: '100%',
              padding: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              color: colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],
              backgroundColor: colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
              border: `${rem(1)} solid ${
                colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
              }`,
              transition: 'all 150ms ease',
            }}
          >
            <Flex justify="space-between" align="center">
              {!collapsed ? (
                <Group>
                  <Avatar
                    alt={user?.username}
                    radius="xl"
                    size={30}
                  >
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>
                      {user?.full_name || user?.username || 'Utilisateur'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {user?.email || 'Formateur'}
                    </Text>
                  </div>
                </Group>
              ) : (
                <Tooltip label={user?.full_name || user?.username || 'Utilisateur'} position="right">
                  <Avatar
                    alt={user?.username}
                    radius="xl"
                    size={30}
                  >
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                </Tooltip>
              )}
            </Flex>
          </UnstyledButton>

          {/* Stats rapides */}
          {!collapsed && (
            <Paper
              mt="md"
              p="md"
              radius="md"
              style={{
                backgroundColor: colorScheme === 'dark' 
                  ? theme.colors.dark[7] 
                  : theme.colors.blue[0],
                borderLeft: `${rem(4)} solid ${theme.colors.blue[6]}`,
              }}
            >
              <Group justify="space-between" mb="xs">
                <Text size="xs" c="dimmed">Cette semaine</Text>
                <Badge size="xs" variant="dot" color="green">
                  Actif
                </Badge>
              </Group>
              <Text size="lg" fw={700}>12 sessions</Text>
              <Text size="xs" c="dimmed">245 participants</Text>
              <Progress
                value={75}
                size="xs"
                mt="xs"
                color="blue"
                animated
              />
            </Paper>
          )}
        </Box>
      </Stack>
    </Box>
  );
}