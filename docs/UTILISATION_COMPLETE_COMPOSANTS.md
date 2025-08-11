# 📚 Guide d'Utilisation Complète de TOUS les Composants Installés

## ✅ Checklist des Composants et leur Utilisation

### 1. 🎨 **Animations & Interactions**

#### GSAP (gsap) - Animations complexes
```typescript
// components/hero/HeroSection.tsx
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, TextPlugin, SplitText);

export function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      // SplitText pour animation lettre par lettre
      const split = new SplitText(titleRef.current, { 
        type: "chars, words" 
      });

      gsap.from(split.chars, {
        opacity: 0,
        y: 100,
        rotateX: -90,
        stagger: 0.02,
        duration: 1,
        ease: "back.out(1.7)",
      });

      // ScrollTrigger pour animations au scroll
      gsap.to(containerRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top center",
          end: "bottom center",
          scrub: true,
        },
        scale: 1.1,
        opacity: 0.8,
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="hero-section">
      <h1 ref={titleRef}>Système de Gestion des Formations</h1>
    </div>
  );
}
```

#### Framer Motion (framer-motion) - Animations React
```typescript
// components/cards/AnimatedFormationCard.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@mantine/core';

export function AnimatedFormationCard({ formation, index }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100 
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Card>
        <motion.h3
          animate={{ color: ["#000", "#007bff", "#000"] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {formation.title}
        </motion.h3>
      </Card>
    </motion.div>
  );
}
```

#### Auto-Animate (@formkit/auto-animate) - Animations automatiques
```typescript
// components/lists/CollaborateursList.tsx
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { List } from '@mantine/core';

export function CollaborateursList({ collaborateurs }: any) {
  const [parent] = useAutoAnimate({
    duration: 350,
    easing: 'ease-out',
  });

  return (
    <List ref={parent}>
      {collaborateurs.map((collab: any) => (
        <List.Item key={collab.id}>
          {collab.name}
        </List.Item>
      ))}
    </List>
  );
}
```

#### Lottie React (lottie-react) - Animations complexes
```typescript
// components/loaders/ImportLoader.tsx
import Lottie from 'lottie-react';
import uploadAnimation from '@/assets/animations/upload.json';

export function ImportLoader() {
  return (
    <Lottie 
      animationData={uploadAnimation}
      loop={true}
      style={{ width: 200, height: 200 }}
      onComplete={() => console.log('Animation terminée')}
    />
  );
}
```

### 2. 🎯 **UI Components (Mantine)**

#### Mantine Core (@mantine/core)
```typescript
// components/layout/AppLayout.tsx
import { 
  AppShell, 
  Navbar, 
  Header, 
  Footer, 
  Aside, 
  MediaQuery,
  Burger,
  useMantineTheme,
  Stack,
  Group,
  Button,
  TextInput,
  NumberInput,
  Select,
  MultiSelect,
  Checkbox,
  Radio,
  Switch,
  Slider,
  RangeSlider,
  SegmentedControl,
  Tabs,
  Stepper,
  Timeline,
  Accordion,
  Spoiler,
  Modal,
  Drawer,
  Popover,
  Tooltip,
  HoverCard,
  Menu,
  Divider,
  Space,
  Paper,
  Container,
  Grid,
  SimpleGrid,
  Card,
  Image,
  BackgroundImage,
  Overlay,
  AspectRatio,
  Badge,
  Avatar,
  Indicator,
  Progress,
  RingProgress,
  Loader,
  Skeleton,
  Alert,
  Notification,
  Title,
  Text,
  Anchor,
  Breadcrumbs,
  Pagination,
  Chips,
  Code,
  Kbd,
  Blockquote,
  List,
  Table,
  ScrollArea,
  Affix,
  Transition,
  Portal,
  Box,
  Center,
  Flex
} from '@mantine/core';

// Utilisation de TOUS les composants Mantine
export function CompleteShowcase() {
  return (
    <AppShell
      navbar={<Navbar width={{ base: 300 }}>Navigation</Navbar>}
      header={<Header height={60}>Header</Header>}
      footer={<Footer height={60}>Footer</Footer>}
      aside={<Aside width={{ base: 200 }}>Aside</Aside>}
    >
      <Container>
        <Stack spacing="xl">
          {/* Inputs */}
          <TextInput label="Nom" placeholder="Entrez le nom" />
          <NumberInput label="Âge" />
          <Select label="Formation" data={['React', 'Vue', 'Angular']} />
          <MultiSelect label="Compétences" data={['JS', 'TS', 'Python']} />
          
          {/* Controls */}
          <Switch label="Actif" />
          <Checkbox label="J'accepte" />
          <Radio.Group>
            <Radio value="1" label="Option 1" />
            <Radio value="2" label="Option 2" />
          </Radio.Group>
          
          {/* Navigation */}
          <Tabs defaultValue="first">
            <Tabs.List>
              <Tabs.Tab value="first">Premier</Tabs.Tab>
              <Tabs.Tab value="second">Second</Tabs.Tab>
            </Tabs.List>
          </Tabs>
          
          {/* Feedback */}
          <Alert title="Information">Message d'alerte</Alert>
          <Progress value={50} />
          <RingProgress
            sections={[
              { value: 40, color: 'cyan' },
              { value: 60, color: 'orange' }
            ]}
          />
          
          {/* Data Display */}
          <Timeline>
            <Timeline.Item title="Étape 1">Description</Timeline.Item>
            <Timeline.Item title="Étape 2">Description</Timeline.Item>
          </Timeline>
          
          <Table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>John Doe</td>
                <td>john@example.com</td>
              </tr>
            </tbody>
          </Table>
        </Stack>
      </Container>
    </AppShell>
  );
}
```

