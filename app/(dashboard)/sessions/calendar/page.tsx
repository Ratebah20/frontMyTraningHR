'use client';

import { useState } from 'react';
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
  SegmentedControl,
} from '@mantine/core';
import { 
  CaretLeft, 
  CaretRight, 
  Calendar as CalendarIcon,
  Users,
  MapPin,
  Clock,
} from '@phosphor-icons/react';
import { mockData } from '@/lib/mock-data';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SessionsCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  
  // Mock sessions with formation data
  const sessionsWithFormations = mockData.sessions.map(session => {
    const formation = mockData.formations.find(f => f.id === session.formation_id);
    return {
      ...session,
      formation: formation || { titre: 'Formation inconnue' }
    };
  });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group sessions by day
  const sessionsByDay = sessionsWithFormations.reduce((acc, session) => {
    const date = session.date_debut;
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {} as Record<string, any[]>);

  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <Container size="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Title order={2}>Calendrier des sessions</Title>
            <Text c="dimmed" size="sm">
              Vue d'ensemble des sessions de formation
            </Text>
          </div>
          <SegmentedControl
            value={viewMode}
            onChange={setViewMode}
            data={[
              { label: 'Mois', value: 'month' },
              { label: 'Liste', value: 'list' },
            ]}
          />
        </Group>

        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Group>
              <ActionIcon onClick={handlePreviousMonth} variant="subtle">
                <CaretLeft size={20} />
              </ActionIcon>
              <Title order={3}>
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </Title>
              <ActionIcon onClick={handleNextMonth} variant="subtle">
                <CaretRight size={20} />
              </ActionIcon>
            </Group>
            <Badge size="lg" variant="light">
              {sessionsWithFormations.length} sessions
            </Badge>
          </Group>

          {viewMode === 'month' && (
            <SimpleGrid cols={7} spacing="xs">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                <Text key={day} ta="center" fw={700} size="sm" c="dimmed">
                  {day}
                </Text>
              ))}
              
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const daySessions = sessionsByDay[dateStr] || [];
                const isToday = isSameDay(day, new Date());
                
                return (
                  <Paper
                    key={day.toString()}
                    p="xs"
                    withBorder
                    style={{
                      minHeight: 100,
                      backgroundColor: isToday ? 'var(--mantine-color-blue-light)' : undefined,
                      opacity: !isSameMonth(day, currentDate) ? 0.5 : 1,
                    }}
                  >
                    <Text size="sm" fw={isToday ? 700 : 400} mb="xs">
                      {format(day, 'd')}
                    </Text>
                    
                    <Stack gap={4}>
                      {daySessions.slice(0, 2).map((session) => (
                        <Paper
                          key={session.id}
                          p={4}
                          radius="sm"
                          style={{
                            backgroundColor: 'var(--mantine-color-blue-light)',
                            cursor: 'pointer',
                          }}
                        >
                          <Text size="xs" lineClamp={1} fw={500}>
                            {session.formation.titre}
                          </Text>
                          <Text size="xs" c="dimmed">
                            09:00
                          </Text>
                        </Paper>
                      ))}
                      {daySessions.length > 2 && (
                        <Text size="xs" c="dimmed" ta="center">
                          +{daySessions.length - 2} autres
                        </Text>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>
          )}
        </Card>

        {viewMode === 'list' && (
          <Stack gap="md">
            <Title order={4}>Sessions du mois</Title>
            {sessionsWithFormations.map((session) => (
              <Card key={session.id} shadow="sm" p="md" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>{session.formation.titre}</Text>
                    <Group gap="xs" mt="xs">
                      <Badge size="sm" variant="light" leftSection={<CalendarIcon size={14} />}>
                        {session.date_debut}
                      </Badge>
                      <Badge size="sm" variant="light" leftSection={<Clock size={14} />}>
                        09:00 - 17:00
                      </Badge>
                      <Badge size="sm" variant="light" leftSection={<MapPin size={14} />}>
                        Paris
                      </Badge>
                      <Badge size="sm" variant="light" leftSection={<Users size={14} />}>
                        {session.inscrits}/{session.places}
                      </Badge>
                    </Group>
                  </div>
                  <Badge color="blue">
                    Présentiel
                  </Badge>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}