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
  Anchor,
  Container,
  Group,
  Center,
  Box,
  BackgroundImage,
  Overlay,
  Stack,
  ThemeIcon,
  Divider,
  Alert,
  useMantineColorScheme,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  User, 
  Lock,
  SignIn,
  Eye,
  EyeSlash,
  CheckCircle,
} from '@phosphor-icons/react';
import { WarningCircle } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import Lottie from 'lottie-react';

// Import animation JSON (vous devrez ajouter un fichier animation)
// import loginAnimation from '@/assets/animations/login.json';

// Composant principal avec useSearchParams
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const { login, isAuthenticated } = useAuth();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les animations de l'ours
  const [bearImage, setBearImage] = useState('/img/watch_bear_0.png');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [hideAnimationFrame, setHideAnimationFrame] = useState(0);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  // Refs pour animations GSAP
  const formRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const bearContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    initialValues: {
      email: '',
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

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, router, redirectUrl]);

  // Fonction pour suivre la position du curseur dans le champ email
  const handleEmailInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    form.getInputProps('email').onChange(e);
    
    if (!isPasswordFocused) {
      const inputLength = e.target.value.length;
      const maxLength = 40; // Longueur max approximative d'un email
      const imageIndex = Math.min(Math.floor((inputLength / maxLength) * 20), 20);
      setBearImage(`/img/watch_bear_${imageIndex}.png`);
    }
  }, [form, isPasswordFocused]);

  // Animation de cache-yeux pour le password
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
    }, 50); // Animation rapide
  }, []);

  const handlePasswordBlur = useCallback(() => {
    setIsPasswordFocused(false);
    // Animation inverse pour revenir à l'état initial
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

  // Animations au montage
  useEffect(() => {
    const tl = gsap.timeline();

    // Animation du titre
    if (titleRef.current) {
      tl.fromTo(titleRef.current,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }

    // Animation du formulaire
    if (formRef.current) {
      tl.fromTo(formRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" },
        "-=0.4"
      );
    }

    // Animation de l'ours
    if (bearContainerRef.current) {
      tl.fromTo(bearContainerRef.current,
        { opacity: 0, y: -30, rotate: -10 },
        { opacity: 1, y: 0, rotate: 0, duration: 0.8, ease: "bounce.out" },
        "-=0.5"
      );
    }

    // Animation des features
    if (featuresRef.current) {
      const features = featuresRef.current.querySelectorAll('.feature-item');
      tl.fromTo(features,
        { opacity: 0, x: -30 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.5, 
          stagger: 0.1,
          ease: "power2.out" 
        },
        "-=0.3"
      );
    }
  }, []);

  const handleSubmit = async (values: typeof form.values) => {
    setIsLogging(true);
    setError(null);
    
    try {
      await login(values.email, values.password);
      
      // Notification de succès
      notifications.show({
        title: 'Connexion réussie',
        message: 'Redirection vers le tableau de bord...',
        color: 'green',
        icon: <CheckCircle size={20} />,
      });
      
      // Animation de succès
      if (formRef.current) {
        gsap.to(formRef.current, {
          scale: 0.95,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            router.push(redirectUrl);
          }
        });
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      const errorMessage = error.message || 'Identifiants invalides';
      setError(errorMessage);
      
      // Notification d'erreur
      notifications.show({
        title: 'Erreur de connexion',
        message: errorMessage,
        color: 'red',
        icon: <WarningCircle size={20} />,
      });
      
      // Animation d'erreur
      if (formRef.current) {
        gsap.to(formRef.current, {
          x: [-10, 10, -10, 10, 0],
          duration: 0.4,
          ease: "power2.inOut"
        });
      }
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
      {/* Background animé */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'linear-gradient(to bottom right, #111827, #1f2937, #111827)'
            : 'linear-gradient(to bottom right, #eff6ff, #ffffff, #ecfeff)'
        }}
      >
        <div className="absolute inset-0">
          {/* Cercles animés en arrière-plan */}
          <motion.div
            className="absolute top-20 left-20 w-72 h-72 rounded-full filter blur-xl"
            style={{
              backgroundColor: isDark ? '#1e3a5f' : '#bfdbfe',
              mixBlendMode: isDark ? 'screen' : 'multiply',
              opacity: isDark ? 0.3 : 0.7,
            }}
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-72 h-72 rounded-full filter blur-xl"
            style={{
              backgroundColor: isDark ? '#4c1d95' : '#e9d5ff',
              mixBlendMode: isDark ? 'screen' : 'multiply',
              opacity: isDark ? 0.3 : 0.7,
            }}
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full filter blur-xl"
            style={{
              backgroundColor: isDark ? '#831843' : '#fbcfe8',
              mixBlendMode: isDark ? 'screen' : 'multiply',
              opacity: isDark ? 0.3 : 0.7,
            }}
            animate={{
              x: [0, 50, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
      </div>

      <Container size="xl" className="min-h-screen flex items-center justify-center relative z-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Section gauche - Informations */}
          <div ref={featuresRef}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Group align="center" mb="xl">
                <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                  <GraduationCap size={35} weight="duotone" />
                </ThemeIcon>
                <div>
                  <Title order={1} ref={titleRef}>My Training HQ</Title>
                  <Text size="lg" c="dimmed">Système de gestion des formations</Text>
                </div>
              </Group>
            </motion.div>

            <Stack gap="xl" mt="xl">
              {features.map((feature, index) => (
                <Group key={index} className="feature-item">
                  <ThemeIcon size="lg" radius="md" variant="light" color={feature.color}>
                    <feature.icon size={24} weight="duotone" />
                  </ThemeIcon>
                  <Text size="lg">{feature.text}</Text>
                </Group>
              ))}
            </Stack>

            <Divider my="xl" />

            <Alert icon={<WarningCircle size={16} />} title="Compte de test" color="blue" variant="light">
              <Text size="sm">
                Email: <strong>admin@mytraininghq.com</strong><br />
                Mot de passe: <strong>Admin@123456</strong>
              </Text>
            </Alert>
          </div>

          {/* Section droite - Formulaire */}
          <div className="relative pt-24">
            <Paper
              ref={formRef}
              radius="lg"
              p={40}
              shadow="xl"
              className="backdrop-blur-sm relative"
            >
              {/* Ours animé */}
              <div 
                ref={bearContainerRef}
                className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-32 h-32 z-20"
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

                  <Group justify="space-between" mt="sm">
                    <Checkbox
                      label="Se souvenir de moi"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.currentTarget.checked)}
                    />
                    <Anchor component="button" type="button" c="dimmed" size="sm">
                      Mot de passe oublié ?
                    </Anchor>
                  </Group>
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

              <Divider label="Ou" labelPosition="center" my="lg" />

              <Center>
                <Text c="dimmed" size="sm">
                  Pas encore de compte ?{' '}
                  <Anchor component="button" type="button" fw={700}>
                    Contactez l'administrateur
                  </Anchor>
                </Text>
              </Center>
            </Paper>
          </div>
        </div>
      </Container>
    </div>
  );
}

// Wrapper avec Suspense pour useSearchParams (requis Next.js 14+)
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