#### Mantine Dates (@mantine/dates)
```typescript
// components/forms/SessionForm.tsx
import { useState } from 'react';
import { 
  DatePicker, 
  DateRangePicker, 
  DateTimePicker,
  MonthPicker,
  YearPicker,
  Calendar,
  TimeInput,
  DateInput,
  MonthPickerInput,
  YearPickerInput
} from '@mantine/dates';
import 'dayjs/locale/fr';

export function SessionForm() {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [sessionDate, setSessionDate] = useState<Date | null>(null);

  return (
    <Stack>
      <DatePicker 
        label="Date de session"
        locale="fr"
        value={sessionDate}
        onChange={setSessionDate}
      />
      
      <DateRangePicker
        label="Période de formation"
        value={dateRange}
        onChange={setDateRange}
      />
      
      <DateTimePicker
        label="Date et heure de début"
        placeholder="Sélectionnez date et heure"
      />
      
      <Calendar
        fullWidth
        size="xl"
        styles={{
          cell: {
            border: '1px solid #e0e0e0',
          },
        }}
      />
      
      <TimeInput label="Heure de début" />
    </Stack>
  );
}
```

#### Mantine Dropzone (@mantine/dropzone)
```typescript
// components/import/ExcelDropzone.tsx
import { Group, Text, useMantineTheme, rem } from '@mantine/core';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';
import { Dropzone, DropzoneProps, MIME_TYPES } from '@mantine/dropzone';

export function ExcelDropzone(props: Partial<DropzoneProps>) {
  const theme = useMantineTheme();
  
  return (
    <Dropzone
      onDrop={(files) => console.log('accepted files', files)}
      onReject={(files) => console.log('rejected files', files)}
      maxSize={10 * 1024 ** 2} // 10MB
      accept={[MIME_TYPES.xlsx, MIME_TYPES.xls, MIME_TYPES.csv]}
      {...props}
    >
      <Group position="center" spacing="xl" style={{ minHeight: rem(220) }}>
        <Dropzone.Accept>
          <IconUpload size="3.2rem" stroke={1.5} />
        </Dropzone.Accept>
        <Dropzone.Reject>
          <IconX size="3.2rem" stroke={1.5} />
        </Dropzone.Reject>
        <Dropzone.Idle>
          <IconPhoto size="3.2rem" stroke={1.5} />
        </Dropzone.Idle>

        <div>
          <Text size="xl" inline>
            Glissez vos fichiers Excel ici
          </Text>
          <Text size="sm" color="dimmed" inline mt={7}>
            Fichiers acceptés: .xlsx, .xls, .csv (max 10MB)
          </Text>
        </div>
      </Group>
    </Dropzone>
  );
}
```

#### Mantine Notifications (@mantine/notifications)
```typescript
// utils/notifications.ts
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconInfoCircle } from '@tabler/icons-react';

export const notify = {
  success: (message: string) => {
    notifications.show({
      title: 'Succès',
      message,
      color: 'green',
      icon: <IconCheck />,
      autoClose: 5000,
    });
  },
  
  error: (message: string) => {
    notifications.show({
      title: 'Erreur',
      message,
      color: 'red',
      icon: <IconX />,
      autoClose: false,
    });
  },
  
  info: (message: string) => {
    notifications.show({
      title: 'Information',
      message,
      color: 'blue',
      icon: <IconInfoCircle />,
    });
  },
  
  loading: (message: string) => {
    return notifications.show({
      loading: true,
      title: 'Chargement',
      message,
      autoClose: false,
      withCloseButton: false,
    });
  },
  
  update: (id: string, props: any) => {
    notifications.update({ id, ...props });
  }
};
```

