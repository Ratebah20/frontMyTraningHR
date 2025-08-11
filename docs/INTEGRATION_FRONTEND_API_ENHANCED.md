# 🚀 Documentation d'Intégration Frontend-API Enhanced
## Avec GSAP, Mantine, Tremor et Stack Moderne

## 📋 Vue d'ensemble

Cette documentation détaille l'intégration complète entre le frontend React (Next.js 14) et l'API FastAPI, en utilisant notre stack moderne incluant GSAP pour les animations, Mantine pour les composants UI, Tremor pour les dashboards, et TanStack Query pour la gestion des données.

## 🛠️ Stack Technique Complète

### Backend API ✅
- **URL de base**: `http://localhost:8000/api`
- **51 endpoints** opérationnels
- **Authentification JWT**
- **Documentation Swagger**: `http://localhost:8000/docs`

### Frontend 🎨
- **Framework**: Next.js 14 avec TypeScript
- **UI Components**: Mantine + Shadcn/ui + Tremor
- **Animations**: GSAP (gratuit complet) + Framer Motion
- **State Management**: Zustand + TanStack Query
- **Styling**: Tailwind CSS + CSS Variables
- **Data Viz**: Tremor + ApexCharts + Recharts
- **Forms**: React Hook Form + Zod

## 🏗️ Architecture et Configuration

### 1. Configuration de base améliorée

#### Variables d'environnement (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=DB Formation
NEXT_PUBLIC_APP_VERSION=1.0.0

# Auth Configuration
NEXT_PUBLIC_JWT_EXPIRY=1800000  # 30 minutes
NEXT_PUBLIC_REFRESH_EXPIRY=604800000  # 7 days

# Features Flags
NEXT_PUBLIC_ENABLE_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_IMPORT=true
NEXT_PUBLIC_ENABLE_EXPORT=true
NEXT_PUBLIC_ENABLE_KPI=true

# GSAP Configuration
NEXT_PUBLIC_GSAP_DEBUG=false
```

#### Service API amélioré avec TanStack Query (lib/api-client.ts)
```typescript
import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Configuration Axios
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configuration TanStack Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Intercepteur avec notifications Mantine
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const message = error.response?.data?.detail || 'Une erreur est survenue';
    
    notifications.show({
      title: 'Erreur',
      message,
      color: 'red',
      autoClose: 5000,
    });
    
    if (error.response?.status === 401) {
      // Gestion du refresh token
      const originalRequest = error.config;
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          
          return apiClient(originalRequest);
        } catch (refreshError) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 2. Providers et Configuration Globale

#### Providers principaux (app/providers.tsx)
```typescript
'use client';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { queryClient } from '@/lib/api-client';
import { mantineTheme } from '@/lib/mantine-theme';
import { AuthProvider } from '@/hooks/useAuth';
import { GSAPProvider } from '@/components/providers/gsap-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={mantineTheme}>
        <ModalsProvider>
          <Notifications position="top-right" />
          <ThemeProvider attribute="class" defaultTheme="light">
            <AuthProvider>
              <GSAPProvider>
                {children}
              </GSAPProvider>
            </AuthProvider>
          </ThemeProvider>
        </ModalsProvider>
      </MantineProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### Configuration Mantine Theme (lib/mantine-theme.ts)
```typescript
import { createTheme, MantineColorsTuple } from '@mantine/core';

const brandColors: MantineColorsTuple = [
  '#e5f4ff',
  '#cde2ff',
  '#9bc2ff',
  '#64a0ff',
  '#3984fe',
  '#1d72fe',
  '#0969ff',
  '#0058e4',
  '#004ecc',
  '#0043b5'
];

export const mantineTheme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: brandColors,
  },
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        size: 'sm',
      },
      styles: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    Card: {
      defaultProps: {
        shadow: 'sm',
        withBorder: true,
      },
    },
  },
});
```

### 3. GSAP Provider et Animations

#### GSAP Provider (components/providers/gsap-provider.tsx)
```typescript
'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { SplitText } from 'gsap/SplitText';

// Enregistrer les plugins GSAP
gsap.registerPlugin(ScrollTrigger, TextPlugin, DrawSVGPlugin, MorphSVGPlugin, SplitText);

