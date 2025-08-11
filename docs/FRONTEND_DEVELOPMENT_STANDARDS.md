# Standards de Développement Frontend - DB Formation

## 🎯 Vue d'ensemble

Ce document définit les standards et conventions à suivre pour le développement du frontend de DB Formation.

## 📦 Stack Technique

### Versions Spécifiques
- **Next.js**: 14.x (App Router)
- **Mantine UI**: v8.x
- **TypeScript**: 5.x
- **React**: 18.x
- **Node.js**: 18.x ou supérieur

### Bibliothèques UI
- **Composants principaux**: Mantine v8
- **Composants complémentaires**: shadcn/ui
- **Icônes**: 
  - Phosphor Icons (`@phosphor-icons/react`)
  - Lucide React (`lucide-react`)
  - ⚠️ **JAMAIS** `@tabler/icons-react`

### Animation et Graphiques
- **Animations**: GSAP + Framer Motion
- **Graphiques**: 
  - Tremor (dashboards)
  - Recharts (graphiques complexes)
  - ApexCharts (graphiques interactifs)

## 🏗️ Architecture des Composants

### Structure des Dossiers
```
app/
├── (auth)/              # Routes publiques
│   └── login/
├── (dashboard)/         # Routes protégées
│   ├── layout.tsx       # Layout avec sidebar
│   ├── dashboard/
│   ├── formations/
│   ├── collaborateurs/
│   └── sessions/
├── layout.tsx           # Layout racine
├── page.tsx            # Page d'accueil
└── providers.tsx       # Tous les providers

components/
├── layout/             # Composants de layout
├── ui/                 # Composants UI réutilisables
├── features/           # Composants métier
└── providers/          # Context providers

hooks/                  # Hooks personnalisés
lib/                    # Utilitaires et config
services/               # Services API
types/                  # Types TypeScript
```

### Conventions de Nommage

#### Fichiers et Dossiers
- **Composants**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase avec préfixe `use` (`useAuth.ts`)
- **Services**: camelCase avec suffixe `.service` (`auth.service.ts`)
- **Types**: PascalCase avec suffixe `.types` (`user.types.ts`)
- **Utilitaires**: camelCase (`formatDate.ts`)

#### Variables et Fonctions
```typescript
// ✅ Bon
const getUserById = async (id: number) => { };
const isAuthenticated = true;
const MAX_RETRY_ATTEMPTS = 3;

// ❌ Mauvais
const get_user = async (id: number) => { };
const IsAuthenticated = true;
const maxRetryAttempts = 3; // Pour les constantes
```

## 🎨 Styles et Theming

### Approche de Styling
1. **Priorité 1**: Classes Tailwind CSS
2. **Priorité 2**: Styles Mantine (via props)
3. **Priorité 3**: CSS Modules (si nécessaire)
4. **Éviter**: Styles inline sauf cas spécifiques

### Exemples
```tsx
// ✅ Bon - Tailwind + Mantine props
<Card className="hover:shadow-lg transition-shadow" p="md" radius="md">
  <Text fw={500} size="lg">Titre</Text>
</Card>

// ❌ Éviter - Styles inline
<div style={{ padding: '16px', borderRadius: '8px' }}>
  <p style={{ fontWeight: 500 }}>Titre</p>
</div>
```

## 🔌 Intégration API

### Configuration de Base
```typescript
// lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteurs pour JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Pattern de Services
```typescript
// services/formations.service.ts
export const formationsService = {
  async getAll(params?: FormationParams) {
    const { data } = await apiClient.get('/formations', { params });
    return data;
  },
  
  async getById(id: number) {
    const { data } = await apiClient.get(`/formations/${id}`);
    return data;
  },
  
  async create(formation: FormationCreate) {
    const { data } = await apiClient.post('/formations', formation);
    return data;
  },
};
```

### Utilisation avec React Query
```typescript
// hooks/useFormations.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { formationsService } from '@/services/formations.service';

