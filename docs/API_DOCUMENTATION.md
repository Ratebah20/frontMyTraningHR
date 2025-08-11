# Documentation API REST - DB_Formation

## Vue d'ensemble

L'API REST DB_Formation permet de gérer l'ensemble du système de formation d'entreprise, incluant l'import ETL, la gestion des collaborateurs, formations, sessions et la génération de documents.

### Informations générales

- **Base URL**: `https://api.dbformation.com/v1`
- **Format**: JSON
- **Authentification**: JWT (JSON Web Token)
- **Pas de système de rôles**: Tous les utilisateurs authentifiés ont accès complet

## Authentification

### `POST /api/auth/login`
Authentifie un utilisateur et retourne un token JWT.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "username": "user@example.com",
    "name": "Nom Utilisateur"
  }
}
```

### `POST /api/auth/refresh`
Rafraîchit un token JWT expirant.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}
```

## Endpoints d'Import ETL

### `POST /api/import/upload`
Upload des fichiers Excel vers le répertoire C:/excel/ avant l'import.

**Request:**
```
Content-Type: multipart/form-data
files: [fichier1.xlsx, fichier2.xlsx, ...]
```

**Response:**
```json
{
  "uploaded_files": ["fichier1.xlsx", "fichier2_20241223_143025.xlsx"],
  "directory": "C:/excel/",
  "success": true,
  "warnings": ["fichier3.txt: Type de fichier non supporté (accepté: .xlsx, .xls)"]
}
```

### `GET /api/import/files`
Liste les fichiers Excel présents dans C:/excel/.

**Response:**
```json
{
  "files": [
    {
      "filename": "SUIVI_FORMATIONS_Draft_Rateb.xlsx",
      "size": 1048576,
      "size_mb": 1.0,
      "modified": "2024-12-23T14:30:00Z",
      "path": "C:/excel/SUIVI_FORMATIONS_Draft_Rateb.xlsx"
    }
  ],
  "count": 1,
  "directory": "C:/excel/"
}
```