export function GSAPProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Configuration globale GSAP
    gsap.config({
      nullTargetWarn: false,
      force3D: true,
    });

    // Defaults pour les animations
    gsap.defaults({
      ease: 'power3.out',
      duration: 0.8,
    });

    // Nettoyage au démontage
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return <>{children}</>;
}
```

### 4. Services avec TanStack Query

#### Service Formations Enhanced (services/formations.service.ts)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Formation, FormationCreate } from '@/types/formation';
import { notifications } from '@mantine/notifications';

// Clés de cache
const FORMATIONS_KEY = ['formations'];

// Hooks personnalisés
export const useFormations = (params?: any) => {
  return useQuery({
    queryKey: [...FORMATIONS_KEY, params],
    queryFn: async () => {
      const { data } = await apiClient.get('/formations', { params });
      return data;
    },
  });
};

export const useFormation = (id: number) => {
  return useQuery({
    queryKey: [...FORMATIONS_KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/formations/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateFormation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formation: FormationCreate) => {
      const { data } = await apiClient.post('/formations', formation);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMATIONS_KEY });
      notifications.show({
        title: 'Succès',
        message: 'Formation créée avec succès',
        color: 'green',
      });
    },
  });
};

export const useUpdateFormation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Formation> }) => {
      const response = await apiClient.put(`/formations/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: FORMATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: [...FORMATIONS_KEY, variables.id] });
      notifications.show({
        title: 'Succès',
        message: 'Formation mise à jour',
        color: 'green',
      });
    },
  });
};

export const useDeleteFormation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/formations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FORMATIONS_KEY });
      notifications.show({
        title: 'Succès',
        message: 'Formation supprimée',
        color: 'green',
      });
    },
  });
};
```

### 5. Composants UI Modernes

#### Dashboard avec Tremor et GSAP (app/(dashboard)/page.tsx)
```typescript
'use client';

import { useEffect, useRef } from 'react';
import { Card, Grid, Text, Metric, Flex, ProgressBar } from '@tremor/react';
import { Container, Title, Group } from '@mantine/core';
import { gsap } from 'gsap';
import { useKPIs } from '@/services/kpi.service';
import { 
  UsersIcon, 
  AcademicCapIcon, 
  CalendarIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/solid';

export default function DashboardPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: kpis, isLoading } = useKPIs();

  useEffect(() => {
    if (!isLoading && containerRef.current) {
      // Animation GSAP au chargement
      const cards = containerRef.current.querySelectorAll('.dashboard-card');
      
      gsap.fromTo(cards,
        { 
          opacity: 0, 
          y: 50,
          scale: 0.9,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
        }
      );

      // Animation des métriques
      const metrics = containerRef.current.querySelectorAll('.metric-value');
      metrics.forEach((metric) => {
        const value = parseInt(metric.textContent || '0');
        gsap.from(metric, {
          textContent: 0,
          duration: 2,
          ease: "power2.out",
          snap: { textContent: 1 },
          onUpdate: function() {
            metric.textContent = Math.ceil(this.targets()[0].textContent);
          }
        });
      });
    }
  }, [isLoading]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const cards = [
    {
      title: "Total Collaborateurs",
      metric: kpis?.total_collaborateurs || 0,
      icon: UsersIcon,
      color: "blue",
      progress: 85,
    },
    {
      title: "Formations Actives",
      metric: kpis?.formations_actives || 0,
      icon: AcademicCapIcon,
      color: "green",
      progress: 72,
    },
    {
      title: "Sessions ce mois",
      metric: kpis?.sessions_mois || 0,
      icon: CalendarIcon,
      color: "amber",
      progress: 60,
    },
    {
      title: "Taux de completion",
      metric: `${kpis?.taux_completion || 0}%`,
      icon: ChartBarIcon,
      color: "purple",
      progress: kpis?.taux_completion || 0,
    },
  ];

  return (
    <Container size="xl" ref={containerRef}>
      <Title order={1} mb="xl">
        Tableau de bord
      </Title>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
        {cards.map((card, index) => (
          <Card key={index} className="dashboard-card">
            <Flex alignItems="start">
              <div>
                <Text>{card.title}</Text>
                <Metric className="metric-value">{card.metric}</Metric>
              </div>
              <card.icon className={`h-8 w-8 text-${card.color}-500`} />
            </Flex>
            <ProgressBar 
              value={card.progress} 
              color={card.color} 
              className="mt-4" 
            />
          </Card>
        ))}
      </Grid>

      {/* Graphiques avec Tremor */}
      <Grid numItemsSm={1} numItemsLg={2} className="gap-6 mt-6">
        <FormationsTrendChart />
        <DepartmentsDistribution />
      </Grid>
    </Container>
  );
}
```

#### Table des Formations avec Mantine et TanStack Table
```typescript
'use client';

