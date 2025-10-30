'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Text,
  Group,
  Button,
  Card,
  Grid,
  Badge,
  Stack,
  Paper,
  Center,
  Loader,
  Alert,
  Timeline,
  ThemeIcon,
  Divider,
  Progress,
  ActionIcon,
  Tooltip,
  Table,
  Box,
  Flex,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  ArrowLeft,
  Clock,
  User,
  Calendar,
  Building,
  PencilSimple,
  XCircle,
  Warning,
  CheckCircle,
  BookOpen,
  Certificate,
  CalendarCheck,
  CalendarX,
  Hourglass,
  CurrencyDollar,
  Star,
  FileText,
  UserCheck,
  Hash,
  Tag,
  MapPin,
  Phone,
  Envelope,
  UsersThree,
  Briefcase,
  IdentificationCard,
  GenderIntersex,
  Database,
  Package,
  Timer,
  Receipt,
  Percent,
  Wallet,
  CalendarPlus,
  Info,
} from '@phosphor-icons/react';
import { sessionsService } from '@/lib/services';
import { SessionFormationResponse } from '@/lib/types';
import { StatutUtils } from '@/lib/utils/statut.utils';
import { formatDuration } from '@/lib/utils/duration.utils';
import { TodoList } from '@/components/session-todos/TodoList';

interface Props {
  params: {
    id: string;
  };
}

// Couleurs et icônes par statut
const statusConfig = {
  'inscrit': { color: 'blue', icon: CalendarCheck, label: 'Inscrit' },
  'INSCRIT': { color: 'blue', icon: CalendarCheck, label: 'Inscrit' },
  'en_cours': { color: 'yellow', icon: Hourglass, label: 'En cours' },
  'EN_COURS': { color: 'yellow', icon: Hourglass, label: 'En cours' },
  'complete': { color: 'green', icon: Certificate, label: 'Terminé' },
  'TERMINE': { color: 'green', icon: Certificate, label: 'Terminé' },
  'COMPLETE': { color: 'green', icon: Certificate, label: 'Terminé' },
  'annule': { color: 'red', icon: CalendarX, label: 'Annulé' },
  'ANNULE': { color: 'red', icon: CalendarX, label: 'Annulé' },
};