#### Mantine Modals (@mantine/modals)
```typescript
// components/modals/FormationModal.tsx
import { modals } from '@mantine/modals';
import { Button, TextInput, Textarea, Select } from '@mantine/core';

export function openFormationModal() {
  modals.open({
    title: 'Créer une formation',
    size: 'lg',
    children: (
      <form onSubmit={(e) => {
        e.preventDefault();
        // Logique de soumission
        modals.closeAll();
      }}>
        <TextInput label="Titre" required />
        <Select 
          label="Type"
          data={['Interne', 'Externe', 'E-learning']}
          required
        />
        <Textarea label="Description" rows={4} />
        <Button type="submit" mt="md">Créer</Button>
      </form>
    ),
  });
}

// Modal de confirmation
export function confirmDelete(onConfirm: () => void) {
  modals.openConfirmModal({
    title: 'Confirmer la suppression',
    children: (
      <Text size="sm">
        Cette action est irréversible. Êtes-vous sûr ?
      </Text>
    ),
    labels: { confirm: 'Supprimer', cancel: 'Annuler' },
    confirmProps: { color: 'red' },
    onConfirm,
  });
}
```

#### Mantine Spotlight (@mantine/spotlight)
```typescript
// components/search/GlobalSearch.tsx
import { useState } from 'react';
import { SpotlightProvider, openSpotlight, spotlight } from '@mantine/spotlight';
import { IconSearch, IconHome, IconDashboard, IconFileText } from '@tabler/icons-react';

const actions = [
  {
    title: 'Accueil',
    description: 'Retour à l\'accueil',
    onTrigger: () => console.log('Home'),
    icon: <IconHome size="1.2rem" />,
  },
  {
    title: 'Dashboard',
    description: 'Voir le tableau de bord',
    onTrigger: () => console.log('Dashboard'),
    icon: <IconDashboard size="1.2rem" />,
  },
  {
    title: 'Formations',
    description: 'Gérer les formations',
    onTrigger: () => console.log('Formations'),
    icon: <IconFileText size="1.2rem" />,
  },
];

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  return (
    <SpotlightProvider
      actions={actions}
      searchIcon={<IconSearch size="1.2rem" />}
      searchPlaceholder="Rechercher..."
      shortcut="mod + k"
      nothingFoundMessage="Aucun résultat"
    >
      {children}
    </SpotlightProvider>
  );
}

// Utilisation
<Button onClick={() => openSpotlight()}>Recherche (Cmd+K)</Button>
```

#### Mantine NProgress (@mantine/nprogress)
```typescript
// app/layout.tsx
import { NavigationProgress, nprogress } from '@mantine/nprogress';

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <NavigationProgress color="blue" size={3} />
        {children}
      </body>
    </html>
  );
}

// Utilisation manuelle
import { nprogress } from '@mantine/nprogress';

// Démarrer
nprogress.start();

// Incrémenter
nprogress.increment();

// Terminer
nprogress.complete();
```

#### Mantine Carousel (@mantine/carousel)
```typescript
// components/carousel/FormationsCarousel.tsx
import { Carousel } from '@mantine/carousel';
import { Card, Image, Text } from '@mantine/core';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';

export function FormationsCarousel({ formations }: any) {
  const autoplay = useRef(Autoplay({ delay: 3000 }));

  return (
    <Carousel
      withIndicators
      height={400}
      slideSize="33.333333%"
      slideGap="md"
      loop
      align="start"
      slidesToScroll={1}
      plugins={[autoplay.current]}
      onMouseEnter={autoplay.current.stop}
      onMouseLeave={autoplay.current.reset}
    >
      {formations.map((formation: any) => (
        <Carousel.Slide key={formation.id}>
          <Card>
            <Card.Section>
              <Image src={formation.image} height={200} />
            </Card.Section>
            <Text weight={500} mt="md">{formation.title}</Text>
            <Text size="sm" color="dimmed">{formation.description}</Text>
          </Card>
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}
```

### 3. 📊 **Visualisation de Données**

