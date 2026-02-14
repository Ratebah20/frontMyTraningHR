'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Paper,
  PasswordInput,
  Button,
  Title,
  Text,
  Container,
  Group,
  Stack,
  ThemeIcon,
  Alert,
  useMantineColorScheme,
  Progress,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { Lock } from '@phosphor-icons/react/dist/ssr/Lock';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr/ShieldCheck';
import { authService } from '@/lib/services';

function getPasswordStrength(password: string): number {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[a-z]/.test(password)) strength += 25;
  if (/[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)) strength += 25;
  return strength;
}

function getPasswordStrengthColor(strength: number): string {
  if (strength <= 25) return 'red';
  if (strength <= 50) return 'orange';
  if (strength <= 75) return 'yellow';
  return 'green';
}

function InvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (value) => {
        if (!value) return 'Le mot de passe est requis';
        if (value.length < 8) return 'Le mot de passe doit contenir au moins 8 caracteres';
        if (!/[A-Z]/.test(value)) return 'Le mot de passe doit contenir au moins une majuscule';
        if (!/[a-z]/.test(value)) return 'Le mot de passe doit contenir au moins une minuscule';
        if (!/[0-9]/.test(value) && !/[^a-zA-Z0-9]/.test(value)) {
          return 'Le mot de passe doit contenir au moins un chiffre ou un caractere special';
        }
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Veuillez confirmer le mot de passe';
        if (value !== values.password) return 'Les mots de passe ne correspondent pas';
        return null;
      },
    },
  });

  const passwordStrength = getPasswordStrength(form.values.password);

  const handleSubmit = async (values: typeof form.values) => {
    if (!token) {
      setError('Token d\'invitation manquant. Veuillez utiliser le lien de votre email.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await authService.acceptInvitation(token, values.password);
      setSuccess(true);

      notifications.show({
        title: 'Compte active',
        message: 'Votre compte a ete active avec succes. Vous pouvez maintenant vous connecter.',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login?success=Votre compte a ete active. Connectez-vous avec votre nouveau mot de passe.');
      }, 2000);
    } catch (error: any) {
      console.error('Invitation acceptance failed:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Une erreur est survenue lors de l\'activation du compte.';
      setError(errorMessage);

      notifications.show({
        title: 'Erreur',
        message: errorMessage,
        color: 'red',
        icon: <WarningCircle size={20} />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'linear-gradient(to bottom right, #111827, #1f2937, #111827)'
              : 'linear-gradient(to bottom right, #eff6ff, #ffffff, #ecfeff)',
          }}
        />
        <Container size="sm" className="min-h-screen flex items-center justify-center relative z-10">
          <Paper radius="lg" p={40} shadow="xl" className="w-full max-w-md">
            <Stack align="center" gap="md">
              <ThemeIcon size={60} radius="xl" color="red" variant="light">
                <WarningCircle size={35} weight="duotone" />
              </ThemeIcon>
              <Title order={2} ta="center">Lien invalide</Title>
              <Text c="dimmed" ta="center">
                Ce lien d'invitation est invalide ou a expire. Veuillez contacter votre
                administrateur RH pour recevoir une nouvelle invitation.
              </Text>
              <Button
                variant="light"
                onClick={() => router.push('/login')}
                mt="md"
              >
                Retour a la connexion
              </Button>
            </Stack>
          </Paper>
        </Container>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'linear-gradient(to bottom right, #111827, #1f2937, #111827)'
              : 'linear-gradient(to bottom right, #eff6ff, #ffffff, #ecfeff)',
          }}
        />
        <Container size="sm" className="min-h-screen flex items-center justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Paper radius="lg" p={40} shadow="xl">
              <Stack align="center" gap="md">
                <ThemeIcon size={60} radius="xl" color="green" variant="light">
                  <CheckCircle size={35} weight="duotone" />
                </ThemeIcon>
                <Title order={2} ta="center">Compte active !</Title>
                <Text c="dimmed" ta="center">
                  Votre compte a ete active avec succes. Vous allez etre redirige vers la page de connexion...
                </Text>
              </Stack>
            </Paper>
          </motion.div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'linear-gradient(to bottom right, #111827, #1f2937, #111827)'
            : 'linear-gradient(to bottom right, #eff6ff, #ffffff, #ecfeff)',
        }}
      >
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 rounded-full filter blur-xl"
            style={{
              backgroundColor: isDark ? '#1e3a5f' : '#bfdbfe',
              mixBlendMode: isDark ? 'screen' : 'multiply',
              opacity: isDark ? 0.3 : 0.7,
            }}
            animate={{ x: [0, 100, 0], y: [0, -100, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-72 h-72 rounded-full filter blur-xl"
            style={{
              backgroundColor: isDark ? '#4c1d95' : '#e9d5ff',
              mixBlendMode: isDark ? 'screen' : 'multiply',
              opacity: isDark ? 0.3 : 0.7,
            }}
            animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>

      <Container size="sm" className="min-h-screen flex items-center justify-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-full max-w-md"
        >
          <Paper radius="lg" p={40} shadow="xl" className="backdrop-blur-sm">
            <Stack align="center" gap="xs" mb="xl">
              <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                <ShieldCheck size={35} weight="duotone" />
              </ThemeIcon>
              <Title order={2} ta="center">
                Activer votre compte
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                Choisissez un mot de passe pour activer votre compte Portail Manager
              </Text>
            </Stack>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack>
                {error && (
                  <Alert icon={<WarningCircle size={16} />} color="red" variant="light">
                    {error}
                  </Alert>
                )}

                <PasswordInput
                  label="Mot de passe"
                  placeholder="Choisissez un mot de passe"
                  required
                  leftSection={<Lock size={16} />}
                  {...form.getInputProps('password')}
                  size="md"
                  disabled={isSubmitting}
                />

                {form.values.password && (
                  <div>
                    <Group justify="space-between" mb={5}>
                      <Text size="xs" c="dimmed">Force du mot de passe</Text>
                      <Text size="xs" c={getPasswordStrengthColor(passwordStrength)} fw={500}>
                        {passwordStrength <= 25 && 'Faible'}
                        {passwordStrength > 25 && passwordStrength <= 50 && 'Moyen'}
                        {passwordStrength > 50 && passwordStrength <= 75 && 'Bon'}
                        {passwordStrength > 75 && 'Excellent'}
                      </Text>
                    </Group>
                    <Progress
                      value={passwordStrength}
                      color={getPasswordStrengthColor(passwordStrength)}
                      size="xs"
                    />
                  </div>
                )}

                <PasswordInput
                  label="Confirmer le mot de passe"
                  placeholder="Confirmez votre mot de passe"
                  required
                  leftSection={<Lock size={16} />}
                  {...form.getInputProps('confirmPassword')}
                  size="md"
                  disabled={isSubmitting}
                />

                <Text size="xs" c="dimmed">
                  Le mot de passe doit contenir au moins 8 caracteres, une majuscule,
                  une minuscule, et un chiffre ou un caractere special.
                </Text>

                <Button
                  fullWidth
                  mt="md"
                  size="md"
                  type="submit"
                  loading={isSubmitting}
                  leftSection={<CheckCircle size={20} />}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                >
                  Activer mon compte
                </Button>

                <Button
                  fullWidth
                  variant="subtle"
                  size="sm"
                  onClick={() => router.push('/login')}
                  disabled={isSubmitting}
                >
                  Retour a la connexion
                </Button>
              </Stack>
            </form>
          </Paper>
        </motion.div>
      </Container>
    </div>
  );
}

export default function InvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Chargement...</div>
        </div>
      }
    >
      <InvitationContent />
    </Suspense>
  );
}
