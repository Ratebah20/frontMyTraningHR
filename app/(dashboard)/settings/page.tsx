'use client';

import { useState } from 'react';
import {
  Container,
  Title,
  Text,
  Card,
  Tabs,
  TextInput,
  Select,
  Switch,
  Button,
  Group,
  Stack,
  Divider,
  NumberInput,
  Textarea,
  Badge,
  Alert,
  PasswordInput,
  ColorInput,
  RingProgress,
  Paper,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  User,
  Bell,
  Palette,
  Database,
  Shield,
  Info,
  Check,
} from '@phosphor-icons/react';
import { mockData } from '@/lib/mock-data';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string | null>('profile');
  
  // Mock data
  const systemInfo = {
    version: '2.3.0',
    database_status: 'connected',
    api_version: '1.0.0',
    python_version: '3.9.12',
    uptime_seconds: 432000,
    active_sessions: 12,
    last_backup: new Date().toISOString(),
    storage: {
      percentage_used: 45.2,
      used_gb: 452,
      free_gb: 548,
      total_gb: 1000
    }
  };

  const systemConfig = {
    import_batch_size: 100,
    export_timeout_seconds: 300,
    max_upload_size_mb: 50,
    maintenance_mode: false,
    enable_auto_backup: true
  };

  const userSessions = [
    {
      session_id: '1',
      user_agent: 'Chrome 120.0.0.0 - Windows',
      ip_address: '192.168.1.1',
      login_time: new Date().toISOString(),
      is_current: true
    },
    {
      session_id: '2',
      user_agent: 'Safari 17.0 - macOS',
      ip_address: '192.168.1.2',
      login_time: new Date(Date.now() - 86400000).toISOString(),
      is_current: false
    }
  ];

  const profileForm = useForm({
    initialValues: {
      fullName: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      department: 'IT',
      phone: '+33 6 12 34 56 78',
      bio: 'Responsable de formation avec 5 ans d\'expérience',
    },
  });

  const notificationForm = useForm({
    initialValues: {
      emailNotifications: true,
      newSession: true,
      reminderDays: 7,
      weeklyReport: false,
      monthlyReport: true,
    },
  });

  const appearanceForm = useForm({
    initialValues: {
      theme: 'auto',
      primaryColor: '#228be6',
      compactMode: false,
      animations: true,
    },
  });

  const handleSaveProfile = () => {
    notifications.show({
      title: 'Profil mis à jour',
      message: 'Vos informations ont été enregistrées',
      color: 'green',
      icon: <Check size={20} />,
    });
  };

  const handleSaveNotifications = () => {
    notifications.show({
      title: 'Préférences sauvegardées',
      message: 'Vos préférences de notification ont été mises à jour',
      color: 'green',
      icon: <Check size={20} />,
    });
  };

  const handleSaveAppearance = () => {
    notifications.show({
      title: 'Apparence mise à jour',
      message: 'Les changements d\'apparence ont été appliqués',
      color: 'green',
      icon: <Check size={20} />,
    });
  };

  const handleUpdatePassword = () => {
    notifications.show({
      title: 'Mot de passe mis à jour',
      message: 'Votre mot de passe a été changé avec succès',
      color: 'green',
      icon: <Check size={20} />,
    });
  };

  return (
    <Container size="lg">
      <Stack gap="xl">
        <div>
          <Title order={2}>Paramètres</Title>
          <Text c="dimmed" size="sm">
            Gérez vos préférences et paramètres de l'application
          </Text>
        </div>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="profile" leftSection={<User size={16} />}>
              Profil
            </Tabs.Tab>
            <Tabs.Tab value="notifications" leftSection={<Bell size={16} />}>
              Notifications
            </Tabs.Tab>
            <Tabs.Tab value="appearance" leftSection={<Palette size={16} />}>
              Apparence
            </Tabs.Tab>
            <Tabs.Tab value="system" leftSection={<Database size={16} />}>
              Système
            </Tabs.Tab>
            <Tabs.Tab value="security" leftSection={<Shield size={16} />}>
              Sécurité
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="profile" pt="xl">
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <form onSubmit={profileForm.onSubmit(handleSaveProfile)}>
                <Stack gap="md">
                  <Title order={4}>Informations personnelles</Title>
                  
                  <TextInput
                    label="Nom complet"
                    placeholder="Jean Dupont"
                    {...profileForm.getInputProps('fullName')}
                  />

                  <TextInput
                    label="Email"
                    placeholder="jean.dupont@example.com"
                    type="email"
                    {...profileForm.getInputProps('email')}
                  />

                  <Select
                    label="Département"
                    placeholder="Sélectionnez votre département"
                    data={[
                      { value: 'IT', label: 'Informatique' },
                      { value: 'RH', label: 'Ressources Humaines' },
                      { value: 'Finance', label: 'Finance' },
                      { value: 'Marketing', label: 'Marketing' },
                    ]}
                    {...profileForm.getInputProps('department')}
                  />

                  <TextInput
                    label="Téléphone"
                    placeholder="+33 6 12 34 56 78"
                    {...profileForm.getInputProps('phone')}
                  />

                  <Textarea
                    label="Bio"
                    placeholder="Parlez-nous de vous..."
                    rows={4}
                    {...profileForm.getInputProps('bio')}
                  />

                  <Divider my="md" />

                  <Group justify="flex-end">
                    <Button type="submit">
                      Enregistrer les modifications
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="notifications" pt="xl">
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={4}>Préférences de notification</Title>

                <Switch
                  label="Recevoir des notifications par email"
                  {...notificationForm.getInputProps('emailNotifications', { type: 'checkbox' })}
                />

                <Divider />

                <Text fw={500}>Notifications formations</Text>

                <Switch
                  label="Nouvelle session disponible"
                  description="Être notifié quand une nouvelle session est programmée"
                  {...notificationForm.getInputProps('newSession', { type: 'checkbox' })}
                />

                <NumberInput
                  label="Rappel avant la formation (jours)"
                  min={1}
                  max={30}
                  {...notificationForm.getInputProps('reminderDays')}
                />

                <Divider />

                <Text fw={500}>Rapports</Text>

                <Switch
                  label="Rapport hebdomadaire"
                  description="Recevoir un résumé chaque semaine"
                  {...notificationForm.getInputProps('weeklyReport', { type: 'checkbox' })}
                />

                <Switch
                  label="Rapport mensuel"
                  description="Recevoir un bilan détaillé chaque mois"
                  {...notificationForm.getInputProps('monthlyReport', { type: 'checkbox' })}
                />

                <Divider my="md" />

                <Group justify="flex-end">
                  <Button onClick={handleSaveNotifications}>Enregistrer les préférences</Button>
                </Group>
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="appearance" pt="xl">
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={4}>Personnalisation de l'interface</Title>

                <Select
                  label="Thème"
                  data={[
                    { value: 'auto', label: 'Automatique (système)' },
                    { value: 'light', label: 'Clair' },
                    { value: 'dark', label: 'Sombre' },
                  ]}
                  {...appearanceForm.getInputProps('theme')}
                />

                <ColorInput
                  label="Couleur principale"
                  format="hex"
                  swatches={[
                    '#228be6',
                    '#40c057',
                    '#fd7e14',
                    '#be4bdb',
                    '#e64980',
                    '#15aabf',
                  ]}
                  {...appearanceForm.getInputProps('primaryColor')}
                />

                <Switch
                  label="Mode compact"
                  description="Réduire l'espacement entre les éléments"
                  {...appearanceForm.getInputProps('compactMode', { type: 'checkbox' })}
                />

                <Switch
                  label="Animations"
                  description="Activer les animations et transitions"
                  {...appearanceForm.getInputProps('animations', { type: 'checkbox' })}
                />

                <Divider my="md" />

                <Group justify="flex-end">
                  <Button onClick={handleSaveAppearance}>Appliquer les changements</Button>
                </Group>
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="system" pt="xl">
            <Stack gap="lg">
              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Title order={4}>Informations système</Title>
                  
                  {systemInfo ? (
                    <>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Version de l'application</Text>
                        <Badge variant="light">{systemInfo.version}</Badge>
                      </Group>

                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Base de données</Text>
                        <Badge 
                          color={systemInfo.database_status === 'connected' ? 'green' : 'red'} 
                          variant="light"
                        >
                          {systemInfo.database_status === 'connected' ? 'Connectée' : 'Déconnectée'}
                        </Badge>
                      </Group>

                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">API Backend</Text>
                        <Badge color="green" variant="light">v{systemInfo.api_version}</Badge>
                      </Group>

                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Python</Text>
                        <Text size="sm">{systemInfo.python_version}</Text>
                      </Group>

                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Uptime</Text>
                        <Text size="sm">
                          {Math.floor(systemInfo.uptime_seconds / 86400)}j {Math.floor((systemInfo.uptime_seconds % 86400) / 3600)}h
                        </Text>
                      </Group>

                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Sessions actives</Text>
                        <Badge color="blue" variant="light">{systemInfo.active_sessions}</Badge>
                      </Group>

                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Dernière sauvegarde</Text>
                        <Text size="sm">
                          {systemInfo.last_backup && !isNaN(new Date(systemInfo.last_backup).getTime()) 
                            ? format(new Date(systemInfo.last_backup), 'dd/MM/yyyy HH:mm', { locale: fr })
                            : 'Aucune sauvegarde'}
                        </Text>
                      </Group>
                    </>
                  ) : (
                    <Alert color="red" variant="light">
                      Impossible de charger les informations système
                    </Alert>
                  )}
                </Stack>
              </Card>

              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Title order={4}>Stockage</Title>
                  
                  {systemInfo?.storage ? (
                    <>
                      <Group justify="space-between">
                        <RingProgress
                          size={100}
                          sections={[
                            { 
                              value: systemInfo.storage.percentage_used, 
                              color: systemInfo.storage.percentage_used > 80 ? 'red' : 'blue' 
                            },
                          ]}
                          label={
                            <Text size="xs" ta="center">
                              {systemInfo.storage.percentage_used.toFixed(1)}%
                            </Text>
                          }
                        />
                        <Stack gap="xs" align="flex-end">
                          <Text size="sm">
                            <Text span fw={600}>{systemInfo.storage.used_gb.toFixed(1)} GB</Text> utilisés
                          </Text>
                          <Text size="sm">
                            <Text span fw={600}>{systemInfo.storage.free_gb.toFixed(1)} GB</Text> libres
                          </Text>
                          <Text size="sm" c="dimmed">
                            Total: {systemInfo.storage.total_gb.toFixed(1)} GB
                          </Text>
                        </Stack>
                      </Group>
                    </>
                  ) : null}
                </Stack>
              </Card>

              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Title order={4}>Configuration ETL</Title>
                  
                  {systemConfig ? (
                    <>
                      <Alert icon={<Info size={20} />} color="blue" variant="light">
                        Les imports ETL sont configurés avec un batch size de {systemConfig.import_batch_size} lignes
                        et un timeout de {systemConfig.export_timeout_seconds} secondes.
                      </Alert>

                      <TextInput
                        label="Répertoire d'import"
                        value="C:/excel/"
                        readOnly
                        description="Emplacement des fichiers Excel à importer"
                      />

                      <NumberInput
                        label="Limite de taille de fichier (MB)"
                        value={systemConfig.max_upload_size_mb}
                        min={10}
                        max={100}
                      />

                      <NumberInput
                        label="Taille du batch d'import"
                        value={systemConfig.import_batch_size}
                        min={50}
                        max={1000}
                        step={50}
                      />

                      <Group>
                        <Switch
                          label="Mode maintenance"
                          checked={systemConfig.maintenance_mode}
                        />
                        <Switch
                          label="Sauvegarde automatique"
                          checked={systemConfig.enable_auto_backup}
                        />
                      </Group>
                    </>
                  ) : (
                    <Alert color="red" variant="light">
                      Impossible de charger la configuration
                    </Alert>
                  )}
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="security" pt="xl">
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={4}>Sécurité du compte</Title>

                <PasswordInput
                  label="Mot de passe actuel"
                  placeholder="Entrez votre mot de passe actuel"
                />

                <PasswordInput
                  label="Nouveau mot de passe"
                  placeholder="Entrez un nouveau mot de passe"
                />

                <PasswordInput
                  label="Confirmer le nouveau mot de passe"
                  placeholder="Confirmez le nouveau mot de passe"
                />

                <Divider />

                <Title order={5}>Sessions actives</Title>

                {userSessions && userSessions.length > 0 ? (
                  <>
                    <Alert icon={<Shield size={20} />} color="green" variant="light">
                      Votre compte est actuellement connecté sur {userSessions.length} appareil(s).
                    </Alert>

                    {userSessions.map((session) => (
                      <Paper key={session.session_id} p="sm" withBorder>
                        <Group justify="space-between">
                          <div>
                            <Text size="sm" fw={500}>
                              {session.is_current ? 'Session actuelle' : 'Autre session'}
                            </Text>
                            <Text size="xs" c="dimmed">{session.user_agent}</Text>
                            <Text size="xs" c="dimmed">IP: {session.ip_address}</Text>
                            <Text size="xs" c="dimmed">
                              Connexion: {format(new Date(session.login_time), 'dd/MM/yyyy HH:mm', { locale: fr })}
                            </Text>
                          </div>
                          <Group gap="xs">
                            <Badge color={session.is_current ? 'green' : 'blue'}>
                              {session.is_current ? 'Active' : 'En ligne'}
                            </Badge>
                          </Group>
                        </Group>
                      </Paper>
                    ))}
                  </>
                ) : (
                  <Alert icon={<Info size={20} />} color="gray" variant="light">
                    Aucune session active trouvée
                  </Alert>
                )}

                <Divider my="md" />

                <Group justify="flex-end">
                  <Button 
                    variant="subtle" 
                    color="red"
                    onClick={() => {
                      notifications.show({
                        title: 'Sessions déconnectées',
                        message: 'Toutes les autres sessions ont été terminées',
                        color: 'orange',
                      });
                    }}
                  >
                    Déconnecter toutes les sessions
                  </Button>
                  <Button onClick={handleUpdatePassword}>
                    Mettre à jour le mot de passe
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}