#### Tremor (@tremor/react)
```typescript
// components/dashboard/KPIDashboard.tsx
import {
  Card,
  Title,
  Text,
  Grid,
  Flex,
  Metric,
  ProgressBar,
  AreaChart,
  BarChart,
  DonutChart,
  LineChart,
  ScatterChart,
  BarList,
  CategoryBar,
  DeltaBar,
  MarkerBar,
  MultiSelect,
  DateRangePicker,
  SearchSelect,
  Select,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Badge,
  Button,
  Callout,
  Subtitle,
  Bold,
  Italic,
  Divider,
  Toggle,
  ToggleItem,
  NumberInput as TremorNumberInput,
  TextInput as TremorTextInput,
  DatePicker as TremorDatePicker,
} from '@tremor/react';

export function KPIDashboard({ data }: any) {
  return (
    <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
      <Card>
        <Title>Total Formations</Title>
        <Metric>{data.totalFormations}</Metric>
        <Flex className="mt-4">
          <Text>32% du target</Text>
          <Text>100 formations</Text>
        </Flex>
        <ProgressBar value={32} className="mt-2" />
      </Card>

      <Card>
        <Title>Évolution mensuelle</Title>
        <AreaChart
          className="h-72 mt-4"
          data={data.monthlyData}
          index="month"
          categories={["Formations", "Participants"]}
          colors={["indigo", "cyan"]}
          valueFormatter={(value) => `${value}`}
        />
      </Card>

      <Card>
        <Title>Répartition par type</Title>
        <DonutChart
          className="mt-6"
          data={data.typeDistribution}
          category="count"
          index="type"
          valueFormatter={(value) => `${value} formations`}
          colors={["slate", "violet", "indigo", "rose", "cyan", "amber"]}
        />
      </Card>

      <Card className="col-span-full">
        <Title>Top Formations</Title>
        <BarList
          data={data.topFormations}
          className="mt-2"
        />
      </Card>
    </Grid>
  );
}
```

#### ApexCharts (apexcharts & react-apexcharts)
```typescript
// components/charts/FormationTimeline.tsx
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

export function FormationTimeline({ sessions }: any) {
  const options: ApexOptions = {
    chart: {
      type: 'rangeBar',
      height: 450,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '80%'
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        format: 'dd MMM'
      }
    },
    yaxis: {
      show: true
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [50, 0, 100, 100]
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left'
    }
  };

  const series = [
    {
      name: 'Formations',
      data: sessions.map((s: any) => ({
        x: s.formation,
        y: [
          new Date(s.startDate).getTime(),
          new Date(s.endDate).getTime()
        ]
      }))
    }
  ];

  return (
    <ReactApexChart 
      options={options} 
      series={series} 
      type="rangeBar" 
      height={450} 
    />
  );
}
```

#### Recharts (recharts)
```typescript
// components/charts/ParticipationChart.tsx
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart,
  RadialBarChart,
  RadialBar,
  Treemap,
  Funnel,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

export function ParticipationChart({ data }: any) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Line Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="participants" 
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
          <Line 
            type="monotone" 
            dataKey="formations" 
            stroke="#82ca9d" 
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => `${entry.name}: ${entry.value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      {/* Composed Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid stroke="#f5f5f5" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="formations" barSize={20} fill="#413ea0" />
          <Line type="monotone" dataKey="satisfaction" stroke="#ff7300" />
          <Area type="monotone" dataKey="budget" fill="#8884d8" stroke="#8884d8" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Radar Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="competence" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar 
            name="Avant" 
            dataKey="before" 
            stroke="#8884d8" 
            fill="#8884d8" 
            fillOpacity={0.6} 
          />
          <Radar 
            name="Après" 
            dataKey="after" 
            stroke="#82ca9d" 
            fill="#82ca9d" 
            fillOpacity={0.6} 
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 4. 📅 **Calendrier et Planning**

#### React Big Calendar (react-big-calendar & moment)
```typescript
// components/calendar/SessionCalendar.tsx
import { Calendar, momentLocalizer, View, Views } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';

moment.locale('fr');
const localizer = momentLocalizer(moment);

interface SessionEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: {
    formateur: string;
    salle: string;
    participants: number;
  };
}

export function SessionCalendar({ sessions }: { sessions: SessionEvent[] }) {
  return (
    <Calendar
      localizer={localizer}
      events={sessions}
      startAccessor="start"
      endAccessor="end"
      style={{ height: 600 }}
      views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
      defaultView={Views.MONTH}
      messages={{
        next: "Suivant",
        previous: "Précédent",
        today: "Aujourd'hui",
        month: "Mois",
        week: "Semaine",
        day: "Jour",
        agenda: "Agenda",
        date: "Date",
        time: "Heure",
        event: "Session",
        noEventsInRange: "Aucune session dans cette période",
      }}
      eventPropGetter={(event) => ({
        style: {
          backgroundColor: event.resource.participants > 10 ? '#3174ad' : '#f50057',
        },
      })}
      onSelectEvent={(event) => console.log('Session sélectionnée:', event)}
      onSelectSlot={(slotInfo) => console.log('Créer session:', slotInfo)}
      selectable
    />
  );
}
```

### 5. 🗃️ **Tables et Données**

#### TanStack Table (@tanstack/react-table)
```typescript
// components/tables/AdvancedFormationTable.tsx
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  RowSelectionState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  GroupingState,
  ExpandedState,
} from '@tanstack/react-table';
import { useState } from 'react';

export function AdvancedFormationTable({ data }: any) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const columns: ColumnDef<any>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    {
      accessorKey: 'title',
      header: 'Formation',
      cell: ({ row, getValue }) => (
        <div style={{ paddingLeft: `${row.depth * 2}rem` }}>
          {row.getCanExpand() && (
            <button onClick={row.getToggleExpandedHandler()}>
              {row.getIsExpanded() ? '👇' : '👉'}
            </button>
          )}
          {getValue()}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      enableGrouping: true,
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ getValue }) => (
        <Badge color={getValue() === 'Active' ? 'green' : 'red'}>
          {getValue()}
        </Badge>
      ),
    },
    {
      accessorKey: 'participants',
      header: 'Participants',
      aggregationFn: 'sum',
      AggregatedCell: ({ getValue }) => `Total: ${getValue()}`,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      grouping,
      expanded,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <>
      {/* Contrôles de la table */}
      <div className="flex gap-2 mb-4">
        <Button onClick={() => table.setPageSize(10)}>10</Button>
        <Button onClick={() => table.setPageSize(20)}>20</Button>
        <Button onClick={() => table.setPageSize(50)}>50</Button>
      </div>

      {/* Table */}
      <Table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <button onClick={header.column.getToggleSortingHandler()}>
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? ' ↕️'}
                        </button>
                      )}
                      {header.column.getCanGroup() && (
                        <button onClick={header.column.getToggleGroupingHandler()}>
                          {header.column.getIsGrouped() ? '🛑' : '👊'}
                        </button>
                      )}
                    </div>
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
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center gap-2 mt-4">
        <Button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Précédent
        </Button>
        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Suivant
        </Button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} sur{' '}
          {table.getPageCount()}
        </span>
      </div>
    </>
  );
}
```

### 6. 📁 **Export et Import de Fichiers**

#### ExcelJS (exceljs) - Remplace XLSX
```typescript
// services/excel.service.ts
import ExcelJS from 'exceljs';

