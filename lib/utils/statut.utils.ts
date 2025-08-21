/**
 * Utilitaires pour gérer les différentes variantes de statuts
 * provenant des fichiers Excel et autres sources
 */

export class StatutUtils {
  /**
   * Vérifie si un statut indique que la formation est complétée
   * Gère toutes les variantes possibles (terminé, TERMINE, complété, etc.)
   */
  static isComplete(statut: string | null | undefined): boolean {
    if (!statut) return false;
    const statutLower = statut.toLowerCase().trim();
    return (
      statutLower.includes('terminé') ||
      statutLower.includes('termine') ||
      statutLower.includes('complété') ||
      statutLower.includes('complete') ||
      statutLower.includes('completed') ||
      statutLower.includes('achevé') ||
      statutLower.includes('acheve') ||
      statutLower.includes('fini') ||
      statutLower.includes('réussi') ||
      statutLower.includes('reussi') ||
      statutLower === 'done' ||
      statutLower === 'ok'
    );
  }

  /**
   * Vérifie si un statut indique que la formation est en cours
   */
  static isEnCours(statut: string | null | undefined): boolean {
    if (!statut) return false;
    const statutLower = statut.toLowerCase().trim();
    return (
      statutLower.includes('en cours') ||
      statutLower.includes('en-cours') ||
      statutLower.includes('encours') ||
      statutLower.includes('démarré') ||
      statutLower.includes('demarre') ||
      statutLower.includes('commencé') ||
      statutLower.includes('commence') ||
      statutLower.includes('in progress') ||
      statutLower.includes('ongoing') ||
      statutLower.includes('started')
    );
  }

  /**
   * Vérifie si un statut indique que la formation est annulée
   */
  static isAnnule(statut: string | null | undefined): boolean {
    if (!statut) return false;
    const statutLower = statut.toLowerCase().trim();
    return (
      statutLower.includes('annulé') ||
      statutLower.includes('annule') ||
      statutLower.includes('abandonné') ||
      statutLower.includes('abandonne') ||
      statutLower.includes('cancelled') ||
      statutLower.includes('canceled') ||
      statutLower.includes('cancel') ||
      statutLower.includes('supprimé') ||
      statutLower.includes('supprime')
    );
  }

  /**
   * Vérifie si un statut indique que la formation est planifiée/inscrite
   */
  static isInscrit(statut: string | null | undefined): boolean {
    if (!statut) return false;
    const statutLower = statut.toLowerCase().trim();
    return (
      statutLower.includes('inscrit') ||
      statutLower.includes('planifié') ||
      statutLower.includes('planifie') ||
      statutLower.includes('prévu') ||
      statutLower.includes('prevu') ||
      statutLower.includes('à venir') ||
      statutLower.includes('a venir') ||
      statutLower.includes('scheduled') ||
      statutLower.includes('planned') ||
      statutLower.includes('pending')
    );
  }

  /**
   * Retourne la couleur appropriée pour un statut
   */
  static getStatusColor(statut: string | null | undefined): string {
    if (this.isComplete(statut)) return 'green';
    if (this.isEnCours(statut)) return 'blue';
    if (this.isInscrit(statut)) return 'gray';
    if (this.isAnnule(statut)) return 'red';
    return 'gray';
  }

  /**
   * Retourne le label approprié pour un statut
   */
  static getStatusLabel(statut: string | null | undefined): string {
    if (this.isComplete(statut)) return 'Terminée';
    if (this.isEnCours(statut)) return 'En cours';
    if (this.isInscrit(statut)) return 'Inscrit';
    if (this.isAnnule(statut)) return 'Annulée';
    return statut || 'Inconnu';
  }

  /**
   * Retourne l'icône appropriée pour un statut
   * Nécessite les imports des icônes phosphor
   */
  static getStatusIcon(statut: string | null | undefined): string {
    if (this.isComplete(statut)) return 'CheckCircle';
    if (this.isEnCours(statut)) return 'Clock';
    if (this.isInscrit(statut)) return 'CalendarCheck';
    if (this.isAnnule(statut)) return 'XCircle';
    return 'Question';
  }
}