### `POST /api/import/start`
Lance un import asynchrone des fichiers Excel depuis le répertoire configuré.

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "started",
  "created_at": "2024-12-22T10:30:00Z",
  "files_detected": [
    "SUIVI_FORMATIONS_Draft_Rateb.xlsx",
    "Copy_of_Rapport_Toutes_les_formations_OLU_au_20241129.xlsx"
  ]
}
```

### `GET /api/import/status/{job_id}`
Récupère le statut détaillé d'un import en cours ou terminé.

**Response:**
```json
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "in_progress",
  "progress": 65,
  "current_file": "SUIVI_FORMATIONS_Draft_Rateb.xlsx",
  "files_processed": 1,
  "files_total": 2,
  "rows_processed": 1250,
  "errors_count": 3,
  "started_at": "2024-12-22T10:30:00Z",
  "details": {
    "collaborateurs_imported": 150,
    "formations_imported": 75,
    "inscriptions_imported": 950
  }
}
```

### `GET /api/import/history`
Récupère l'historique des imports avec pagination et filtres.

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20)
- `status` (string): success|failed|in_progress
- `from_date` (date): Format YYYY-MM-DD
- `to_date` (date): Format YYYY-MM-DD

**Response:**
```json
{
  "data": [
    {
      "job_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "success",
      "started_at": "2024-12-22T10:30:00Z",
      "completed_at": "2024-12-22T10:35:00Z",
      "duration_seconds": 300,
      "files_count": 2,
      "total_rows": 2500,
      "errors_count": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

## Endpoints CRUD

### Collaborateurs

#### `GET /api/collaborateurs`
Liste des collaborateurs avec filtres et pagination.

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 50)
- `search` (string): Recherche dans nom, email
- `departement` (string): Filtrer par département
- `statut` (string): actif|inactif
- `has_formations` (boolean): Avec ou sans formations

**Response:**
```json
{
  "data": [
    {
      "id_collaborateur": "COL001",
      "nom_complet": "Martin Dupont",
      "email": "martin.dupont@example.com",
      "genre": "Homme",
      "departement": "IT",
      "manager": "Sophie Bernard",
      "statut": "Actif",
      "date_entree": "2020-01-15",
      "stats": {
        "formations_count": 5,
        "heures_total": 35.5,
        "cout_total": 2500
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 173
  }
}
```

#### `GET /api/collaborateurs/{id}`
Détails d'un collaborateur spécifique.

#### `GET /api/collaborateurs/{id}/formations`
Historique complet des formations d'un collaborateur.

**Response:**
```json
{
  "collaborateur": {
    "id_collaborateur": "COL001",
    "nom_complet": "Martin Dupont"
  },
  "formations": {
    "completees": [
      {
        "id_inscription": 1,
        "formation": "Excel Avancé",
        "date_debut": "2024-01-15",
        "date_fin": "2024-01-16",
        "statut": "Complété",
        "score_evaluation": 85,
        "heures": 14,
        "cout": 500
      }
    ],
    "en_cours": [],
    "planifiees": [
      {
        "id_inscription": 2,
        "formation": "Management d'équipe",
        "date_debut": "2024-03-20",
        "statut": "Inscrit"
      }
    ]
  },
  "statistiques": {
    "total_heures": 35.5,
    "total_cout": 2500,
    "score_moyen": 87.5,
    "taux_completion": 95
  }
}
```

### Formations

#### `GET /api/formations`
Catalogue des formations disponibles.

**Query Parameters:**
- `page`, `limit`
- `search` (string): Dans titre et description
- `categorie` (string)
- `type_formation` (string)
- `obligatoire` (boolean)
- `organisme` (string)

**Response:**
```json
{
  "data": [
    {
      "id_formation": 1,
      "code_formation": "EXC-ADV-001",
      "titre_formation": "Excel Avancé",
      "categorie": "Bureautique",
      "type_formation": "Technique",
      "duree_heures": 14,
      "obligatoire": false,
      "organismes": ["FormaPro", "TechLearn"],
      "stats": {
        "sessions_count": 5,
        "inscriptions_total": 45,
        "score_moyen": 4.2,
        "taux_completion": 92
      }
    }
  ]
}
```

### Sessions

#### `GET /api/sessions`
Liste des sessions de formation.

**Query Parameters:**
- `from_date`, `to_date`
- `status`: planifiee|en_cours|terminee|annulee
- `formation_id` (int)
- `places_disponibles` (boolean)

**Response:**
```json
{
  "data": [
    {
      "id_session": 1,
      "formation": {
        "id": 1,
        "titre": "Excel Avancé"
      },
      "organisme": "FormaPro",
      "date_debut": "2024-03-20T09:00:00",
      "date_fin": "2024-03-21T17:00:00",
      "lieu": "Paris - Salle A",
      "modalite": "Présentiel",
      "nombre_places": 12,
      "places_occupees": 8,
      "places_disponibles": 4,
      "tarif_ht": 500,
      "statut": "Planifiée"
    }
  ]
}
```

## Endpoints KPIs et Analytics

### `GET /api/kpi/dashboard`
KPIs globaux pour tableau de bord RH.

**Response:**
```json
{
  "periode": {
    "annee": 2024,
    "mois_actuel": 12
  },
  "global": {
    "total_collaborateurs": 173,
    "collaborateurs_formes": 145,
    "taux_participation": 83.8,
    "total_formations": 124,
    "total_sessions": 229,
    "total_inscriptions": 1000,
    "heures_totales": 3420,
    "budget_total": 125000,
    "cout_moyen_par_collaborateur": 862
  },
  "top_formations": [
    {
      "titre": "Excel Avancé",
      "inscriptions": 45,
      "satisfaction": 4.2
    }
  ],
  "departements": [
    {
      "nom": "IT",
      "collaborateurs": 45,
      "taux_formation": 91.1,
      "heures_moyennes": 42.5
    }
  ],
  "tendances": {
    "evolution_inscriptions": [
      {"mois": "01", "count": 78},
      {"mois": "02", "count": 92}
    ]
  }
}
```

### `GET /api/kpi/collaborateurs/{id}`
KPIs détaillés pour un collaborateur.

**Response:**
```json
{
  "collaborateur": {
    "id": "COL001",
    "nom": "Martin Dupont"
  },
  "kpis": {
    "heures_formation_annee": 35.5,
    "heures_formation_total": 125,
    "cout_formation_annee": 2500,
    "nombre_formations_annee": 4,
    "score_moyen": 87.5,
    "taux_completion": 100,
    "formations_obligatoires_completees": 3,
    "formations_obligatoires_manquantes": 0
  },
  "comparaison_departement": {
    "heures_moyennes_dept": 28.5,
    "position": "Au-dessus de la moyenne"
  },
  "evolution": [
    {"annee": 2022, "heures": 28},
    {"annee": 2023, "heures": 32},
    {"annee": 2024, "heures": 35.5}
  ]
}
```

### `GET /api/kpi/departements/{id}`
Analytics détaillés par département.

### `GET /api/kpi/formations/efficacite`
Analyse de l'efficacité des formations et organismes.

## Endpoints de Réconciliation

### `GET /api/reconciliation/pending`
Liste des données nécessitant une réconciliation manuelle.

**Response:**
```json
{
  "collaborateurs": [
    {
      "id": "-1",
      "source_reference": "Orange Learning User 12345",
      "reconciliation_notes": "Collaborateur non trouvé dans la base",
      "inscriptions_count": 3
    }
  ],
  "formations": [
    {
      "id": -1,
      "source_reference": "Formation Excel Basic",
      "sessions_count": 2
    }
  ]
}
```

### `POST /api/reconciliation/resolve`
Résout une réconciliation en liant les données.

**Request Body:**
```json
{
  "type": "collaborateur",
  "source_id": "-1",
  "target_id": "COL123",
  "notes": "Correspondance trouvée - Nom différent dans Orange Learning"
}
```

## Exports et Documents

### `GET /api/export/reports/{type}`
Génère et télécharge des rapports.

**Types disponibles:**
- `bilan-annuel`: Bilan complet de l'année
- `suivi-obligatoires`: Suivi des formations obligatoires
- `budget-detail`: Détail budgétaire par département
- `collaborateur-formations`: Historique par collaborateur

**Query Parameters:**
- `format`: excel|pdf (default: excel)
- `year` (int): Année du rapport
- `departement_id` (int, optional)

**Response:** Fichier binaire avec headers appropriés

### `GET /api/documents/convocation/{session_id}`
Génère une convocation de formation pour une session.

**Query Parameters:**
- `format`: pdf (default)

**Response:** PDF avec les informations:
- Nom de la formation
- Organisme formation
- Contact organisme
- Participants
- Langue(s)
- Date(s) et horaires
- Durée
- Format (présentiel/visio)
- Lieu (si présentiel)
- Commentaires

### `GET /api/documents/presence/{session_id}`
Génère une feuille de présence pour signature.

**Response:** PDF avec:
- Nom de la formation
- Date
- Nom formateur
- Durée
- Localisation
- Tableau: Nom, Prénom, Société, Signature
- Zone signature formateur

### `POST /api/documents/presence/{session_id}/sign`
Soumet une feuille de présence signée.

**Request Body:**
```json
{
  "signatures": [
    {
      "collaborateur_id": "COL001",
      "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANS..."
    }
  ],
  "formateur_signature": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "date_signature": "2024-12-22T10:30:00Z"
}
```

**Note:** Les signatures sont des images base64 du dessin de signature.

## Endpoints Avancés

### `GET /api/analytics/trends`
Analyse des tendances et projections.

**Query Parameters:**
- `metric`: heures_formation|inscriptions|budget
- `period`: daily|weekly|monthly|yearly
- `year` (int)
- `departement_id` (int, optional)

### `POST /api/search/global`
Recherche globale dans toutes les entités.

**Request Body:**
```json
{
  "query": "Excel",
  "types": ["formations", "collaborateurs", "sessions"]
}
```

### `GET /api/stats/quality`
Statistiques de qualité des données.

**Response:**
```json
{
  "collaborateurs": {
    "total": 173,
    "avec_email": 168,
    "avec_manager": 145,
    "avec_departement": 160,
    "completude": 87.5
  },
  "formations": {
    "total": 124,
    "avec_duree": 120,
    "avec_organisme": 115,
    "completude": 92.3
  },
  "donnees_reconciliation": {
    "en_attente": 5,
    "resolues": 45
  }
}
```

## Codes d'erreur

- `200 OK`: Succès
- `201 Created`: Ressource créée
- `400 Bad Request`: Requête invalide
- `401 Unauthorized`: Token manquant ou invalide
- `404 Not Found`: Ressource non trouvée
- `422 Unprocessable Entity`: Données invalides
- `500 Internal Server Error`: Erreur serveur

## Format des erreurs

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Les données fournies sont invalides",
    "details": {
      "email": "Format email invalide",
      "date_debut": "La date de début doit être future"
    }
  }
}
```

## Pagination

Tous les endpoints de liste supportent la pagination:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "pages": 13,
    "has_next": true,
    "has_prev": false
  }
}
```

## Limites et quotas

- Taille maximale requête: 10MB
- Rate limiting: 1000 requêtes/heure
- Timeout: 30 secondes
- Import ETL: 1 job concurrent maximum