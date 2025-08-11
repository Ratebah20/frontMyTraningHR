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

interface Props {
  params: {
    id: string;
  };
}

export default function CollaborateurDetailPage({ params }: Props) {
  const router = useRouter();
  const [collaborateur, setCollaborateur] = useState<Collaborateur | null>(null);
  const [formations, setFormations] = useState<SessionFormation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Charger le collaborateur
        const collabData = await collaborateursService.getCollaborateur(parseInt(params.id));
        setCollaborateur(collabData);
        
        // Charger ses formations
        try {
          const formationsData = await collaborateursService.getCollaborateurFormations(parseInt(params.id));
          // S'assurer que c'est un tableau
          if (Array.isArray(formationsData)) {
            setFormations(formationsData);
          } else if (formationsData && typeof formationsData === 'object' && 'data' in formationsData) {
            // Si c'est un objet avec une propriété data
            setFormations(Array.isArray(formationsData.data) ? formationsData.data : []);
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

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'complete': return 'green';
      case 'en_cours': return 'blue';
      case 'inscrit': return 'yellow';
      case 'annule': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'complete': return 'Terminé';
      case 'en_cours': return 'En cours';
      case 'inscrit': return 'Inscrit';
      case 'annule': return 'Annulé';
      default: return statut;
    }
  };

  // Calcul des statistiques (s'assurer que formations est un tableau)
  const formationsArray = Array.isArray(formations) ? formations : [];
  const stats = {
    totalFormations: formationsArray.length,
    completees: formationsArray.filter(f => f.statut === 'complete').length,
    enCours: formationsArray.filter(f => f.statut === 'en_cours').length,
    inscrites: formationsArray.filter(f => f.statut === 'inscrit').length,
    heuresTotal: formationsArray.reduce((acc, f) => {
      if (f.uniteDuree === 'heures') return acc + (f.dureeReelle || f.dureePrevue || 0);
      if (f.uniteDuree === 'jours') return acc + ((f.dureeReelle || f.dureePrevue || 0) * 8);
      return acc;
    }, 0),
    moyenneNote: formationsArray
      .filter(f => f.note !== null && f.note !== undefined)
      .reduce((acc, f, _, arr) => acc + (f.note || 0) / arr.length, 0),
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
                <Text size="xl" fw={700}>{stats.totalFormations}</Text>
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
                <Text size="xl" fw={700} c="green">{stats.completees}</Text>
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
                <Text size="xl" fw={700} c="blue">{stats.enCours}</Text>
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
                <Text size="xl" fw={700} c="yellow">{stats.inscrites}</Text>
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
                <Text size="xl" fw={700}>{stats.heuresTotal}h</Text>
              </div>
              <ThemeIcon size="lg" radius="md" variant="light" color="violet">
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
                  Note moy.
                </Text>
                <Text size="xl" fw={700}>
                  {stats.moyenneNote > 0 ? `${stats.moyenneNote.toFixed(1)}/100` : '-'}
                </Text>
              </div>
              <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                <Star size={20} />
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
                  <Table.Th>Note</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {formationsArray.map((formation) => (
                  <Table.Tr key={formation.id}>
                    <Table.Td>
                      <Text fw={500}>{formation.formation?.nomFormation}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {typeof formation.formation?.categorie === 'string' 
                          ? formation.formation.categorie 
                          : formation.formation?.categorie?.nomCategorie || 'Non catégorisé'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {formation.dateDebut 
                        ? new Date(formation.dateDebut).toLocaleDateString('fr-FR')
                        : '-'}
                    </Table.Td>
                    <Table.Td>
                      {formation.dateFin 
                        ? new Date(formation.dateFin).toLocaleDateString('fr-FR')
                        : '-'}
                    </Table.Td>
                    <Table.Td>
                      {formation.dureeReelle || formation.dureePrevue || '-'} {formation.uniteDuree}
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={getStatusColor(formation.statut)}
                        variant="light"
                        size="sm"
                      >
                        {getStatusLabel(formation.statut)}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {formation.note !== null && formation.note !== undefined 
                        ? `${formation.note}/100` 
                        : '-'}
                    </Table.Td>
                    <Table.Td>
                      <Button
                        variant="subtle"
                        size="xs"
                        onClick={() => router.push(`/sessions/${formation.id}`)}
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