export default function SessionDetailPage({ params }: Props) {
  const router = useRouter();
  const [session, setSession] = useState<SessionFormationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Charger la session
  const loadSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const sessionId = parseInt(params.id);

      // Vérifier que l'ID est valide
      if (isNaN(sessionId)) {
        throw new Error('ID de session invalide');
      }

      const data = await sessionsService.getSession(sessionId);
      setSession(data);
    } catch (err: any) {
      console.error('Erreur lors du chargement de la session:', err);
      setError(err.message || 'Session non trouvée');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadSession();
  }, [params.id]);
  
  const handleCancel = async () => {
    if (!session) return;
    
    if (!confirm('Êtes-vous sûr de vouloir annuler cette session ?')) {
      return;
    }
    
    try {
      await sessionsService.cancelSession(session.id);
      notifications.show({
        title: 'Succès',
        message: 'Session annulée avec succès',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      loadSession(); // Recharger les données
    } catch (error: any) {
      notifications.show({
        title: 'Erreur',
        message: error.response?.data?.message || 'Impossible d\'annuler la session',
        color: 'red',
        icon: <Warning size={20} />,
      });
    }
  };
  
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" variant="bars" />
      </Center>
    );
  }
  
  if (error || !session) {
    return (
      <Center h="100vh">
        <Stack align="center">
          <Warning size={48} color="gray" />
          <Text size="lg" c="dimmed">{error || 'Session non trouvée'}</Text>
          <Button onClick={() => router.back()}>Retour</Button>
        </Stack>
      </Center>
    );
  }

  // Déterminer l'icône et la couleur selon le statut
  const StatusIcon = StatutUtils.isComplete(session.statut) ? Certificate :
                     StatutUtils.isEnCours(session.statut) ? Hourglass :
                     StatutUtils.isInscrit(session.statut) ? CalendarCheck :
                     StatutUtils.isAnnule(session.statut) ? CalendarX : CalendarCheck;
  
  const statusColor = StatutUtils.getStatusColor(session.statut);
  const statusLabel = StatutUtils.getStatusLabel(session.statut);

  // Calculer le coût total
  const coutTotal = (session.tarifHT || 0) + (session.fraisAnnexes || 0);
  const coutTTC = session.tarifTTC || (coutTotal * (1 + (session.tva || 0) / 100));

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Group>
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Retour
          </Button>
          <div>
            <Title order={1}>Détail de la session</Title>
            <Text size="lg" c="dimmed" mt="xs">Session #{session.id}</Text>
          </div>
        </Group>
        <Group>
          <Tooltip label="Modifier">
            <ActionIcon
              variant="light"
              size="lg"
              onClick={() => router.push(`/sessions/${params.id}/edit`)}
            >
              <PencilSimple size={20} />
            </ActionIcon>
          </Tooltip>
          {!StatutUtils.isAnnule(session.statut) && (
            <Button
              color="red"
              variant="light"
              leftSection={<XCircle size={16} />}
              onClick={handleCancel}
            >
              Annuler
            </Button>
          )}
        </Group>
      </Group>

      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          {/* Statut et informations principales */}
          <Paper shadow="xs" p="lg" radius="md" withBorder mb="lg">
            <Group justify="space-between" mb="lg">
              <Badge
                size="lg"
                leftSection={<StatusIcon size={16} />}
                color={statusColor}
                variant="light"
              >
                {statusLabel}
              </Badge>
              {session.note !== null && session.note !== undefined && (
                <Group gap="xs">
                  <Star size={20} color="#FD7E14" />
                  <Text fw={600}>{session.note}/100</Text>
                </Group>
              )}
            </Group>

            <Stack gap="lg">
              {/* Collaborateur avec plus d'infos */}
              <Box>
                <Group mb="md">
                  <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                    <User size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">Informations du collaborateur</Text>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="xs">
                      <Group gap="xs">
                        <UserCheck size={16} color="#868E96" />
                        <Text size="sm">
                          <Text span c="dimmed" size="xs">Nom complet:</Text> {session.collaborateur?.prenom} {session.collaborateur?.nom}
                        </Text>
                      </Group>
                      
                      {session.collaborateur?.matricule && (
                        <Group gap="xs">
                          <IdentificationCard size={16} color="#868E96" />
                          <Text size="sm">
                            <Text span c="dimmed" size="xs">Matricule:</Text> {session.collaborateur.matricule}
                          </Text>
                        </Group>
                      )}
                      
                      {session.collaborateur?.email && (
                        <Group gap="xs">
                          <Envelope size={16} color="#868E96" />
                          <Text size="sm">
                            <Text span c="dimmed" size="xs">Email:</Text> {session.collaborateur.email}
                          </Text>
                        </Group>
                      )}
                    </Stack>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="xs">
                      <Group gap="xs">
                        <Building size={16} color="#868E96" />
                        <Text size="sm">
                          <Text span c="dimmed" size="xs">Département:</Text> {session.collaborateur?.departement || 'Non défini'}
                        </Text>
                      </Group>
                      
                      {session.collaborateur?.workerSubType && (
                        <Group gap="xs">
                          <Briefcase size={16} color="#868E96" />
                          <Text size="sm">
                            <Text span c="dimmed" size="xs">Type contrat:</Text> {session.collaborateur.workerSubType}
                          </Text>
                        </Group>
                      )}
                      
                      {session.collaborateur?.manager && (
                        <Group gap="xs">
                          <UsersThree size={16} color="#868E96" />
                          <Text size="sm">
                            <Text span c="dimmed" size="xs">Manager:</Text> {session.collaborateur.manager.prenom} {session.collaborateur.manager.nom}
                          </Text>
                        </Group>
                      )}
                      
                      {session.collaborateur?.genre && (
                        <Group gap="xs">
                          <GenderIntersex size={16} color="#868E96" />
                          <Text size="sm">
                            <Text span c="dimmed" size="xs">Genre:</Text> {session.collaborateur.genre}
                          </Text>
                        </Group>
                      )}
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Box>

              <Divider />

              {/* Formation avec plus d'infos */}
              <Box>
                <Group mb="md">
                  <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                    <BookOpen size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">Informations de la formation</Text>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm">
                        <Text span c="dimmed" size="xs">Nom:</Text> {session.formation?.nom || 'Non renseignée'}
                      </Text>
                      <Text size="sm">
                        <Text span c="dimmed" size="xs">Code:</Text> {session.formation?.code || 'N/A'}
                      </Text>
                      <Text size="sm">
                        <Text span c="dimmed" size="xs">Catégorie:</Text> {session.formation?.categorie || 'Non définie'}
                      </Text>
                    </Stack>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="xs">
                      {session.formation?.type && (
                        <Text size="sm">
                          <Text span c="dimmed" size="xs">Type:</Text> {session.formation.type}
                        </Text>
                      )}
                      <Text size="sm">
                        <Text span c="dimmed" size="xs">Durée prévue:</Text> {session.formation?.dureeHeures || 0} heures
                      </Text>
                      {session.formation?.tarifHT && (
                        <Text size="sm">
                          <Text span c="dimmed" size="xs">Tarif catalogue:</Text> {session.formation.tarifHT.toLocaleString('fr-FR')} € HT
                        </Text>
                      )}
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Box>

              <Divider />

              {/* Dates et durées */}
              <Box>
                <Group mb="md">
                  <ThemeIcon size="lg" radius="md" variant="light" color="green">
                    <Calendar size={20} />
                  </ThemeIcon>
                  <Text fw={600} size="lg">Dates et durées</Text>
                </Group>
                
                <Grid>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="xs">
                      <Text size="sm">
                        <Text span c="dimmed" size="xs">Date début:</Text> {session.dateDebut ? new Date(session.dateDebut).toLocaleDateString('fr-FR') : 'Non définie'}
                      </Text>
                      <Text size="sm">
                        <Text span c="dimmed" size="xs">Date fin:</Text> {session.dateFin ? new Date(session.dateFin).toLocaleDateString('fr-FR') : 'Non définie'}
                      </Text>
                    </Stack>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Stack gap="xs">
                      {session.dureePrevue && (
                        <Text size="sm">
                          <Text span c="dimmed" size="xs">Durée prévue:</Text> {session.dureePrevue} {session.uniteDuree || 'heures'}
                        </Text>
                      )}
                      {session.dureeHeures && (
                        <Text size="sm">
                          <Text span c="dimmed" size="xs">Durée réelle:</Text> {session.dureeHeures} {session.uniteDuree || 'heures'}
                        </Text>
                      )}
                    </Stack>
                  </Grid.Col>
                </Grid>
              </Box>

              {/* Organisme */}
              {session.organisme && (
                <>
                  <Divider />
                  <Box>
                    <Group mb="md">
                      <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
                        <Building size={20} />
                      </ThemeIcon>
                      <Text fw={600} size="lg">Organisme de formation</Text>
                    </Group>
                    
                    <Grid>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Stack gap="xs">
                          <Text size="sm">
                            <Text span c="dimmed" size="xs">Nom:</Text> {session.organisme.nom}
                          </Text>
                          {session.organisme.type && (
                            <Text size="sm">
                              <Text span c="dimmed" size="xs">Type:</Text> {session.organisme.type}
                            </Text>
                          )}
                        </Stack>
                      </Grid.Col>
                      
                      {session.organisme.contact && (
                        <Grid.Col span={{ base: 12, sm: 6 }}>
                          <Text size="sm">
                            <Text span c="dimmed" size="xs">Contact:</Text> {session.organisme.contact}
                          </Text>
                        </Grid.Col>
                      )}
                    </Grid>
                  </Box>
                </>
              )}
            </Stack>
          </Paper>

          {/* Informations budgétaires */}
          {(session.tarifHT || session.tarifTTC || session.fraisAnnexes) && (
            <Paper shadow="xs" p="lg" radius="md" withBorder mb="lg">
              <Group mb="md">
                <CurrencyDollar size={20} />
                <Text fw={600} size="lg">Informations budgétaires</Text>
              </Group>
              
              <Table>
                <Table.Tbody>
                  {session.tarifHT && (
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" c="dimmed">Tarif HT</Text>
                      </Table.Td>
                      <Table.Td align="right">
                        <Text fw={500}>{session.tarifHT.toLocaleString('fr-FR')} €</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  
                  {session.fraisAnnexes && session.fraisAnnexes > 0 && (
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" c="dimmed">Frais annexes</Text>
                      </Table.Td>
                      <Table.Td align="right">
                        <Text fw={500}>{session.fraisAnnexes.toLocaleString('fr-FR')} €</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  
                  {session.tva && (
                    <Table.Tr>
                      <Table.Td>
                        <Text size="sm" c="dimmed">TVA ({session.tva}%)</Text>
                      </Table.Td>
                      <Table.Td align="right">
                        <Text fw={500}>{((coutTotal * session.tva) / 100).toLocaleString('fr-FR')} €</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                  
                  {session.tarifTTC && (
                    <Table.Tr>
                      <Table.Td>
                        <Text fw={600}>Total TTC</Text>
                      </Table.Td>
                      <Table.Td align="right">
                        <Text fw={700} size="lg" c="green">
                          {coutTTC.toLocaleString('fr-FR')} €
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
              
              {session.budgetImpute && (
                <Alert icon={<CheckCircle size={16} />} color="green" variant="light" mt="md">
                  Budget imputé le {session.dateImputation ? new Date(session.dateImputation).toLocaleDateString('fr-FR') : 'N/A'}
                </Alert>
              )}
            </Paper>
          )}

          {/* Commentaire */}
          {session.commentaire && (
            <Paper shadow="xs" p="lg" radius="md" withBorder>
              <Group mb="md">
                <FileText size={20} />
                <Text fw={600}>Commentaire</Text>
              </Group>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{session.commentaire}</Text>
            </Paper>
          )}
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Note et progression */}
            {session.note !== null && session.note !== undefined && (
              <Card shadow="xs" radius="md" withBorder>
                <Text fw={600} mb="md">Évaluation</Text>
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">Note obtenue</Text>
                  <Progress
                    value={session.note}
                    color={session.note >= 80 ? 'green' : session.note >= 60 ? 'yellow' : 'red'}
                    size="xl"
                    radius="md"
                  />
                  <Text ta="center" fw={600} size="lg">
                    {session.note}/100
                  </Text>
                  <Badge
                    fullWidth
                    size="lg"
                    color={session.note >= 80 ? 'green' : session.note >= 60 ? 'yellow' : 'red'}
                    variant="light"
                  >
                    {session.note >= 80 ? 'Excellent' : session.note >= 60 ? 'Satisfaisant' : 'À améliorer'}
                  </Badge>
                </Stack>
              </Card>
            )}

            {/* Statistiques rapides */}
            <Card shadow="xs" radius="md" withBorder>
              <Text fw={600} mb="md">Récapitulatif</Text>
              <Stack gap="sm">
                <Flex justify="space-between">
                  <Group gap="xs">
                    <Hash size={16} color="#868E96" />
                    <Text size="sm" c="dimmed">ID Session</Text>
                  </Group>
                  <Text size="sm" fw={500}>{session.id}</Text>
                </Flex>
                
                {session.idImportOLU && (
                  <Flex justify="space-between">
                    <Group gap="xs">
                      <Tag size={16} color="#868E96" />
                      <Text size="sm" c="dimmed">ID OLU</Text>
                    </Group>
                    <Text size="sm" fw={500}>{session.idImportOLU}</Text>
                  </Flex>
                )}
                
                <Flex justify="space-between">
                  <Group gap="xs">
                    <Timer size={16} color="#868E96" />
                    <Text size="sm" c="dimmed">Durée totale</Text>
                  </Group>
                  <Text size="sm" fw={500}>
                    {formatDuration(
                      session.dureeHeures || session.dureePrevue || session.formation?.dureePrevue,
                      session.uniteDuree || session.formation?.uniteDuree
                    )}
                  </Text>
                </Flex>
                
                {coutTotal > 0 && (
                  <Flex justify="space-between">
                    <Group gap="xs">
                      <Wallet size={16} color="#868E96" />
                      <Text size="sm" c="dimmed">Coût total</Text>
                    </Group>
                    <Text size="sm" fw={500} c="green">
                      {coutTTC.toLocaleString('fr-FR')} €
                    </Text>
                  </Flex>
                )}
              </Stack>
            </Card>

            {/* Informations système */}
            <Card shadow="xs" radius="md" withBorder>
              <Text fw={600} mb="md">Traçabilité</Text>
              <Stack gap="xs">
                {session.sourceImport && (
                  <div>
                    <Group gap="xs">
                      <Database size={14} color="#868E96" />
                      <Text size="xs" c="dimmed">Source d'import</Text>
                    </Group>
                    <Text size="sm" ml={18}>{session.sourceImport}</Text>
                  </div>
                )}
                
                {session.dateImport && (
                  <div>
                    <Group gap="xs">
                      <Package size={14} color="#868E96" />
                      <Text size="xs" c="dimmed">Date d'import</Text>
                    </Group>
                    <Text size="sm" ml={18}>
                      {new Date(session.dateImport).toLocaleString('fr-FR')}
                    </Text>
                  </div>
                )}
                
                {session.dateCreation && (
                  <div>
                    <Group gap="xs">
                      <CalendarPlus size={14} color="#868E96" />
                      <Text size="xs" c="dimmed">Date de création</Text>
                    </Group>
                    <Text size="sm" ml={18}>
                      {new Date(session.dateCreation).toLocaleString('fr-FR')}
                    </Text>
                  </div>
                )}
                
                {session.dateModification && (
                  <div>
                    <Group gap="xs">
                      <Clock size={14} color="#868E96" />
                      <Text size="xs" c="dimmed">Dernière modification</Text>
                    </Group>
                    <Text size="sm" ml={18}>
                      {new Date(session.dateModification).toLocaleString('fr-FR')}
                    </Text>
                  </div>
                )}
              </Stack>
            </Card>

            {/* Actions */}
            <Card shadow="xs" radius="md" withBorder>
              <Stack gap="sm">
                <Text fw={600}>Actions disponibles</Text>
                <Button
                  fullWidth
                  variant="light"
                  leftSection={<PencilSimple size={16} />}
                  onClick={() => router.push(`/sessions/${params.id}/edit`)}
                >
                  Modifier la session
                </Button>
                
                <Button
                  fullWidth
                  variant="light"
                  color="violet"
                  leftSection={<User size={16} />}
                  onClick={() => router.push(`/collaborateurs/${session.collaborateur?.id}`)}
                  disabled={!session.collaborateur?.id}
                >
                  Voir le collaborateur
                </Button>
                
                <Button
                  fullWidth
                  variant="light"
                  color="indigo"
                  leftSection={<BookOpen size={16} />}
                  onClick={() => router.push(`/formations/${session.formation?.id}`)}
                  disabled={!session.formation?.id}
                >
                  Voir la formation
                </Button>
                
                {!StatutUtils.isAnnule(session.statut) && (
                  <Button
                    fullWidth
                    variant="light"
                    color="red"
                    leftSection={<XCircle size={16} />}
                    onClick={handleCancel}
                  >
                    Annuler la session
                  </Button>
                )}
              </Stack>
            </Card>
          </Stack>
        </Grid.Col>

        {/* Checklist de préparation (Todos) - Full width */}
        <Grid.Col span={12}>
          <TodoList
            sessionId={session.id}
            typeFormation={session.formation?.type}
          />
        </Grid.Col>
      </Grid>
    </Container>
  );
}