export class ExcelService {
  // Export vers Excel avec style
  static async exportToExcel(data: any[], filename: string) {
    const workbook = new ExcelJS.Workbook();
    
    // Métadonnées
    workbook.creator = 'DB Formation';
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet('Formations', {
      properties: { tabColor: { argb: 'FF00FF00' } },
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // En-têtes avec style
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Formation', key: 'title', width: 30 },
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Durée (h)', key: 'duration', width: 12 },
      { header: 'Statut', key: 'status', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
    ];

    // Style des en-têtes
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0066CC' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Ajouter les données
    data.forEach((item, index) => {
      const row = worksheet.addRow(item);
      
      // Alternance de couleurs
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' }
          };
        });
      }
    });

    // Bordures
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Formules
    const lastRow = worksheet.rowCount;
    worksheet.getCell(`D${lastRow + 2}`).value = { 
      formula: `SUM(D2:D${lastRow})` 
    };
    worksheet.getCell(`C${lastRow + 2}`).value = 'Total heures:';

    // Graphique
    worksheet.addImage({
      base64: 'logo_base64_here',
      tl: { col: 7, row: 1 },
      ext: { width: 200, height: 100 }
    });

    // Validation de données
    worksheet.getCell('C2').dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Interne,Externe,E-learning"']
    };

    // Protection
    worksheet.protect('password', {
      selectLockedCells: true,
      selectUnlockedCells: true,
    });

    // Télécharger
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.xlsx`;
    a.click();
  }

  // Import depuis Excel
  static async importFromExcel(file: File): Promise<any[]> {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet(1);
    const data: any[] = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        data.push({
          id: row.getCell(1).value,
          title: row.getCell(2).value,
          type: row.getCell(3).value,
          duration: row.getCell(4).value,
          status: row.getCell(5).value,
          date: row.getCell(6).value,
        });
      }
    });
    
    return data;
  }
}
```

#### jsPDF (jspdf) & html2canvas
```typescript
// services/pdf.service.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';

export class PDFService {
  // Export simple
  static generatePDF(title: string, content: any[]) {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    // Table avec autoTable
    autoTable(doc, {
      head: [['ID', 'Formation', 'Type', 'Durée', 'Statut']],
      body: content.map(item => [
        item.id,
        item.title,
        item.type,
        `${item.duration}h`,
        item.status
      ]),
      startY: 30,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [0, 102, 204],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`${title}.pdf`);
  }

  // Export d'un élément HTML vers PDF
  static async exportHTMLToPDF(elementId: string, filename: string) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);
  }
}
```

