# 📊 Pages avec Données Mockées

## 📅 Date: 23 Décembre 2024

Ce document liste toutes les pages qui utilisent actuellement des données mockées au lieu de l'API réelle.

## 🎯 Pages avec données mockées

### 1. **Documents** (`/documents`)
**Données mockées :**
- Liste de documents (convocations, présences, attestations, supports)
- Statistiques de stockage (15.2 GB / 50 GB)
- Répartition par type de document

**Raison :** L'API n'a pas encore d'endpoint pour la gestion des documents

**À faire :**
- Créer les endpoints API : `/api/documents`
- Gérer l'upload et le stockage des fichiers
- Calculer les statistiques réelles

### 2. **Sessions > Inscriptions** (`/sessions/inscriptions`)
**Données mockées :**
- Inscriptions en attente (2 exemples)
- Inscriptions confirmées (1 exemple)

**Raison :** L'API n'a pas d'endpoint pour gérer le workflow d'inscription

**À faire :**
- Créer les endpoints : `/api/inscriptions` avec statuts
- Gérer la validation/refus des inscriptions
- Notifications aux collaborateurs

### 3. **KPI > Rapports** (`/kpi/reports`)
**Données mockées :**
- Graphique des tendances mensuelles (6 mois)
- Répartition par département (DonutChart)
- Statistiques de conformité

**Raison :** Endpoints d'analytics avancés non implémentés

**À faire :**
- Implémenter `/api/analytics/trends`
- Calculer les stats par département
- Générer les données historiques

### 4. **KPI > Statistiques** (`/kpi/stats`)
**Données mockées :**
- Taux de complétion (820/1000)
- Budget utilisé (87.5k/125k)
- Performance par département
- Évolution mensuelle des heures
- Alertes et recommandations
- Tableau détaillé par département

**Raison :** Analytics complexes non disponibles dans l'API

**À faire :**
- Endpoints pour métriques détaillées
- Calculs de performance temps réel
- Système d'alertes automatiques

### 5. **Formations > Obligatoires** (`/formations/obligatoires`)
**Données mockées :**
- Statistiques de conformité :
  - 142 collaborateurs conformes
  - 23 en retard
  - 8 non conformes
- Taux de conformité par formation (85%)

**Raison :** Pas de tracking de conformité dans l'API

**À faire :**
- Ajouter le tracking de conformité
- Calculer les deadlines automatiquement
- Générer les rappels

### 6. **Paramètres** (`/settings`)
**Données mockées :**
- Version système (v2.5.0)
- Statut connexion base de données
- Configuration ETL
- Sessions actives

**Raison :** Endpoints système non exposés

**À faire :**
- Endpoint `/api/system/status`
- Gestion des sessions utilisateur
- Configuration dynamique

## 📋 Données réelles utilisées

Ces pages utilisent **100% de données réelles** de l'API :

✅ **Dashboard** - KPIs via `/api/kpi/dashboard`
✅ **Collaborateurs** - Liste et détails
✅ **Formations** - Catalogue complet
✅ **Sessions** - Planning et calendrier
✅ **Import ETL** - Process réel
✅ **Exports** - Génération de documents

## 🚀 Plan de migration

### Phase 1 : APIs critiques
1. Gestion des inscriptions aux sessions
2. Documents et fichiers
3. Statistiques de conformité

### Phase 2 : Analytics
1. Tendances et graphiques
2. Métriques par département
3. Alertes automatiques

### Phase 3 : Système
1. Informations système
2. Configuration dynamique
3. Gestion des sessions

## 💡 Recommandations

1. **Priorité haute** : Remplacer les inscriptions mockées
2. **Priorité moyenne** : Implémenter les analytics
3. **Priorité basse** : Infos système

Les données mockées représentent environ **20%** du frontend et sont principalement dans les modules d'analytics avancés.

---

*Document de référence pour la migration vers 100% de données réelles*