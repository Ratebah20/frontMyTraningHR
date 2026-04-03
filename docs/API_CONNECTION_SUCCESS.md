# 🔌 Connexion API Réussie - Guide de Référence

## 📅 Date: 23 Décembre 2024

Ce document détaille les étapes réalisées pour connecter avec succès le frontend Next.js à l'API FastAPI.

## ✅ Modifications Apportées

### 1. Configuration Environnement (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_DEV_MODE=false  # Désactive le mode mock
```

### 2. Service d'Authentification (auth.service.ts)

#### Changements clés:
- ❌ FormData → ✅ JSON pour le login
- ❌ `access_token` → ✅ `token`
- ❌ Refresh token → ✅ Supprimé (non implémenté dans l'API)

```typescript
// Structure de la réponse adaptée
export interface LoginResponse {
  token: string;
  expires_in: number;
  user: {
    id: string;
    username: string;
    email: string;
    full_name?: string;
    is_active: boolean;
    created_at: string;
  };
}

// Login avec JSON
const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
```

### 3. Hook useAuth Mis à Jour

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}
```

### 4. API Client (api-client.ts)

#### Intercepteurs simplifiés:
```typescript
// Gestion des erreurs sans refresh token
if (error.response?.status === 401) {
  localStorage.removeItem('access_token');
  localStorage.removeItem('token_expires_in');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
```

### 5. Service KPI (kpi.service.ts)

#### Structure adaptée selon la doc API:
```typescript
export interface DashboardKPIs {
  periode: { annee: number; mois_actuel: number; };
  global: {
    total_collaborateurs: number;
    collaborateurs_formes: number;
    taux_participation: number;
    // ... etc
  };
  top_formations: Array<...>;
  departements: Array<...>;
  tendances: { evolution_inscriptions: Array<...>; };
}
```

### 6. Dashboard Connecté

#### Données réelles affichées:
- Total collaborateurs et taux de participation
- Formations actives et sessions
- Budget consommé
- Graphiques avec vraies données (tendances, départements)

## 🔍 Endpoints API Utilisés

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | Authentification JWT |
| `/api/kpi/dashboard` | GET | KPIs globaux |

## ⚠️ Points d'Attention

### 1. Format d'Authentification
L'API attend du JSON, pas de FormData:
```typescript
// ✅ BON
await apiClient.post('/auth/login', { username, password });

// ❌ MAUVAIS
const formData = new FormData();
formData.append('username', username);
```

### 2. Structure des KPIs
Les données sont imbriquées dans des objets:
```typescript
// ✅ BON
kpis.global.total_collaborateurs

// ❌ MAUVAIS
kpis.total_collaborateurs
```

### 3. Pas de Refresh Token
L'API n'implémente pas le refresh token. En cas d'expiration:
- Redirection automatique vers `/login`
- L'utilisateur doit se reconnecter

## 🚀 Test de la Connexion

### 1. Lancer l'API Backend
```bash
cd C:\wamp64\www\db_formation\API_Formation
.venv\Scripts\activate
uvicorn main:app --reload
```

### 2. Lancer le Frontend
```bash
cd C:\wamp64\www\db_formation\FrontEnd\component_react
npm run dev
```

### 3. Se Connecter
- URL: http://localhost:3000
- Username: `admin`
- Password: `admin123`

## 📊 Résultats

- ✅ Authentification fonctionnelle
- ✅ Token JWT stocké et utilisé
- ✅ Dashboard affiche les vraies données
- ✅ Graphiques mis à jour en temps réel
- ✅ Gestion des erreurs avec notifications

## 🔧 Dépannage

### Erreur 422 au login
- Vérifier que l'API attend bien du JSON
- Vérifier les credentials dans la base

### Erreur CORS
- Vérifier que l'API autorise `http://localhost:3000`
- Relancer l'API si nécessaire

### Dashboard vide
- Vérifier que le token est bien envoyé
- Vérifier la console pour les erreurs 401

## 📝 Notes pour le Développement Futur

1. **Services à créer** pour les autres modules:
   - `collaborateurs.service.ts`
   - `formations.service.ts`
   - `sessions.service.ts`
   - `import.service.ts`

2. **Hooks TanStack Query** recommandés pour:
   - Pagination
   - Filtres
   - Mutations (create, update, delete)

3. **Gestion d'état** avec Zustand pour:
   - Filtres globaux
   - Préférences utilisateur
   - Cache temporaire

---

*Document créé suite à la connexion réussie de l'API le 23/12/2024*