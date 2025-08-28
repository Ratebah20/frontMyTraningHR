'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Badge,
  Group,
  Stack,
  SimpleGrid,
  Paper,
  ActionIcon,
  Button,
  Modal,
  ScrollArea,
  Avatar,
  Tooltip,
  Center,
  Select,
  Grid,
  ThemeIcon,
  Tabs,
  Loader
} from '@mantine/core';
import { 
  CaretLeft, 
  CaretRight,
  Calendar as CalendarIcon,
  Users,
  MapPin,
  Clock,
  Warning,
  ArrowLeft,
  User,
  Buildings,
} from '@phosphor-icons/react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, parseISO, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { sessionsService } from '@/lib/services';
import { SessionFormationResponse } from '@/lib/types';
import { notifications } from '@mantine/notifications';

export default function SessionsCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<SessionFormationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<SessionFormationResponse[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Calculer les dates de début et fin du mois avec semaines complètes
  const dateRange = useMemo(() => {
    return {
      start: startOfWeek(startOfMonth(currentDate), { locale: fr }),
      end: endOfWeek(endOfMonth(currentDate), { locale: fr })
    };
  }, [currentDate]);

  // Charger les sessions pour la période affichée
  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await sessionsService.getPlanning({
        dateDebut: format(dateRange.start, 'yyyy-MM-dd'),
        dateFin: format(dateRange.end, 'yyyy-MM-dd'),
        limit: 2000,
      });
      
      if (response && response.data) {
        // Filtrer uniquement les sessions actives
        const activeSessions = response.data.filter(s => {
          const status = s.statut?.toLowerCase();
          return status === 'inscrit' || status === 'en_cours' || status === 'complete' || status === 'termine' || status === 'terminé';
        });
        setSessions(activeSessions);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sessions:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Impossible de charger les sessions',
        color: 'red',
        icon: <Warning size={20} />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [dateRange]);

  // Générer les jours à afficher
  const days = useMemo(() => {
    return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
  }, [dateRange]);

  // Grouper les sessions par jour
  const sessionsByDay = useMemo(() => {
    const grouped: Record<string, SessionFormationResponse[]> = {};
    
    sessions.forEach(session => {
      if (session.dateDebut) {
        const startDate = parseISO(session.dateDebut.toString());
        const endDate = session.dateFin ? parseISO(session.dateFin.toString()) : startDate;
        
        // Ajouter la session pour chaque jour de la formation
        let currentDay = new Date(startDate);
        while (currentDay <= endDate) {
          const dateKey = format(currentDay, 'yyyy-MM-dd');
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }
          // Éviter les doublons
          if (!grouped[dateKey].find(s => s.id === session.id)) {
            grouped[dateKey].push(session);
          }
          currentDay.setDate(currentDay.getDate() + 1);
        }
      }
    });
    
    return grouped;
  }, [sessions]);

  // Obtenir la liste des départements uniques
  const departments = useMemo(() => {
    const deptSet = new Set<string>();
    sessions.forEach(session => {
      if (session.collaborateur?.departement) {
        deptSet.add(session.collaborateur.departement);
      }
    });
    return Array.from(deptSet).sort();
  }, [sessions]);

  // Calculer les statistiques du mois
  const monthStats = useMemo(() => {
    const startMonth = startOfMonth(currentDate);
    const endMonth = endOfMonth(currentDate);
    
    // Compter les sessions qui ont lieu dans le mois courant
    const sessionsInMonth = sessions.filter(session => {
      if (session.dateDebut) {
        const sessionDate = parseISO(session.dateDebut.toString());
        return sessionDate >= startMonth && sessionDate <= endMonth;
      }
      return false;
    });
    
    // Compter les collaborateurs uniques en formation ce mois
    const uniqueCollaborateurs = new Set();
    sessionsInMonth.forEach(session => {
      if (session.collaborateur?.id) {
        uniqueCollaborateurs.add(session.collaborateur.id);
      }
    });
    
    return {
      totalSessions: sessionsInMonth.length,
      uniqueParticipants: uniqueCollaborateurs.size
    };
  }, [sessions, currentDate]);

  // Navigation
  const handlePrevious = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Ouvrir le modal avec les détails du jour
  const handleDayClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const daySessions = sessionsByDay[dateKey] || [];
    
    if (daySessions.length > 0) {
      setSelectedDate(date);
      setSelectedSessions(daySessions);
      setModalOpened(true);
    }
  };

  // Grouper les sessions par département pour un jour donné
  const getSessionsByDepartment = (sessions: SessionFormationResponse[]) => {
    const grouped: Record<string, SessionFormationResponse[]> = {};
    sessions.forEach(session => {
      const dept = session.collaborateur?.departement || 'Non défini';
      if (!grouped[dept]) {
        grouped[dept] = [];
      }
      grouped[dept].push(session);
    });
    return grouped;
  };

  // Grouper les sessions par formation pour un jour donné
  const getSessionsByFormation = (sessions: SessionFormationResponse[]) => {
    const grouped: Record<string, SessionFormationResponse[]> = {};
    sessions.forEach(session => {
      const formation = session.formation?.nom || 'Formation inconnue';
      if (!grouped[formation]) {
        grouped[formation] = [];
      }
      grouped[formation].push(session);
    });
    return grouped;
  };

  return (
    <Container size="xl">
      {/* En-tête */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group justify="space-between" align="center" mb="md">
          <Group>
            <Button
              variant="subtle"
              leftSection={<ArrowLeft size={16} />}
              onClick={() => router.push('/sessions')}
            >
              Retour
            </Button>
            <Group align="center" gap="sm">
              <CalendarIcon size={32} color="#228BE6" />
              <div>
                <Title order={1}>Calendrier des Sessions</Title>
                <Text size="lg" c="dimmed">
                  Vue mensuelle des formations
                </Text>
              </div>
            </Group>
          </Group>
        </Group>

        {/* Contrôles de navigation */}
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Group>
              <ActionIcon onClick={handlePrevious} variant="light" size="lg">
                <CaretLeft size={20} />
              </ActionIcon>
              
              <Button 
                variant="light" 
                onClick={handleToday}
                size="sm"
              >
                Aujourd'hui
              </Button>
              
              <ActionIcon onClick={handleNext} variant="light" size="lg">
                <CaretRight size={20} />
              </ActionIcon>
              
              <Text size="lg" fw={600}>
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </Text>
            </Group>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Select
              placeholder="Filtrer par département"
              data={[{ value: '', label: 'Tous les départements' }, ...departments.map(d => ({ value: d, label: d }))]}
              value={departmentFilter}
              onChange={(value) => setDepartmentFilter(value || '')}
              clearable
              leftSection={<Buildings size={16} />}
            />
          </Grid.Col>
        </Grid>

        {/* Statistiques simples */}
        <Group mt="md" gap="lg">
          <Paper withBorder p="xs" radius="md">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="blue">
                <Users size={16} />
              </ThemeIcon>
              <Text size="sm">
                {monthStats.uniqueParticipants} participant{monthStats.uniqueParticipants > 1 ? 's' : ''} en formation
              </Text>
            </Group>
          </Paper>
          
          <Paper withBorder p="xs" radius="md">
            <Group gap="xs">
              <ThemeIcon size="sm" variant="light" color="violet">
                <CalendarIcon size={16} />
              </ThemeIcon>
              <Text size="sm">
                {monthStats.totalSessions} session{monthStats.totalSessions > 1 ? 's' : ''} ce mois
              </Text>
            </Group>
          </Paper>
          
          {departmentFilter && (
            <Paper withBorder p="xs" radius="md">
              <Text size="sm" c="blue">
                Filtre: {departmentFilter}
              </Text>
            </Paper>
          )}
        </Group>
      </Paper>

      {/* Calendrier */}
      <Paper shadow="xs" p="lg" radius="md">
        {isLoading ? (
          <Center h={400}>
            <Stack align="center">
              <Loader size="lg" />
              <Text c="dimmed">Chargement du calendrier...</Text>
            </Stack>
          </Center>
        ) : (
          <>
            {/* En-têtes des jours */}
            <SimpleGrid cols={7} mb="sm">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <Text key={day} size="sm" fw={600} ta="center" c="dimmed">
                  {day}
                </Text>
              ))}
            </SimpleGrid>

            {/* Grille du calendrier */}
            <SimpleGrid cols={7} spacing="xs">
              {days.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const daySessions = sessionsByDay[dateKey] || [];
                const filteredSessions = departmentFilter 
                  ? daySessions.filter(s => s.collaborateur?.departement === departmentFilter)
                  : daySessions;
                const isCurrentMonth = isSameMonth(day, currentDate);
                const hasSessions = filteredSessions.length > 0;
                const isWeekendDay = isWeekend(day);
                const isCurrentDay = isToday(day);
                
                return (
                  <Card
                    key={dateKey}
                    p="xs"
                    radius="md"
                    withBorder={hasSessions || isCurrentDay}
                    style={{
                      minHeight: 100,
                      backgroundColor: isCurrentDay 
                        ? 'var(--mantine-color-blue-0)' 
                        : isWeekendDay 
                        ? 'var(--mantine-color-gray-0)'
                        : !isCurrentMonth 
                        ? 'var(--mantine-color-gray-0)' 
                        : undefined,
                      borderColor: isCurrentDay
                        ? 'var(--mantine-color-blue-3)'
                        : hasSessions 
                        ? 'var(--mantine-color-gray-3)' 
                        : 'transparent',
                      borderWidth: isCurrentDay ? 2 : 1,
                      cursor: hasSessions ? 'pointer' : 'default',
                      opacity: !isCurrentMonth ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                    onClick={() => hasSessions && handleDayClick(day)}
                    onMouseEnter={(e) => {
                      if (hasSessions) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <Stack gap={4}>
                      {/* Numéro du jour */}
                      <Text 
                        size="sm" 
                        fw={isCurrentDay ? 700 : 500}
                        c={isCurrentDay ? 'blue' : !isCurrentMonth ? 'dimmed' : undefined}
                      >
                        {format(day, 'd')}
                      </Text>
                      
                      {/* Sessions du jour */}
                      {hasSessions && (
                        <Stack gap={2}>
                          <Badge size="xs" variant="light" color="blue" fullWidth>
                            {filteredSessions.length} session{filteredSessions.length > 1 ? 's' : ''}
                          </Badge>
                          
                          {/* Afficher les 2 premières formations */}
                          {filteredSessions.slice(0, 2).map((session, idx) => (
                            <Text key={`${session.id}-${idx}`} size="xs" c="dimmed" truncate>
                              {session.collaborateur?.prenom} {session.collaborateur?.nom}
                            </Text>
                          ))}
                          
                          {filteredSessions.length > 2 && (
                            <Text size="xs" c="dimmed" ta="center">
                              +{filteredSessions.length - 2} autres
                            </Text>
                          )}
                        </Stack>
                      )}
                    </Stack>
                  </Card>
                );
              })}
            </SimpleGrid>
          </>
        )}
      </Paper>

      {/* Modal détaillé du jour */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Group>
            <CalendarIcon size={20} />
            <Text fw={600}>
              {selectedDate && format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </Text>
            <Badge variant="filled" color="blue">
              {selectedSessions.length} session{selectedSessions.length > 1 ? 's' : ''}
            </Badge>
          </Group>
        }
        size="xl"
      >
        {selectedDate && (
          <Tabs defaultValue="list">
            <Tabs.List>
              <Tabs.Tab value="list" leftSection={<User size={16} />}>
                Liste des sessions
              </Tabs.Tab>
              <Tabs.Tab value="department" leftSection={<Buildings size={16} />}>
                Par département
              </Tabs.Tab>
            </Tabs.List>

            <ScrollArea h={400} mt="md">
              <Tabs.Panel value="list">
                <Stack gap="sm">
                  {selectedSessions.map(session => (
                    <Paper key={session.id} p="sm" radius="md" withBorder>
                      <Group justify="space-between">
                        <Group>
                          <Avatar radius="xl" color="blue" size="md">
                            {session.collaborateur?.prenom?.[0]}{session.collaborateur?.nom?.[0]}
                          </Avatar>
                          <div>
                            <Text size="sm" fw={500}>
                              {session.collaborateur?.prenom} {session.collaborateur?.nom}
                            </Text>
                            <Group gap="xs">
                              <Badge size="xs" variant="light">
                                {session.collaborateur?.departement}
                              </Badge>
                              <Text size="xs" c="dimmed">
                                {session.formation?.nom}
                              </Text>
                            </Group>
                            <Group gap="xs" mt={4}>
                              <ThemeIcon size="xs" variant="light" color="gray">
                                <Clock size={12} />
                              </ThemeIcon>
                              <Text size="xs" c="dimmed">
                                {session.dateDebut && format(parseISO(session.dateDebut.toString()), 'd MMM', { locale: fr })}
                                {session.dateFin && ` - ${format(parseISO(session.dateFin.toString()), 'd MMM yyyy', { locale: fr })}`}
                                {session.formation?.dureeHeures && ` (${session.formation.dureeHeures}h)`}
                              </Text>
                            </Group>
                          </div>
                        </Group>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => router.push(`/sessions/${session.id}`)}
                        >
                          Détails
                        </Button>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="department">
                <Stack gap="md">
                  {Object.entries(getSessionsByDepartment(selectedSessions)).map(([dept, deptSessions]) => (
                    <Paper key={dept} p="sm" radius="md" withBorder>
                      <Group justify="space-between" mb="xs">
                        <Text fw={500}>{dept}</Text>
                        <Badge color="blue">
                          {deptSessions.length} personne{deptSessions.length > 1 ? 's' : ''}
                        </Badge>
                      </Group>
                      <Stack gap="xs">
                        {deptSessions.map(session => (
                          <Group key={session.id} justify="space-between">
                            <Text size="sm">
                              {session.collaborateur?.prenom} {session.collaborateur?.nom}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {session.formation?.nom}
                            </Text>
                          </Group>
                        ))}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Tabs.Panel>
            </ScrollArea>
          </Tabs>
        )}
      </Modal>
    </Container>
  );
}