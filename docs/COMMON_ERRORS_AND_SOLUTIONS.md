# Erreurs Communes et Solutions - Frontend DB Formation

## 🚨 Erreurs Fréquentes et leurs Solutions

### 1. Module '@tabler/icons-react' introuvable

**Erreur:**
```
Module not found: Can't resolve '@tabler/icons-react'
```

**Solution:**
```typescript
// ❌ NE PAS FAIRE
import { IconHome, IconUser } from '@tabler/icons-react';

// ✅ FAIRE
import { House, User } from '@phosphor-icons/react';
// ou
import { Home, User } from 'lucide-react';
```

### 2. Property 'position' does not exist on Group

**Erreur:**
```
Property 'position' does not exist on type 'GroupProps'
```

**Solution:**
```typescript
// ❌ Mantine v6/v7
<Group position="apart" spacing="md">

// ✅ Mantine v8
<Flex justify="space-between" gap="md">
// ou
<Group gap="md"> // Sans position
```

### 3. Property 'weight' does not exist on Text

**Erreur:**
```
Property 'weight' does not exist on type 'TextProps'
```

**Solution:**
```typescript
// ❌ Ancienne propriété
<Text weight={500} color="dimmed">

// ✅ Nouvelle propriété
<Text fw={500} c="dimmed">
```

### 4. Property 'icon' does not exist on Menu.Item

**Erreur:**
```
Property 'icon' does not exist on type 'MenuItemProps'
```

**Solution:**
```typescript
// ❌ Ancienne propriété
<Menu.Item icon={<User size={14} />}>

// ✅ Nouvelle propriété
<Menu.Item leftSection={<User size={14} />}>
```

### 5. Cannot find name 'Header', 'Footer', 'Navbar'

**Erreur:**
```
Cannot find name 'Header'
Cannot find name 'Footer'
Cannot find name 'Navbar'
```

**Solution:**
```typescript
// ❌ NE PAS importer séparément
import { AppShell, Header, Footer, Navbar } from '@mantine/core';

// ✅ Utiliser les composants composés
import { AppShell } from '@mantine/core';

<AppShell>
  <AppShell.Header>...</AppShell.Header>
  <AppShell.Navbar>...</AppShell.Navbar>
  <AppShell.Footer>...</AppShell.Footer>
  <AppShell.Main>...</AppShell.Main>
</AppShell>
```

### 6. SpotlightProvider not found

**Erreur:**
```
Module '"@mantine/spotlight"' has no exported member 'SpotlightProvider'
```

**Solution:**
```typescript
// ❌ Ancienne méthode
import { SpotlightProvider } from '@mantine/spotlight';

// ✅ Nouvelle méthode
import { Spotlight, spotlight } from '@mantine/spotlight';

// Utilisation
<Spotlight actions={actions} />

// Contrôle
spotlight.open();
spotlight.close();
```

### 7. Property 'animate' does not exist on Progress

**Erreur:**
```
Property 'animate' does not exist on type 'ProgressProps'
```

**Solution:**
```typescript
// ❌ Ancienne propriété
<Progress animate />

// ✅ Nouvelle propriété
<Progress animated />
```

### 8. Type incompatibility with Link component

**Erreur:**
```
Type 'typeof Link' is not assignable to type '"button"'
```

**Solution:**
```typescript
// ❌ Problème de type
<UnstyledButton component={Link} href="/path">

// ✅ Solution avec type assertion
<UnstyledButton component={Link as any} href="/path">
```

### 9. useColorScheme returns wrong type

**Erreur:**
```
Property 'toggleColorScheme' does not exist
```

**Solution:**
```typescript
// ❌ Ancienne utilisation
const { colorScheme, toggleColorScheme } = useColorScheme();

// ✅ Pour Mantine v8
import { useMantineColorScheme } from '@mantine/core';
const { colorScheme, toggleColorScheme } = useMantineColorScheme();
```

### 10. textContent assignment type error

**Erreur:**
```
Type 'number' is not assignable to type 'string'
```

**Solution:**
```typescript
// ❌ Assigner un nombre
element.textContent = 123;

// ✅ Convertir en string
element.textContent = String(123);
// ou
element.textContent = `${123}`;
```

### 11. Ref assignment error

**Erreur:**
```
Object is possibly 'null'
```

**Solution:**
```typescript
// ❌ Ancienne méthode
ref={el => refs.current[index] = el!}

// ✅ Méthode sécurisée
ref={(el) => {
  if (el) refs.current[index] = el;
}}
```

### 12. Spotlight searchPlaceholder error

**Erreur:**
```
Property 'searchPlaceholder' does not exist on type 'SpotlightProps'
```

**Solution:**
```typescript
// ❌ Props qui n'existent plus
<Spotlight 
  searchPlaceholder="Search..."
  nothingFound="Nothing found"
  searchIcon={<Search />}
/>

// ✅ Version simplifiée
<Spotlight actions={actions} />
```

## 🔧 Solutions Générales

### Vérifier les Versions
```bash
# Vérifier les versions installées
npm list @mantine/core @mantine/hooks

# Mettre à jour si nécessaire
npm update @mantine/core @mantine/hooks
```

### Nettoyer le Cache
```bash
# Nettoyer le cache Next.js
rm -rf .next
npm run dev

# Nettoyer node_modules si nécessaire
rm -rf node_modules package-lock.json
npm install
```

### Configuration TypeScript
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true, // Évite les erreurs dans node_modules
    "esModuleInterop": true,
    "jsx": "preserve"
  }
}
```

## 📚 Références Rapides

### Imports Corrects
```typescript
// ✅ Mantine v8
import {
  AppShell,
  Group,
  Flex,
  Stack,
  Text,
  Button,
  Card,
  Badge,
  Progress,
  Menu,
  useMantineTheme,
  useMantineColorScheme,
} from '@mantine/core';

import { 
  useDisclosure, 
  useWindowScroll,
  useHotkeys 
} from '@mantine/hooks';

// ✅ Icons
import { 
  House, 
  User, 
  Gear,
  ArrowUpRight,
  ArrowDownRight 
} from '@phosphor-icons/react';
```

### Props Mapping Quick Reference

| Composant | Ancienne Prop | Nouvelle Prop |
|-----------|---------------|---------------|
| Group | position="apart" | justify="space-between" (ou Flex) |
| Group/Stack | spacing="md" | gap="md" |
| Text | weight={500} | fw={500} |
| Text | color="dimmed" | c="dimmed" |
| Menu.Item | icon={} | leftSection={} |
| Progress | animate | animated |
| Code | size="xs" | (pas de size) |

## 🆘 Besoin d'Aide?

1. Vérifier la [documentation Mantine v8](https://mantine.dev)
2. Consulter le guide de migration dans `MANTINE_V8_MIGRATION_GUIDE.md`
3. Vérifier les exemples dans le code existant
4. Rechercher dans les issues GitHub de Mantine