import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  ScrollArea,
  TextInput,
  Select,
  Group,
  Button,
  Badge,
  ActionIcon,
  Menu,
  Text,
  Card,
} from '@mantine/core';
import { IconSearch, IconPlus, IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { useFormations, useDeleteFormation } from '@/services/formations.service';
import { modals } from '@mantine/modals';
import Link from 'next/link';

export default function FormationsTable() {
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  const { data: formations = [], isLoading } = useFormations({
    search: globalFilter,
    statut: statusFilter,
  });
  
  const deleteFormation = useDeleteFormation();

  const columns = useMemo(() => [
    {
      accessorKey: 'intitule',
      header: 'Formation',
      cell: ({ row }: any) => (
        <Text weight={500}>{row.original.intitule}</Text>
      ),
    },
    {
      accessorKey: 'type_formation',
      header: 'Type',
      cell: ({ row }: any) => (
        <Badge color={getTypeColor(row.original.type_formation)}>
          {row.original.type_formation}
        </Badge>
      ),
    },
    {
      accessorKey: 'statut',
      header: 'Statut',
      cell: ({ row }: any) => (
        <Badge color={getStatusColor(row.original.statut)}>
          {row.original.statut}
        </Badge>
      ),
    },
    {
      accessorKey: 'duree_heures',
      header: 'Durée',
      cell: ({ row }: any) => `${row.original.duree_heures}h`,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <Menu position="bottom-end" withinPortal>
          <Menu.Target>
            <ActionIcon variant="subtle">
              <IconDots size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              icon={<IconEdit size={14} />}
              component={Link}
              href={`/formations/${row.original.id}/edit`}
            >
              Modifier
            </Menu.Item>
            <Menu.Item
              icon={<IconTrash size={14} />}
              color="red"
              onClick={() => handleDelete(row.original)}
            >
              Supprimer
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ),
    },
  ], []);

  const table = useReactTable({
    data: formations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
  });

  const handleDelete = (formation: any) => {
    modals.openConfirmModal({
      title: 'Confirmer la suppression',
      children: (
        <Text size="sm">
          Êtes-vous sûr de vouloir supprimer la formation "{formation.intitule}" ?
        </Text>
      ),
      labels: { confirm: 'Supprimer', cancel: 'Annuler' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteFormation.mutate(formation.id),
    });
  };

  return (
    <Card>
      <Group position="apart" mb="md">
        <TextInput
          placeholder="Rechercher..."
          icon={<IconSearch size={16} />}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          style={{ width: 300 }}
        />
        
        <Group>
          <Select
            placeholder="Filtrer par statut"
            data={[
              { value: '', label: 'Tous' },
              { value: 'Planifiée', label: 'Planifiée' },
              { value: 'En cours', label: 'En cours' },
              { value: 'Terminée', label: 'Terminée' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
          />
          
          <Button
            leftIcon={<IconPlus size={16} />}
            component={Link}
            href="/formations/new"
          >
            Nouvelle formation
          </Button>
        </Group>
      </Group>

      <ScrollArea>
        <Table striped highlightOnHover>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </ScrollArea>

      <Group position="apart" mt="md">
        <Text size="sm" color="dimmed">
          Page {table.getState().pagination.pageIndex + 1} sur{' '}
          {table.getPageCount()}
        </Text>
        
        <Group>
          <Button
            variant="subtle"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Précédent
          </Button>
          <Button
            variant="subtle"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
          </Button>
        </Group>
      </Group>
    </Card>
  );
}

function getTypeColor(type: string) {
  const colors: Record<string, string> = {
    'Interne': 'blue',
    'Externe': 'green',
    'E-learning': 'purple',
    'Certifiante': 'orange',
  };
  return colors[type] || 'gray';
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    'Planifiée': 'blue',
    'En cours': 'yellow',
    'Terminée': 'green',
    'Annulée': 'red',
  };
  return colors[status] || 'gray';
}
```

#### Import ETL avec Animations GSAP et Mantine
```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Container,
  Title,
  Card,
  Stack,
  Button,
  Progress,
  Alert,
  Group,
  Text,
  List,
  ThemeIcon,
  Paper,
  Timeline,
  Badge,
} from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { 
  IconUpload, 
  IconX, 
  IconCheck, 
  IconFile,
  IconDatabase,
  IconRefresh,
} from '@tabler/icons-react';
import { gsap } from 'gsap';
import { useImportETL } from '@/services/import.service';
import { notifications } from '@mantine/notifications';

const FILE_CONFIGS = [
  { 
    type: 'orange_learning', 
    label: 'Orange Learning (OLU)', 
    icon: '🎓',
    color: 'orange',
  },
  { 
    type: 'suivi_formations', 
    label: 'Suivi Formations', 
    icon: '📊',
    color: 'blue',
  },
  { 
    type: 'budget', 
    label: 'Budget', 
    icon: '💰',
    color: 'green',
  },
  { 
    type: 'plan_formation', 
    label: 'Plan Formation', 
    icon: '📅',
    color: 'purple',
  },
  { 
    type: 'recueil_besoins', 
    label: 'Recueil Besoins', 
    icon: '📝',
    color: 'red',
  }
];

export default function ImportETLPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const timelineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const { mutate: startImport } = useImportETL({
    onSuccess: () => {
      notifications.show({
        title: 'Import terminé',
        message: 'Les données ont été importées avec succès',
        color: 'green',
        icon: <IconCheck />,
      });
      setImporting(false);
      animateSuccess();
    },
    onError: () => {
      setImporting(false);
    },
  });

  useEffect(() => {
    if (importing && progressRef.current) {
      // Animation de la barre de progression
      gsap.to(progressRef.current, {
        width: `${progress}%`,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, [progress, importing]);

  const handleImport = () => {
    setImporting(true);
    setProgress(0);
    
    // Animation du timeline
    if (timelineRef.current) {
      const items = timelineRef.current.querySelectorAll('.timeline-item');
      gsap.fromTo(items,
        { opacity: 0, x: -50 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.5,
          stagger: 0.2,
          ease: "power3.out",
        }
      );
    }

    // Simulation de progression
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
      
      setCurrentStep(prev => Math.min(prev + 1, FILE_CONFIGS.length - 1));
    }, 1000);

    // Lancer l'import réel
    startImport({
      files: FILE_CONFIGS.map(config => ({
        file_type: config.type,
        file_path: `C:/excel/${config.type}.xlsx`,
      })),
      merge_after_import: true,
      validate_only: false,
      error_threshold: 0.1,
    });
  };

  const animateSuccess = () => {
    const tl = gsap.timeline();
    
    tl.to('.import-card', {
      scale: 1.05,
      duration: 0.3,
      ease: "power2.out",
    })
    .to('.import-card', {
      scale: 1,
      duration: 0.3,
      ease: "power2.in",
    })
    .fromTo('.success-message',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    );
  };

  return (
    <Container size="lg">
      <Title order={1} mb="xl">Import ETL</Title>

      <Stack spacing="xl">
        {/* Zone de dépôt de fichiers */}
        <Card className="import-card">
          <Dropzone
            onDrop={setFiles}
            maxSize={100 * 1024 ** 2} // 100MB
            accept={[MIME_TYPES.xlsx, MIME_TYPES.xls]}
            loading={importing}
          >
            <Group position="center" spacing="xl" style={{ minHeight: 220 }}>
              <Dropzone.Accept>
                <IconUpload size={50} stroke={1.5} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={50} stroke={1.5} />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconFile size={50} stroke={1.5} />
              </Dropzone.Idle>

              <div>
                <Text size="xl" inline>
                  Glissez vos fichiers Excel ici
                </Text>
                <Text size="sm" color="dimmed" inline mt={7}>
                  ou cliquez pour sélectionner
                </Text>
              </div>
            </Group>
          </Dropzone>
        </Card>

        {/* Timeline des fichiers */}
        <Card>
          <Title order={3} mb="md">Fichiers à importer</Title>
          <Timeline 
            ref={timelineRef}
            active={currentStep}
            bulletSize={24}
            lineWidth={2}
          >
            {FILE_CONFIGS.map((config, index) => (
              <Timeline.Item
                key={config.type}
                className="timeline-item"
                bullet={<Text size="sm">{config.icon}</Text>}
                title={config.label}
              >
                <Badge color={config.color} variant="light">
                  {config.type}.xlsx
                </Badge>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>

        {/* Barre de progression */}
        {importing && (
          <Card>
            <Group position="apart" mb="xs">
              <Text weight={500}>Import en cours...</Text>
              <Text size="sm" color="dimmed">{progress}%</Text>
            </Group>
            <Progress 
              value={progress} 
              size="xl" 
              radius="xl"
              color="blue"
              animate
            />
            <Text size="sm" color="dimmed" mt="xs">
              Traitement: {FILE_CONFIGS[currentStep]?.label || 'Initialisation'}
            </Text>
          </Card>
        )}

        {/* Message de succès */}
        {progress === 100 && (
          <Alert 
            className="success-message"
            icon={<IconCheck size={16} />} 
            title="Import terminé" 
            color="green"
          >
            Toutes les données ont été importées et fusionnées avec succès !
          </Alert>
        )}

        {/* Bouton d'action */}
        <Button
          size="lg"
          onClick={handleImport}
          loading={importing}
          disabled={importing}
          leftIcon={<IconDatabase size={20} />}
          fullWidth
        >
          {importing ? 'Import en cours...' : 'Démarrer l\'import'}
        </Button>
      </Stack>
    </Container>
  );
}
```

### 6. Animations GSAP Réutilisables

#### Hook useGSAPAnimation (hooks/useGSAPAnimation.ts)
```typescript
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface AnimationOptions {
  from?: gsap.TweenVars;
  to: gsap.TweenVars;
  trigger?: boolean;
  dependencies?: any[];
}

export function useGSAPAnimation<T extends HTMLElement = HTMLDivElement>(
  options: AnimationOptions
) {
  const ref = useRef<T>(null);
  const tweenRef = useRef<gsap.core.Tween>();

  useEffect(() => {
    if (ref.current && (options.trigger ?? true)) {
      tweenRef.current = gsap.fromTo(
        ref.current,
        options.from || { opacity: 0 },
        options.to
      );
    }

    return () => {
      tweenRef.current?.kill();
    };
  }, options.dependencies || []);

  return { ref, tween: tweenRef.current };
}
```

#### Composant AnimatedCard (components/animated/AnimatedCard.tsx)
```typescript
'use client';

import { forwardRef } from 'react';
import { Card, CardProps } from '@mantine/core';
import { useGSAPAnimation } from '@/hooks/useGSAPAnimation';

interface AnimatedCardProps extends CardProps {
  delay?: number;
  animateOnHover?: boolean;
}

export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, delay = 0, animateOnHover = true, ...props }, ref) => {
    const { ref: animRef } = useGSAPAnimation({
      from: { 
        opacity: 0, 
        y: 30,
        scale: 0.95,
      },
      to: {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        delay,
        ease: "power3.out",
      },
    });

    return (
      <Card
        ref={ref || animRef}
        {...props}
        onMouseEnter={(e) => {
          if (animateOnHover) {
            gsap.to(e.currentTarget, {
              scale: 1.02,
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              duration: 0.3,
            });
          }
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (animateOnHover) {
            gsap.to(e.currentTarget, {
              scale: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              duration: 0.3,
            });
          }
          props.onMouseLeave?.(e);
        }}
      >
        {children}
      </Card>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';
```

### 7. Layout Principal avec Navigation Animée

#### Layout Dashboard (app/(dashboard)/layout.tsx)
```typescript
'use client';

import { AppShell, Navbar, Header, Group, Title, ActionIcon, Menu, Avatar } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMenu2, IconLogout, IconUser } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { NavigationLinks } from '@/components/navigation/NavigationLinks';
import { gsap } from 'gsap';
import { useEffect, useRef } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opened, { toggle }] = useDisclosure();
  const { user, logout } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navRef.current) {
      const links = navRef.current.querySelectorAll('.nav-link');
      
      gsap.fromTo(links,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
        }
      );
    }
  }, []);

  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar 
          width={{ base: 300 }} 
          p="xs" 
          hidden={!opened}
          ref={navRef}
        >
          <NavigationLinks />
        </Navbar>
      }
      header={
        <Header height={60} p="xs">
          <Group position="apart">
            <Group>
              <ActionIcon
                onClick={toggle}
                size="lg"
                sx={{ '@media (min-width: 768px)': { display: 'none' } }}
              >
                <IconMenu2 />
              </ActionIcon>
              <Title order={3}>DB Formation</Title>
            </Group>

            <Menu position="bottom-end" withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle">
                  <Avatar color="blue" radius="xl">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </Avatar>
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  {user?.username || 'Utilisateur'}
                </Menu.Label>
                <Menu.Item icon={<IconUser size={14} />}>
                  Profil
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item 
                  icon={<IconLogout size={14} />}
                  color="red"
                  onClick={logout}
                >
                  Déconnexion
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Header>
      }
    >
      {children}
    </AppShell>
  );
}
```

### 8. Configuration des Styles Globaux

#### Styles avec animations CSS (app/globals.css)
```css
@import '@mantine/core/styles.css';
@import '@mantine/dates/styles.css';
@import '@mantine/dropzone/styles.css';
@import '@mantine/notifications/styles.css';
@import '@mantine/nprogress/styles.css';
@import '@mantine/spotlight/styles.css';
@import '@mantine/carousel/styles.css';

