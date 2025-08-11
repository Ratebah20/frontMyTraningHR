# Guide de Migration et Bonnes Pratiques - Mantine v8

## 🚨 Changements Critiques Mantine v8

Ce document liste tous les changements importants pour éviter les erreurs lors du développement avec Mantine v8.

## 1. AppShell - Nouvelle Architecture

### ❌ Ancienne méthode (v6/v7)
```tsx
import { AppShell, Header, Footer, Navbar } from '@mantine/core';

<AppShell
  header={<Header height={60}>Content</Header>}
  navbar={<Navbar width={300}>Content</Navbar>}
  footer={<Footer height={60}>Content</Footer>}
>
  {children}
</AppShell>
```

### ✅ Nouvelle méthode (v8)
```tsx
import { AppShell } from '@mantine/core';

<AppShell
  header={{ height: 60 }}
  navbar={{ width: 300, breakpoint: 'sm' }}
  footer={{ height: 60 }}
>
  <AppShell.Header>Header content</AppShell.Header>
  <AppShell.Navbar>Navbar content</AppShell.Navbar>
  <AppShell.Footer>Footer content</AppShell.Footer>
  <AppShell.Main>{children}</AppShell.Main>
</AppShell>
```

## 2. Group Component

### ❌ Anciennes propriétés
```tsx
<Group position="apart" spacing="md">
  {/* Content */}
</Group>
```

### ✅ Nouvelles propriétés
```tsx
// Option 1: Utiliser Flex pour plus de contrôle
<Flex justify="space-between" gap="md">
  {/* Content */}
</Flex>

// Option 2: Group avec gap
<Group gap="md">
  {/* Content */}
</Group>
```

## 3. Text Component

### ❌ Anciennes propriétés
```tsx
<Text weight={500} color="dimmed" size="sm">
  Content
</Text>
```

### ✅ Nouvelles propriétés
```tsx
<Text fw={500} c="dimmed" size="sm">
  Content
</Text>
```

## 4. Menu Component

### ❌ Ancienne propriété icon
```tsx
<Menu.Item icon={<IconUser size={14} />}>
  Profile
</Menu.Item>
```

### ✅ Nouvelle propriété leftSection
```tsx
<Menu.Item leftSection={<User size={14} />}>
  Profile
</Menu.Item>
```

## 5. Progress Component

### ❌ Ancienne propriété
```tsx
<Progress animate />
```

### ✅ Nouvelle propriété
```tsx
<Progress animated />
```

## 6. Stack Component

### ❌ Ancienne propriété
```tsx
<Stack spacing={0}>
  {/* Content */}
</Stack>
```

### ✅ Nouvelle propriété
```tsx
<Stack gap={0}>
  {/* Content */}
</Stack>
```

## 7. useColorScheme Hook

### ❌ Ancienne utilisation
```tsx
import { useColorScheme } from '@mantine/hooks';
const { colorScheme, toggleColorScheme } = useColorScheme();
```

### ✅ Nouvelle utilisation
```tsx
import { useColorScheme } from '@mantine/hooks';
const colorScheme = useColorScheme();

// Pour toggle, créer une fonction personnalisée ou utiliser useMantineColorScheme
import { useMantineColorScheme } from '@mantine/core';
const { colorScheme, toggleColorScheme } = useMantineColorScheme();
```

## 8. Spotlight Component

### ❌ Ancienne méthode (v6/v7)
```tsx
import { SpotlightProvider } from '@mantine/spotlight';

<SpotlightProvider
  actions={actions}
  searchIcon={<IconSearch />}
  searchPlaceholder="Search..."
  nothingFound="Nothing found"
>
  {children}
</SpotlightProvider>
```

### ✅ Nouvelle méthode (v8)
```tsx
import { Spotlight, spotlight } from '@mantine/spotlight';

// Dans le provider
<Spotlight actions={actions} />

// Pour ouvrir/fermer
spotlight.open();
spotlight.close();
spotlight.toggle();
```

## 9. Icons - IMPORTANT

### ❌ NE JAMAIS UTILISER
```tsx
import { IconHome, IconUser } from '@tabler/icons-react';
```

### ✅ TOUJOURS UTILISER
```tsx
// Option 1: Phosphor Icons
import { House, User } from '@phosphor-icons/react';

// Option 2: Lucide React
import { Home, User } from 'lucide-react';
```

## 10. Code Component

### ❌ Ancienne propriété size
```tsx
<Code size="xs">Content</Code>
```

### ✅ Plus de propriété size sur Code
```tsx
<Code>Content</Code>
```

## 11. UnstyledButton avec Link

### ❌ Problème de type
```tsx
<UnstyledButton component={Link} href="/path">
  Content
</UnstyledButton>
```

### ✅ Solution avec type assertion
```tsx
<UnstyledButton component={Link as any} href="/path">
  Content
</UnstyledButton>
```

## 12. Références HTML

### ❌ Ancienne méthode
```tsx
ref={el => refs.current[index] = el!}
```

### ✅ Nouvelle méthode sécurisée
```tsx
ref={(el) => {
  if (el) refs.current[index] = el;
}}
```

## Résumé des Imports Corrects

```tsx
// ✅ Imports corrects pour Mantine v8
import {
  AppShell,
  Group,
  Text,
  Button,
  Menu,
  Progress,
  Stack,
  Flex,
  useMantineTheme,
  useMantineColorScheme,
} from '@mantine/core';

import { useDisclosure, useWindowScroll } from '@mantine/hooks';
import { Spotlight, spotlight } from '@mantine/spotlight';
import { notifications } from '@mantine/notifications';

// ✅ Icons
import { House, User, Gear } from '@phosphor-icons/react';
// ou
import { Home, User, Settings } from 'lucide-react';
```

## Checklist de Vérification

Avant de committer votre code, vérifiez :

- [ ] Pas d'import de `Header`, `Footer`, `Navbar` séparés
- [ ] Pas de `position="apart"` sur `Group`
- [ ] Pas de `spacing` sur `Group` ou `Stack`
- [ ] Pas de `weight` sur `Text`
- [ ] Pas de `color` sur `Text` (utiliser `c`)
- [ ] Pas de `icon` sur `Menu.Item`
- [ ] Pas de `animate` sur `Progress`
- [ ] Pas d'import de `@tabler/icons-react`
- [ ] Pas de `SpotlightProvider`
- [ ] Utilisation correcte de `useColorScheme`

## Ressources

- [Documentation Mantine v8](https://mantine.dev)
- [Guide de migration officiel](https://mantine.dev/guides/7x-to-8x/)
- [Phosphor Icons](https://phosphoricons.com/)
- [Lucide Icons](https://lucide.dev/)