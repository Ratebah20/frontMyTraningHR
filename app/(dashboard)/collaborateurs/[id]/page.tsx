'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Paper,
  Group,
  Text,
  Button,
  Stack,
  Badge,
  Table,
  Loader,
  Center,
  Alert,
  Card,
  Grid,
  Avatar,
  ThemeIcon,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  ArrowLeft,
  PencilSimple,
  User,
  Building,
  Calendar,
  GraduationCap,
  BookOpen,
  Clock,
  CheckCircle,
  Warning,
  Trophy,
  Star,
  Download,
} from '@phosphor-icons/react';
import { collaborateursService } from '@/lib/services';
import { Collaborateur, SessionFormation } from '@/lib/types';
import { StatutUtils } from '@/lib/utils/statut.utils';
import { formatDuration } from '@/lib/utils/duration.utils';

interface Props {
  params: {
    id: string;
  };
}

export default function CollaborateurDetailPage({ params }: Props) {
  const router = useRouter();
  const [collaborateur, setCollaborateur] = useState<Collaborateur | null>(null);
  const [formations, setFormations] = useState<SessionFormation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Charger le collaborateur avec les stats intégrées
        const collabData = await collaborateursService.getCollaborateur(parseInt(params.id));
        setCollaborateur(collabData);
        
        // Si les stats sont dans collabData, les utiliser
        if (collabData.stats) {
          setStats(collabData.stats);
        }
        
        // Charger ses formations avec l'historique complet et les stats détaillées
        try {
          const formationsData = await collaborateursService.getCollaborateurFormations(parseInt(params.id));
          // Le backend retourne maintenant {collaborateur, stats, data}
          if (formationsData && typeof formationsData === 'object') {
            if ('data' in formationsData) {
              setFormations(Array.isArray(formationsData.data) ? formationsData.data : []);
            }
            if ('stats' in formationsData) {
              setStats(formationsData.stats); // Utiliser les stats du endpoint formations
            }
          } else if (Array.isArray(formationsData)) {
            setFormations(formationsData);
          } else {
            setFormations([]);
          }
        } catch (err) {
          console.log('Pas de formations pour ce collaborateur');
          setFormations([]);
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err);
        setError(err.message || 'Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [params.id]);

  const handleExport = async () => {
    try {
      const blob = await collaborateursService.exportCollaborateurs();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collaborateur_${params.id}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notifications.show({
        title: 'Succès',
        message: 'Export réussi',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
    } catch (err: any) {
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors de l\'export',
        color: 'red',
        icon: <Warning size={20} />,
      });
    }
  };

  if (isLoading) {
    return (
      <Center h={400}>
        <Loader size="lg" variant="bars" />
      </Center>
    );
  }

  if (error || !collaborateur) {
    return (
      <Container size="md">
        <Alert icon={<Warning size={16} />} color="red" variant="light">
          {error || 'Collaborateur non trouvé'}
        </Alert>
        <Button onClick={() => router.back()} mt="md">
          Retour
        </Button>
      </Container>
    );
  }

  // Utilisation des méthodes de StatutUtils pour la cohérence
  const getStatusColor = (statut: string) => StatutUtils.getStatusColor(statut);
  const getStatusLabel = (statut: string) => StatutUtils.getStatusLabel(statut);

  // S'assurer que formations est un tableau
  const formationsArray = Array.isArray(formations) ? formations : [];
  
  // Utiliser les stats du backend si disponibles, sinon calculer localement
  const displayStats = stats || {
    totalFormations: formationsArray.length,
    formationsTerminees: 0,
    formationsEnCours: 0,
    formationsInscrites: 0,
    totalHeures: 0,
    moyenneNote: 0,
  };

  return (
    <Container size="xl">
      {/* En-tête */}
      <Group justify="space-between" mb="xl">
        <div>
          <Group align="center" gap="sm">
            <Button
              variant="subtle"
              leftSection={<ArrowLeft size={16} />}
              onClick={() => router.back()}
            >
              Retour
            </Button>
            <Title order={1}>Détails du collaborateur</Title>
          </Group>
        </div>
        <Group>
          <Button
            variant="light"
            leftSection={<Download size={16} />}
            onClick={handleExport}
          >
            Exporter
          </Button>
          <Button
            leftSection={<PencilSimple size={16} />}
            onClick={() => router.push(`/collaborateurs/${params.id}/edit`)}
          >
            Modifier
          </Button>
        </Group>
      </Group>

      {/* Informations principales */}
      <Paper shadow="xs" p="lg" radius="md" mb="xl">
        <Group align="flex-start" gap="xl">
          <Avatar size={80} radius="xl" color="blue">
            {collaborateur.nomComplet?.split(' ').map(n => n[0]).join('') || 'NA'}
          </Avatar>
          
          <div style={{ flex: 1 }}>
            <Title order={2} mb="sm">{collaborateur.nomComplet}</Title>
            <Text size="sm" c="dimmed" mb="xs">ID: {collaborateur.idExterne}</Text>
            
            <Group gap="lg" mt="md">
              <Group gap="xs">
                <Building size={16} color="#868E96" />
                <Text size="sm">
                  {collaborateur.departement?.nomDepartement || 'Non assigné'}
                </Text>
              </Group>
              
              {collaborateur.manager && (
                <Group gap="xs">
                  <User size={16} color="#868E96" />
                  <Text size="sm">
                    Manager: {collaborateur.manager.nomComplet}
                  </Text>
                </Group>
              )}

              {collaborateur.workerSubType && (
                <Group gap="xs">
                  <Calendar size={16} color="#868E96" />
                  <Text size="sm">
                    Contrat: {collaborateur.workerSubType}
                  </Text>
                </Group>
              )}

              <Badge
                color={collaborateur.actif ? 'green' : 'red'}
                variant="light"
              >
                {collaborateur.actif ? 'Actif' : 'Inactif'}
              </Badge>
            </Group>
          </div>
        </Group>
      </Paper>

      {/* Statistiques */}
      <Grid mb="xl">
        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
          <Card withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Total
                </Text>
                <Text size="xl" fw={700}>{displayStats.totalFormations}</Text>
              </div>
              <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                <BookOpen size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
          <Card withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Terminées
                </Text>
                <Text size="xl" fw={700} c="green">{displayStats.formationsTerminees}</Text>
              </div>
              <ThemeIcon size="lg" radius="md" variant="light" color="green">
                <CheckCircle size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
          <Card withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  En cours
                </Text>
                <Text size="xl" fw={700} c="blue">{displayStats.formationsEnCours}</Text>
              </div>
              <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                <Clock size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
          <Card withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Inscrites
                </Text>
                <Text size="xl" fw={700} c="yellow">{displayStats.formationsInscrites}</Text>
              </div>
              <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                <Calendar size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
          <Card withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                  Heures
                </Text>
                <Text size="xl" fw={700}>{displayStats.totalHeures ? `${displayStats.totalHeures}h` : '0h'}</Text>
              </div>
              <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                <Clock size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Historique des formations */}
      <Paper shadow="xs" radius="md" withBorder>
        <Group justify="space-between" p="lg" pb="md">
          <Title order={3}>Historique des formations</Title>
          <Button
            variant="light"
            leftSection={<GraduationCap size={16} />}
            onClick={() => router.push(`/sessions/new?collaborateurId=${collaborateur.id}`)}
          >
            Inscrire à une formation
          </Button>
        </Group>
        
        {formationsArray.length > 0 ? (
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Formation</Table.Th>
                  <Table.Th>Catégorie</Table.Th>
                  <Table.Th>Date début</Table.Th>
                  <Table.Th>Date fin</Table.Th>
                  <Table.Th>Durée</Table.Th>
                  <Table.Th>Statut</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {formationsArray.map((session) => (
                  <Table.Tr key={session.id}>
                    <Table.Td>
                      <Text fw={500}>
                        {session.formation?.nomFormation || session.formation?.nom || '-'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {typeof session.formation?.categorie === 'string' 
                          ? session.formation.categorie 
                          : session.formation?.categorie?.nomCategorie || 'Non catégorisé'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {session.dateDebut 
                        ? new Date(session.dateDebut).toLocaleDateString('fr-FR')
                        : '-'}
                    </Table.Td>
                    <Table.Td>
                      {session.dateFin 
                        ? new Date(session.dateFin).toLocaleDateString('fr-FR')
                        : '-'}
                    </Table.Td>
                    <Table.Td>
                      {formatDuration(session.dureeReelle || session.dureePrevue, session.uniteDuree)}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(session.statut)}
                        variant="light"
                        size="sm"
                      >
                        {getStatusLabel(session.statut)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => router.push(`/sessions/${session.id}`)}
                      >
                        Voir
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        ) : (
          <Center py="xl">
            <Stack align="center">
              <GraduationCap size={48} color="#868E96" />
              <Text size="lg" fw={500} c="dimmed">Aucune formation suivie</Text>
              <Button
                leftSection={<GraduationCap size={16} />}
                onClick={() => router.push(`/sessions/new?collaborateurId=${collaborateur.id}`)}
                mt="md"
              >
                Inscrire à une formation
              </Button>
            </Stack>
          </Center>
        )}
      </Paper>
    </Container>
  );
}