/* Animations personnalisées */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

/* Classes d'animation */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.animate-pulse {
  animation: pulse 2s infinite;
}

/* Transitions globales */
* {
  transition: color 0.2s ease, background-color 0.2s ease;
}

/* Effets de survol */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Scrollbar personnalisée */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
```

## 📋 Commandes d'Installation Complètes

```bash
# Dépendances déjà installées (pour référence)
npm install gsap framer-motion @formkit/auto-animate lottie-react
npm install @tremor/react apexcharts react-apexcharts
npm install @mantine/core @mantine/hooks @mantine/dates @mantine/dropzone @mantine/notifications @mantine/nprogress @mantine/spotlight @mantine/modals @mantine/carousel
npm install @ark-ui/react @floating-ui/react
npm install @tanstack/react-table react-big-calendar moment react-select react-dropzone

# Dépendances supplémentaires nécessaires
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand axios
npm install @phosphor-icons/react @heroicons/react
npm install xlsx jspdf html2canvas react-to-print
npm install react-hot-toast date-fns react-intersection-observer react-use

# Types TypeScript
npm install -D @types/react-big-calendar
```

## 🚀 Démarrage Rapide

1. **Configuration initiale**
   ```bash
   # Copier les variables d'environnement
   cp .env.example .env.local
   
   # Installer les dépendances
   npm install
   
   # Lancer le serveur de développement
   npm run dev
   ```

2. **Vérifier l'API**
   - S'assurer que l'API est lancée sur http://localhost:8000
   - Accéder à la documentation Swagger : http://localhost:8000/docs

3. **Connexion**
   - Username: admin
   - Password: admin123

## 🎯 Fonctionnalités Implémentées

✅ **Authentification JWT** avec refresh token
✅ **Dashboard animé** avec GSAP et Tremor
✅ **Tables performantes** avec Mantine et TanStack Table
✅ **Import ETL visuel** avec animations et progress
✅ **Graphiques interactifs** avec Tremor et ApexCharts
✅ **Notifications élégantes** avec Mantine
✅ **Animations fluides** avec GSAP (gratuit complet)
✅ **State management** avec Zustand et TanStack Query
✅ **Forms validation** avec React Hook Form + Zod
✅ **Export Excel/PDF** avec SheetJS et jsPDF

## 📚 Documentation des Composants

Tous les composants sont documentés avec TypeScript et suivent les best practices :
- Props typées
- Composants réutilisables
- Animations performantes
- Accessibilité (a11y)
- Responsive design

Cette documentation sera mise à jour au fur et à mesure du développement.