#### React to Print (react-to-print)
```typescript
// components/print/PrintableReport.tsx
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@mantine/core';

export function PrintableReport({ data }: any) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'Rapport Formation',
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `,
    onBeforeGetContent: async () => {
      // Préparation avant impression
      console.log('Préparation du document...');
    },
    onAfterPrint: () => {
      console.log('Impression terminée');
    },
  });

  return (
    <>
      <Button onClick={handlePrint}>Imprimer le rapport</Button>
      
      <div ref={componentRef} className="p-8">
        <h1 className="text-2xl font-bold mb-4">Rapport de Formation</h1>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="border p-2">Formation</th>
              <th className="border p-2">Participants</th>
              <th className="border p-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item: any) => (
              <tr key={item.id}>
                <td className="border p-2">{item.title}</td>
                <td className="border p-2">{item.participants}</td>
                <td className="border p-2">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
```

### 7. 🎨 **Composants UI Avancés**

#### React Select (react-select)
```typescript
// components/selects/FormationSelect.tsx
import Select, { 
  components, 
  MultiValue, 
  StylesConfig,
  GroupBase,
  OptionProps,
  SingleValue
} from 'react-select';
import AsyncSelect from 'react-select/async';
import CreatableSelect from 'react-select/creatable';

interface FormationOption {
  value: string;
  label: string;
  type: string;
  duration: number;
}

export function FormationSelects() {
  // Custom styles
  const customStyles: StylesConfig<FormationOption> = {
    control: (styles) => ({
      ...styles,
      backgroundColor: 'white',
      borderColor: '#e2e8f0',
      '&:hover': {
        borderColor: '#3182ce'
      }
    }),
    option: (styles, { isDisabled, isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
        ? '#3182ce'
        : isFocused
        ? '#e6f2ff'
        : undefined,
    }),
  };

  // Custom Option Component
  const CustomOption = (props: OptionProps<FormationOption>) => (
    <components.Option {...props}>
      <div className="flex justify-between">
        <span>{props.data.label}</span>
        <span className="text-sm text-gray-500">
          {props.data.duration}h - {props.data.type}
        </span>
      </div>
    </components.Option>
  );

  // Async load options
  const loadOptions = async (inputValue: string) => {
    const response = await fetch(`/api/formations?search=${inputValue}`);
    const data = await response.json();
    return data.map((f: any) => ({
      value: f.id,
      label: f.title,
      type: f.type,
      duration: f.duration
    }));
  };

  return (
    <div className="space-y-4">
      {/* Select simple */}
      <Select
        options={formations}
        placeholder="Sélectionnez une formation"
        styles={customStyles}
        components={{ Option: CustomOption }}
        isClearable
        isSearchable
      />

      {/* Multi-select */}
      <Select
        isMulti
        options={formations}
        placeholder="Sélectionnez plusieurs formations"
        closeMenuOnSelect={false}
      />

      {/* Async Select */}
      <AsyncSelect
        cacheOptions
        loadOptions={loadOptions}
        defaultOptions
        placeholder="Rechercher une formation..."
      />

      {/* Creatable Select */}
      <CreatableSelect
        options={formations}
        placeholder="Créer ou sélectionner"
        formatCreateLabel={(inputValue) => `Créer "${inputValue}"`}
      />
    </div>
  );
}
```

#### React Dropzone (react-dropzone)
```typescript
// components/upload/AdvancedDropzone.tsx
import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { IconUpload, IconX, IconFile } from '@tabler/icons-react';

export function AdvancedDropzone() {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Traiter les fichiers acceptés
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        console.log('Fichier lu:', file.name);
      };
      reader.readAsArrayBuffer(file);
    });

    // Gérer les rejets
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach(error => {
        console.error(`${file.name}: ${error.message}`);
      });
    });
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    acceptedFiles,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxSize: 10485760, // 10MB
    maxFiles: 5,
    validator: (file) => {
      if (file.name.length > 100) {
        return {
          code: 'name-too-long',
          message: 'Le nom du fichier est trop long'
        };
      }
      return null;
    }
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${isDragAccept ? 'border-green-500 bg-green-50' : ''}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isDragActive ? (
          <p>Déposez les fichiers ici...</p>
        ) : (
          <div>
            <IconUpload size={48} className="mx-auto mb-4 text-gray-400" />
            <p>Glissez-déposez des fichiers Excel ici</p>
            <p className="text-sm text-gray-500 mt-2">
              ou cliquez pour sélectionner
            </p>
          </div>
        )}
      </div>

      {/* Fichiers acceptés */}
      {acceptedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold">Fichiers acceptés:</h4>
          <ul className="mt-2 space-y-1">
            {acceptedFiles.map((file, index) => (
              <li key={index} className="flex items-center gap-2">
                <IconFile size={16} />
                <span>{file.name}</span>
                <span className="text-sm text-gray-500">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fichiers rejetés */}
      {fileRejections.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-red-600">Fichiers rejetés:</h4>
          <ul className="mt-2 space-y-1">
            {fileRejections.map(({ file, errors }, index) => (
              <li key={index} className="text-red-600">
                <div className="flex items-center gap-2">
                  <IconX size={16} />
                  <span>{file.name}</span>
                </div>
                <ul className="ml-6 text-sm">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error.message}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 8. 🛠️ **Utilitaires et Hooks**

#### React Use (react-use) - Collection de hooks
```typescript
// components/examples/ReactUseExamples.tsx
import {
  useAsync,
  useAsyncFn,
  useAsyncRetry,
  useDebounce,
  useThrottle,
  useThrottleFn,
  useMount,
  useUnmount,
  useUpdateEffect,
  useIsomorphicLayoutEffect,
  useInterval,
  useTimeout,
  useTimeoutFn,
  usePrevious,
  useLatest,
  useFirstMountState,
  useRendersCount,
  useToggle,
  useBoolean,
  useCounter,
  useNumber,
  useList,
  useUpsert,
  useMap,
  useSet,
  useQueue,
  useStateValidator,
  useStateWithHistory,
  useMultiStateValidator,
  useMediatedState,
  useLocalStorage,
  useSessionStorage,
  useCookie,
  useHover,
  useHoverDirty,
  useMouse,
  useMouseHovered,
  useMouseWheel,
  useScroll,
  useScrolling,
  useStartTyping,
  useWindowScroll,
  useWindowSize,
  useMeasure,
  useSize,
  useIntersection,
  useKey,
  useKeyPress,
  useKeyPressEvent,
  useKeyboardJs,
  useLocation,
  useSearchParam,
  useNavigatorLanguage,
  useBattery,
  useNetworkState,
  useDocumentVisibility,
  usePermission,
  useOrientation,
  useMotion,
  useClickAway,
  usePageLeave,
  useLongPress,
  useMedia,
  useMediaDevices,
  useSpeech,
  useVibrate,
  useVideo,
  useAudio,
  useRaf,
  useRafLoop,
  useUpdate,
  useEffectOnce,
  useEvent,
  useLifecycles,
  useTween,
  useSpring,
  useCopyToClipboard,
  useError,
  useFavicon,
  useTitle,
  useLockBodyScroll,
  useRafState,
  useSetState,
  useGetSet,
  useObservable,
  useAsyncQueue,
  useDeepCompareEffect,
  useShallowCompareEffect,
  useCustomCompareEffect,
} from 'react-use';

export function ReactUseShowcase() {
  // Gestion d'état
  const [enabled, toggleEnabled] = useToggle(false);
  const { value: count, inc, dec, reset } = useCounter(0);
  const [list, { push, removeAt, insertAt, updateAt, clear }] = useList([1, 2, 3]);
  
  // Effets et timing
  useInterval(() => {
    console.log('Tick every second');
  }, 1000);
  
  useTimeout(() => {
    console.log('Timeout après 5 secondes');
  }, 5000);
  
  // Debounce et throttle
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  
  // Local Storage
  const [user, setUser] = useLocalStorage('user', { name: 'John' });
  
  // Window et navigation
  const { width, height } = useWindowSize();
  const { x, y } = useWindowScroll();
  const location = useLocation();
  
  // Média
  const isWideScreen = useMedia('(min-width: 1024px)', false);
  const prefersReducedMotion = useMedia('(prefers-reduced-motion: reduce)', false);
  
  // Clavier et souris
  const isShiftPressed = useKeyPress('Shift');
  const { docX, docY } = useMouse();
  const [hoverRef, isHovered] = useHover<HTMLDivElement>();
  
  // Réseau et batterie
  const networkState = useNetworkState();
  const batteryState = useBattery();
  
  // Copier dans le presse-papier
  const [copiedText, copyToClipboard] = useCopyToClipboard();
  
  // Async
  const { loading, error, value } = useAsync(async () => {
    const response = await fetch('/api/data');
    return response.json();
  });

  return (
    <div>
      <h2>React Use Examples</h2>
      
      {/* Toggle */}
      <Button onClick={toggleEnabled}>
        {enabled ? 'Désactiver' : 'Activer'}
      </Button>
      
      {/* Counter */}
      <Group>
        <Button onClick={() => dec()}>-</Button>
        <Text>{count}</Text>
        <Button onClick={() => inc()}>+</Button>
        <Button onClick={reset}>Reset</Button>
      </Group>
      
      {/* List */}
      <div>
        {list.map((item, i) => (
          <div key={i}>
            {item}
            <Button onClick={() => removeAt(i)}>Remove</Button>
          </div>
        ))}
        <Button onClick={() => push(Date.now())}>Add</Button>
      </div>
      
      {/* Window info */}
      <Text>
        Window: {width} x {height}, Scroll: ({x}, {y})
      </Text>
      
      {/* Network */}
      <Badge color={networkState.online ? 'green' : 'red'}>
        {networkState.online ? 'En ligne' : 'Hors ligne'}
      </Badge>
      
      {/* Hover */}
      <div ref={hoverRef} className="p-4 border">
        {isHovered ? 'Survolé!' : 'Survolez-moi'}
      </div>
      
      {/* Copy */}
      <Button onClick={() => copyToClipboard('Texte copié!')}>
        Copier
      </Button>
      {copiedText && <Text>Copié: {copiedText}</Text>}
    </div>
  );
}
```

#### React Intersection Observer (react-intersection-observer)
```typescript
// components/scroll/LazySection.tsx
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';

export function LazySection({ children }: { children: React.ReactNode }) {
  const { ref, inView, entry } = useInView({
    threshold: 0.1,
    triggerOnce: true,
    rootMargin: '50px 0px',
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      {inView ? children : <Skeleton height={200} />}
    </motion.div>
  );
}

// Infinite scroll
export function InfiniteList() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  
  const { ref, inView } = useInView({
    threshold: 0,
  });

  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView]);

  const loadMore = async () => {
    const newItems = await fetchItems(page);
    setItems([...items, ...newItems]);
    setPage(page + 1);
  };

  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>{item.name}</div>
      ))}
      <div ref={ref} style={{ height: 20 }}>
        {inView && <Loader />}
      </div>
    </div>
  );
}
```

### 9. 🎨 **Composants UI Radix**

Tous les composants Radix UI sont déjà utilisés via shadcn/ui, mais voici des utilisations avancées :

```typescript
// components/ui/advanced-dialog.tsx
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';

export function AdvancedDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Ouvrir</Button>
      </Dialog.Trigger>
      
      <AnimatePresence>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div
              className="fixed inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </Dialog.Overlay>
          
          <Dialog.Content asChild>
            <motion.div
              className="fixed top-1/2 left-1/2 bg-white p-6 rounded-lg"
              initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Dialog.Title>Titre</Dialog.Title>
              <Dialog.Description>Description</Dialog.Description>
              <Dialog.Close asChild>
                <Button>Fermer</Button>
              </Dialog.Close>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </AnimatePresence>
    </Dialog.Root>
  );
}
```

### 10. 🎯 **Icônes**

#### Phosphor Icons (@phosphor-icons/react)
```typescript
// components/icons/IconShowcase.tsx
import * as Icons from '@phosphor-icons/react';

export function IconShowcase() {
  return (
    <div className="grid grid-cols-6 gap-4">
      <Icons.House size={32} weight="duotone" color="#3b82f6" />
      <Icons.User size={32} weight="fill" />
      <Icons.Calendar size={32} weight="light" />
      <Icons.ChartBar size={32} weight="bold" />
      <Icons.Download size={32} weight="regular" />
      <Icons.Upload size={32} weight="thin" />
      
      {/* Animated icon */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Icons.Gear size={32} />
      </motion.div>
    </div>
  );
}
```

## 📋 Checklist Finale

✅ **Animations**
- [x] GSAP (avec tous les plugins gratuits)
- [x] Framer Motion
- [x] Auto-Animate
- [x] Lottie React

✅ **UI Components**
- [x] Mantine (tous les modules)
- [x] Shadcn/ui (via Radix UI)
- [x] Tremor
- [x] Ark UI
- [x] Floating UI

✅ **Data Visualization**
- [x] ApexCharts
- [x] Recharts
- [x] Tremor Charts

✅ **Tables & Forms**
- [x] TanStack Table
- [x] React Hook Form
- [x] React Select
- [x] React Dropzone

✅ **Calendar**
- [x] React Big Calendar
- [x] Mantine Dates

✅ **State & Data**
- [x] TanStack Query
- [x] Zustand
- [x] Axios

✅ **Utils**
- [x] date-fns
- [x] React Use
- [x] React Intersection Observer

✅ **Export**
- [x] ExcelJS (remplace XLSX)
- [x] jsPDF
- [x] html2canvas
- [x] React to Print

✅ **Autres**
- [x] Phosphor Icons
- [x] Lucide React
- [x] Sonner
- [x] Next Themes
- [x] Embla Carousel
- [x] Vaul
- [x] Input OTP
- [x] CMDK

## 🚀 Conseil d'utilisation

Pour un frontend vraiment impressionnant, combinez :
1. **GSAP** pour les animations de landing page
2. **Framer Motion** pour les micro-interactions
3. **Mantine** comme système de design principal
4. **Tremor** pour tous les dashboards
5. **TanStack Query** pour la gestion des données
6. **ExcelJS** pour les exports/imports Excel avancés

Cette combinaison vous donnera un frontend moderne, performant et visuellement spectaculaire !