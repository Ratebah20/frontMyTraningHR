/**
 * Agrégation côté client des retours d'évaluation d'une session.
 *
 * L'endpoint `GET /evaluations/session/:type/:sessionId` renvoie la liste brute
 * des invitations (une par destinataire) avec, pour chacune, le questionnaire
 * utilisé et les réponses saisies. Tout le reste — taux de réponse, moyennes,
 * répartitions, colonnes du CSV — est calculé ici, sans appel supplémentaire.
 */

import type {
  EvaluationMoment,
  EvaluationQuestionAggregate,
  EvaluationRepartitionItem,
  EvaluationReponseTexte,
  Question,
  QuestionType,
  SessionEvaluation,
  SessionEvaluationsAggregate,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Questionnaires historiques
// ---------------------------------------------------------------------------

/**
 * Avant les questionnaires personnalisés, le formulaire public était câblé en
 * dur : `evaluation.questionnaire` vaut alors `null` et les clés de `reponses`
 * sont techniques. On reconstitue un questionnaire synthétique pour que le
 * reste du code (agrégation, tableau nominatif, CSV) n'ait qu'un seul cas à
 * traiter. Libellés repris du formulaire public `/evaluation/[token]`.
 */
export const LEGACY_QUESTIONS: Record<EvaluationMoment, Question[]> = {
  chaud: [
    { id: 'noteGlobale', libelle: 'Note globale de la formation', type: 'note', obligatoire: true, ordre: 1 },
    { id: 'noteContenu', libelle: 'Qualité du contenu', type: 'note', obligatoire: true, ordre: 2 },
    { id: 'noteFormateur', libelle: 'Qualité du formateur', type: 'note', obligatoire: true, ordre: 3 },
    { id: 'commentaire', libelle: 'Commentaire', type: 'texte', obligatoire: false, ordre: 4 },
  ],
  froid: [
    {
      id: 'competencesMisesEnPratique',
      libelle: 'Les compétences acquises ont-elles été mises en pratique ?',
      type: 'choix',
      obligatoire: true,
      options: ['oui', 'partiellement', 'non'],
      ordre: 1,
    },
    {
      id: 'impactObserve',
      libelle: 'Impact observé sur le travail du collaborateur',
      type: 'texte',
      obligatoire: false,
      ordre: 2,
    },
    {
      id: 'noteUtilite',
      libelle: 'Utilité de la formation pour le poste',
      type: 'note',
      obligatoire: true,
      ordre: 3,
    },
  ],
};

/** Repli global clé technique -> libellé lisible, tous moments confondus. */
const LEGACY_LABELS: Record<string, string> = [
  ...LEGACY_QUESTIONS.chaud,
  ...LEGACY_QUESTIONS.froid,
].reduce<Record<string, string>>((acc, question) => {
  acc[question.id] = question.libelle;
  return acc;
}, {});

/**
 * Libellé lisible d'une clé de réponse inconnue.
 * Repli final : la clé brute, jamais une chaîne vide.
 */
export function labelForUnknownKey(key: string): string {
  return LEGACY_LABELS[key] || key;
}

/** Devine le type d'une clé technique non répertoriée (repli tolérant). */
function guessQuestionType(key: string): QuestionType {
  const lower = key.toLowerCase();
  if (lower.startsWith('note') || lower.endsWith('note')) return 'note';
  return 'texte';
}

/** Questions applicables à une évaluation, questionnaire personnalisé ou repli. */
export function getQuestionsForEvaluation(
  evaluation: SessionEvaluation,
  moment: EvaluationMoment,
): Question[] {
  const questions = evaluation.questionnaire?.questions;
  if (questions && questions.length > 0) {
    return [...questions].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  }
  return LEGACY_QUESTIONS[moment] || [];
}

// ---------------------------------------------------------------------------
// Normalisation des valeurs
// ---------------------------------------------------------------------------

/**
 * Une réponse existe-t-elle ? `false` et `0` sont des réponses VALIDES :
 * on ne teste jamais la véracité de la valeur.
 */
export function hasAnswer(value: any): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** Convertit une note en nombre, quelle que soit sa représentation. */
export function toNoteNumber(value: any): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Normalise une réponse oui/non : booléen, 'oui'/'non', 1/0... */
function normalizeOuiNon(value: any): string {
  if (value === true) return 'Oui';
  if (value === false) return 'Non';
  const raw = String(value).trim().toLowerCase();
  if (['oui', 'yes', 'true', '1'].includes(raw)) return 'Oui';
  if (['non', 'no', 'false', '0'].includes(raw)) return 'Non';
  return String(value);
}

/** Première lettre en majuscule, pour les valeurs de type 'choix'. */
function prettify(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Représentation textuelle d'une réponse, utilisée à l'affichage ET dans le CSV.
 * Retourne une chaîne vide quand il n'y a pas de réponse.
 */
export function formatAnswerValue(type: QuestionType, value: any): string {
  if (!hasAnswer(value)) return '';

  if (Array.isArray(value)) {
    return value.map((item) => formatAnswerValue(type, item)).filter(Boolean).join(', ');
  }

  switch (type) {
    case 'note': {
      const note = toNoteNumber(value);
      return note === null ? String(value) : String(note);
    }
    case 'oui_non':
      return normalizeOuiNon(value);
    case 'choix':
      return prettify(String(value).trim());
    case 'texte':
    default:
      return String(value).trim();
  }
}

/** Clé de regroupement d'une réponse dans une répartition. */
function groupingKey(type: QuestionType, value: any): string {
  return formatAnswerValue(type, value);
}

// ---------------------------------------------------------------------------
// Agrégation
// ---------------------------------------------------------------------------

interface ColumnDef {
  id: string;
  libelle: string;
  type: QuestionType;
  ordre: number;
}

/**
 * Colonnes de l'ensemble des évaluations d'un même moment.
 *
 * Deux questionnaires différents peuvent avoir servi sur une même session
 * (ou un questionnaire personnalisé cohabiter avec des évaluations
 * historiques) : les colonnes sont donc l'UNION des questions rencontrées.
 * Ordre : questions déclarées (dans l'ordre du questionnaire, questionnaires
 * dans l'ordre de première apparition), puis clés brutes non déclarées.
 */
function buildColumns(evaluations: SessionEvaluation[], moment: EvaluationMoment): ColumnDef[] {
  const columns = new Map<string, ColumnDef>();

  // 1er passage : les questions déclarées (questionnaire ou repli historique)
  evaluations.forEach((evaluation) => {
    getQuestionsForEvaluation(evaluation, moment).forEach((question) => {
      if (!columns.has(question.id)) {
        columns.set(question.id, {
          id: question.id,
          libelle: question.libelle || labelForUnknownKey(question.id),
          type: question.type,
          ordre: question.ordre ?? 0,
        });
      }
    });
  });

  // 2e passage : les clés présentes dans les réponses mais jamais déclarées
  evaluations.forEach((evaluation) => {
    Object.keys(evaluation.reponses || {}).forEach((key) => {
      if (!columns.has(key)) {
        columns.set(key, {
          id: key,
          libelle: labelForUnknownKey(key),
          type: guessQuestionType(key),
          ordre: Number.MAX_SAFE_INTEGER,
        });
      }
    });
  });

  return Array.from(columns.values());
}

function computeRepartition(values: string[]): EvaluationRepartitionItem[] {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));

  const total = values.length;
  return Array.from(counts.entries())
    .map(([valeur, nombre]) => ({
      valeur,
      nombre,
      pourcentage: total > 0 ? Math.round((nombre / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => {
      // Les notes se lisent dans l'ordre croissant, le reste par fréquence
      const na = Number(a.valeur);
      const nb = Number(b.valeur);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return b.nombre - a.nombre;
    });
}

/**
 * Agrège toutes les évaluations d'un moment donné (chaud OU froid).
 * `evaluations` doit déjà être filtré sur ce moment.
 */
export function aggregateSessionEvaluations(
  evaluations: SessionEvaluation[],
  moment: EvaluationMoment,
): SessionEvaluationsAggregate {
  const envoyees = evaluations.length;
  const repondues = evaluations.filter((e) => e.statut === 'complete').length;
  const tauxReponse = envoyees > 0 ? Math.round((repondues / envoyees) * 1000) / 10 : 0;

  const columns = buildColumns(evaluations, moment);

  // Toutes les notes brutes, tous questionnaires confondus : la moyenne
  // globale est la moyenne des réponses notées (et non la moyenne des moyennes).
  const toutesLesNotes: number[] = [];

  const questions: EvaluationQuestionAggregate[] = columns.map((column) => {
    const valeursBrutes: any[] = [];
    const reponsesTexte: EvaluationReponseTexte[] = [];
    const notes: number[] = [];

    evaluations.forEach((evaluation) => {
      const value = evaluation.reponses?.[column.id];
      if (!hasAnswer(value)) return;

      valeursBrutes.push(value);

      if (column.type === 'texte') {
        reponsesTexte.push({
          collaborateurNom: evaluation.collaborateurNom,
          valeur: formatAnswerValue('texte', value),
          date: evaluation.dateReponse,
        });
      } else if (column.type === 'note') {
        const note = toNoteNumber(value);
        if (note !== null) {
          notes.push(note);
          toutesLesNotes.push(note);
        }
      }
    });

    const moyenne = notes.length > 0
      ? Math.round((notes.reduce((sum, n) => sum + n, 0) / notes.length) * 100) / 100
      : null;

    const repartition = column.type === 'texte'
      ? []
      : computeRepartition(
          valeursBrutes.map((value) => groupingKey(column.type, value)).filter((v) => v !== ''),
        );

    return {
      id: column.id,
      libelle: column.libelle,
      type: column.type,
      ordre: column.ordre,
      nombreReponses: valeursBrutes.length,
      moyenne,
      repartition,
      reponsesTexte,
    };
  });

  const moyenneGlobale = toutesLesNotes.length > 0
    ? Math.round((toutesLesNotes.reduce((sum, n) => sum + n, 0) / toutesLesNotes.length) * 100) / 100
    : null;

  const questionnaireNoms = Array.from(
    new Set(
      evaluations
        .map((evaluation) => evaluation.questionnaire?.nom)
        .filter((nom): nom is string => Boolean(nom)),
    ),
  );

  return {
    moment,
    envoyees,
    repondues,
    tauxReponse,
    moyenneGlobale,
    questions,
    destinataires: evaluations,
    questionnaireNoms,
  };
}

// ---------------------------------------------------------------------------
// Export CSV (généré entièrement côté client)
// ---------------------------------------------------------------------------

const CSV_SEPARATOR = ';';

/** Échappe une valeur pour un CSV point-virgule. */
function escapeCsvValue(value: string): string {
  if (value === '') return '';
  if (/[;"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDateForCsv(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('fr-FR');
}

/**
 * Construit le contenu CSV : une ligne par destinataire (répondants ET
 * non-répondants), une colonne par question, en-têtes = libellés.
 */
export function buildEvaluationsCsv(aggregate: SessionEvaluationsAggregate): string {
  const headers = [
    'Collaborateur',
    'Email',
    'Statut',
    "Date d'envoi",
    'Date de réponse',
    ...aggregate.questions.map((question) => question.libelle),
  ];

  const rows = aggregate.destinataires.map((evaluation) => [
    evaluation.collaborateurNom || '',
    evaluation.destinataireEmail || '',
    evaluation.statut === 'complete' ? 'Répondu' : 'En attente',
    formatDateForCsv(evaluation.dateEnvoi),
    formatDateForCsv(evaluation.dateReponse),
    ...aggregate.questions.map((question) =>
      formatAnswerValue(question.type, evaluation.reponses?.[question.id]),
    ),
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(CSV_SEPARATOR))
    .join('\r\n');
}

/** Déclenche le téléchargement d'un CSV encodé UTF-8 avec BOM (Excel). */
export function downloadCsv(filename: string, content: string): void {
  // Le BOM (U+FEFF) est indispensable pour qu'Excel interprète l'UTF-8
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