export const useFormations = (params?: FormationParams) => {
  return useQuery({
    queryKey: ['formations', params],
    queryFn: () => formationsService.getAll(params),
  });
};

export const useCreateFormation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: formationsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
    },
  });
};
```

## 🛡️ Gestion des Erreurs

### Error Boundaries
```tsx
// components/ErrorBoundary.tsx
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundaryComponent
      fallback={<ErrorFallback />}
      onError={(error) => console.error('Error boundary:', error)}
    >
      {children}
    </ErrorBoundaryComponent>
  );
}
```

### Gestion dans les Composants
```tsx
// ✅ Bon
const { data, error, isLoading } = useFormations();

if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;

// ❌ Éviter
try {
  const data = await fetchData();
} catch (error) {
  console.log(error); // Ne pas juste logger
}
```

## 📋 Formulaires

### Avec React Hook Form + Zod
```typescript
// schemas/formation.schema.ts
import { z } from 'zod';

export const formationSchema = z.object({
  intitule: z.string().min(1, "L'intitulé est requis"),
  type_formation: z.enum(['Interne', 'Externe', 'E-learning']),
  duree_heures: z.number().min(1, "La durée doit être positive"),
});

// components/FormationForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function FormationForm() {
  const form = useForm({
    resolver: zodResolver(formationSchema),
    defaultValues: {
      intitule: '',
      type_formation: 'Interne',
      duree_heures: 0,
    },
  });
  
  const onSubmit = form.handleSubmit(async (data) => {
    // Logique de soumission
  });
}
```

## 🧪 Tests

### Structure des Tests
```typescript
// __tests__/components/FormationCard.test.tsx
import { render, screen } from '@testing-library/react';
import { FormationCard } from '@/components/FormationCard';

describe('FormationCard', () => {
  it('should render formation title', () => {
    render(<FormationCard formation={mockFormation} />);
    expect(screen.getByText(mockFormation.intitule)).toBeInTheDocument();
  });
});
```

## 🚀 Performance

### Optimisations Requises
1. **Lazy Loading**: Pour les routes et composants lourds
2. **Memoization**: `useMemo`, `useCallback` pour les calculs coûteux
3. **Images**: Utiliser `next/image` avec optimisation
4. **Bundle**: Analyser régulièrement avec `@next/bundle-analyzer`

### Exemple
```tsx
// ✅ Bon
const ExpensiveComponent = dynamic(() => import('@/components/ExpensiveComponent'), {
  loading: () => <Skeleton />,
});

const memoizedValue = useMemo(() => 
  expensiveCalculation(data), [data]
);

// ❌ Éviter
import ExpensiveComponent from '@/components/ExpensiveComponent';

const value = expensiveCalculation(data); // Recalculé à chaque render
```

## 📝 Checklist de Code Review

Avant de faire une PR, vérifiez :

- [ ] Pas d'erreurs TypeScript
- [ ] Pas d'imports de `@tabler/icons-react`
- [ ] Utilisation correcte des props Mantine v8
- [ ] Gestion des états de chargement et d'erreur
- [ ] Pas de `console.log` en production
- [ ] Noms de variables et fonctions clairs
- [ ] Composants réutilisables extraits
- [ ] Tests pour les nouveaux composants
- [ ] Documentation des props complexes
- [ ] Accessibilité (labels, ARIA, etc.)

## 🔗 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [Mantine v8 Documentation](https://mantine.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Query Documentation](https://tanstack.com/query)
- [Phosphor Icons](https://phosphoricons.com/)

## 📌 Snippets Utiles

### Composant avec TypeScript
```typescript
interface ComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export function Component({ 
  title, 
  description, 
  onAction 
}: ComponentProps) {
  return (
    // JSX
  );
}
```

### Hook Personnalisé
```typescript
export function useCustomHook(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  
  const updateValue = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);
  
  return { value, updateValue };
}
```