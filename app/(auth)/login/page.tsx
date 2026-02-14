'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Paper,
  TextInput,
  PasswordInput,
  Checkbox,
  Button,
  Title,
  Text,
  Container,
  Group,
  Stack,
  ThemeIcon,
  Alert,
  useMantineColorScheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { GraduationCap } from '@phosphor-icons/react/dist/ssr/GraduationCap';
import { User } from '@phosphor-icons/react/dist/ssr/User';
import { Lock } from '@phosphor-icons/react/dist/ssr/Lock';
import { SignIn } from '@phosphor-icons/react/dist/ssr/SignIn';
import { Eye } from '@phosphor-icons/react/dist/ssr/Eye';
import { EyeSlash } from '@phosphor-icons/react/dist/ssr/EyeSlash';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { useAuth } from '@/contexts/AuthContext';
// Composant principal avec useSearchParams
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const explicitRedirect = searchParams.get('redirect');
  const successMessage = searchParams.get('success');
  const { login, isAuthenticated, user } = useAuth();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rememberMe') === 'true';
    }
    return false;
  });
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for bear animations
  const [bearImage, setBearImage] = useState('/img/watch_bear_0.png');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [hideAnimationFrame, setHideAnimationFrame] = useState(0);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Refs for animations
  const formRef = useRef<HTMLDivElement>(null);
  const formWrapperRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const bearContainerRef = useRef<HTMLDivElement>(null);

  // State for CSS animation classes (shake/success)
  const [formAnimClass, setFormAnimClass] = useState('');

  const form = useForm({
    initialValues: {
      email: typeof window !== 'undefined' ? (localStorage.getItem('rememberedEmail') || '') : '',
      password: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'L\'email est requis';
        if (!/^\S+@\S+$/.test(value)) return 'Email invalide';
        return null;
      },
      password: (value) => (!value ? 'Le mot de passe est requis' : null),
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      if (explicitRedirect) {
        router.push(explicitRedirect);
      } else {
        // Redirect based on role
        const defaultRedirect = user.role === 'MANAGER' ? '/manager/dashboard' : '/dashboard';
        router.push(defaultRedirect);
      }
    }
  }, [isAuthenticated, user, router, explicitRedirect]);

  // Track cursor position in email field
  const handleEmailInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    form.getInputProps('email').onChange(e);

    if (!isPasswordFocused) {
      const inputLength = e.target.value.length;
      const maxLength = 40;
      const imageIndex = Math.min(Math.floor((inputLength / maxLength) * 20), 20);
      setBearImage(`/img/watch_bear_${imageIndex}.png`);
    }
  }, [form, isPasswordFocused]);

  // Eye-covering animation for password
  const handlePasswordFocus = useCallback(() => {
    setIsPasswordFocused(true);
    let frame = 0;
    const animationInterval = setInterval(() => {
      if (frame <= 5) {
        setBearImage(`/img/hide_bear_${frame}.png`);
        setHideAnimationFrame(frame);
        frame++;
      } else {
        clearInterval(animationInterval);
      }
    }, 50);
  }, []);

  const handlePasswordBlur = useCallback(() => {
    setIsPasswordFocused(false);
    let frame = 5;
    const animationInterval = setInterval(() => {
      if (frame >= 0) {
        setBearImage(`/img/hide_bear_${frame}.png`);
        setHideAnimationFrame(frame);
        frame--;
      } else {
        setBearImage('/img/watch_bear_0.png');
        clearInterval(animationInterval);
      }
    }, 50);
  }, []);

  const handleEmailFocus = useCallback(() => {
    if (!isPasswordFocused) {
      const currentLength = form.values.email.length;
      const maxLength = 40;
      const imageIndex = Math.min(Math.floor((currentLength / maxLength) * 20), 20);
      setBearImage(`/img/watch_bear_${imageIndex}.png`);
    }
  }, [form.values.email, isPasswordFocused]);

  const handleSubmit = async (values: typeof form.values) => {
    setIsLogging(true);
    setError(null);

    try {
      await login(values.email, values.password);

      // Save or remove email based on "Remember me"
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', values.email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
      }

      // Success notification
      notifications.show({
        title: 'Connexion réussie',
        message: 'Redirection vers le tableau de bord...',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });

      // Success animation via CSS
      setFormAnimClass('login-success-out');
      // Redirect is handled by AuthContext.login based on user role
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      const errorMessage = error.message || 'Identifiants invalides';
      setError(errorMessage);

      // Error notification
      notifications.show({
        title: 'Erreur de connexion',
        message: errorMessage,
        color: 'red',
        icon: <WarningCircle size={20} />,
      });

      // Shake animation via CSS
      setFormAnimClass('login-shake');
      // Remove class after animation ends so it can be re-triggered
      setTimeout(() => setFormAnimClass(''), 400);
    } finally {
      setIsLogging(false);
    }
  };

  const features = [
    { icon: User, text: 'Gestion des collaborateurs', color: 'blue' },
    { icon: GraduationCap, text: 'Catalogue de formations', color: 'grape' },
    { icon: CheckCircle, text: 'Suivi des certifications', color: 'green' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with animated orbs */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'linear-gradient(to bottom right, #111827, #1f2937, #111827)'
            : 'linear-gradient(to bottom right, #eff6ff, #ffffff, #ecfeff)'
        }}
      >
        <div className="absolute inset-0">
          {/* Animated background circles via CSS */}
          <div
            className="absolute top-20 left-20 w-72 h-72 rounded-full filter blur-xl login-bg-orb-1"
            style={{
              backgroundColor: isDark ? '#1e3a5f' : '#bfdbfe',
              mixBlendMode: isDark ? 'screen' : 'multiply',
              opacity: isDark ? 0.3 : 0.7,
            }}
          />
          <div
            className="absolute bottom-20 right-20 w-72 h-72 rounded-full filter blur-xl login-bg-orb-2"
            style={{
              backgroundColor: isDark ? '#4c1d95' : '#e9d5ff',
              mixBlendMode: isDark ? 'screen' : 'multiply',
              opacity: isDark ? 0.3 : 0.7,
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full filter blur-xl login-bg-orb-3"
            style={{
              backgroundColor: isDark ? '#831843' : '#fbcfe8',
              mixBlendMode: isDark ? 'screen' : 'multiply',
              opacity: isDark ? 0.3 : 0.7,
            }}
          />
        </div>
      </div>

      <Container size="xl" className="min-h-screen flex items-center justify-center relative z-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left section - Information */}
          <div ref={featuresRef}>
            <div className="login-fade-in-delay-1">
              <Group align="center" mb="xl">
                <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                  <GraduationCap size={35} weight="duotone" />
                </ThemeIcon>
                <div>
                  <div className="login-slide-up">
                    <Title order={1} ref={titleRef}>My Training HQ</Title>
                  </div>
                  <Text size="lg" c="dimmed">Système de gestion des formations</Text>
                </div>
              </Group>
            </div>

            <Stack gap="xl" mt="xl">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`feature-item login-slide-left-${index}`}
                >
                  <Group>
                    <ThemeIcon size="lg" radius="md" variant="light" color={feature.color}>
                      <feature.icon size={24} weight="duotone" />
                    </ThemeIcon>
                    <Text size="lg">{feature.text}</Text>
                  </Group>
                </div>
              ))}
            </Stack>

          </div>

          {/* Right section - Form */}
          <div className="relative pt-24">
            <div
              ref={formWrapperRef}
              className={`login-form-in ${formAnimClass}`}
            >
            <Paper
              ref={formRef}
              radius="lg"
              p={40}
              shadow="xl"
              className="backdrop-blur-sm relative"
            >
              {/* Animated bear */}
              <div
                ref={bearContainerRef}
                className="absolute -top-20 left-1/2 w-32 h-32 z-20 login-bear-bounce"
              >
                <img
                  src={bearImage}
                  alt="Bear mascot"
                  className="w-full h-full object-contain transition-all duration-100"
                  style={{
                    filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                  }}
                />
              </div>
              <Title order={2} ta="center" mb="md">
                Connexion
              </Title>
              <Text c="dimmed" size="sm" ta="center" mb="xl">
                Connectez-vous pour accéder à votre espace
              </Text>

              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                  {successMessage && (
                    <Alert icon={<CheckCircle size={16} />} color="green" variant="light">
                      {successMessage}
                    </Alert>
                  )}
                  {error && (
                    <Alert icon={<WarningCircle size={16} />} color="red" variant="light">
                      {error}
                    </Alert>
                  )}

                  <TextInput
                    ref={emailInputRef}
                    label="Email"
                    placeholder="votre.email@example.com"
                    required
                    type="email"
                    autoComplete="email"
                    leftSection={<User size={16} />}
                    {...form.getInputProps('email')}
                    onChange={handleEmailInput}
                    onFocus={handleEmailFocus}
                    size="md"
                    disabled={isLogging}
                  />

                  <PasswordInput
                    ref={passwordInputRef}
                    label="Mot de passe"
                    placeholder="Votre mot de passe"
                    required
                    autoComplete="current-password"
                    leftSection={<Lock size={16} />}
                    visible={showPassword}
                    onVisibilityChange={setShowPassword}
                    {...form.getInputProps('password')}
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
                    size="md"
                    disabled={isLogging}
                  />

                  <Checkbox
                    label="Se souvenir de moi"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.currentTarget.checked)}
                    mt="sm"
                  />
                </Stack>

                <Button
                  fullWidth
                  mt="xl"
                  size="md"
                  type="submit"
                  loading={isLogging}
                  leftSection={<SignIn size={20} />}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  className="hover:scale-[1.02] transition-transform"
                >
                  Se connecter
                </Button>
              </form>

            </Paper>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

// Wrapper with Suspense for useSearchParams (required Next.js 14+)
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
