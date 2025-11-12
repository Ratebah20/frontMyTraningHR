import { generateFormationCode, isValidFormationCode } from './formation';

describe('generateFormationCode', () => {
  it('devrait générer un code simple', () => {
    expect(generateFormationCode('Formation Simple')).toBe('FORMATION_SIMPLE');
  });

  it('devrait supprimer les accents', () => {
    expect(generateFormationCode('Développement écologique')).toBe('DEVELOPPEMENT_ECOLOGIQUE');
    expect(generateFormationCode('Excel Avancé')).toBe('EXCEL_AVANCE');
  });

  it('devrait convertir en majuscules', () => {
    expect(generateFormationCode('excel avancé')).toBe('EXCEL_AVANCE');
    expect(generateFormationCode('Introduction à la Data Science')).toBe('INTRODUCTION_A_LA_DATA_SCIENCE');
  });

  it('devrait remplacer les caractères spéciaux par underscore', () => {
    expect(generateFormationCode('C++ & Java!')).toBe('C____JAVA_');
    expect(generateFormationCode('Excel 2.0 - Avancé')).toBe('EXCEL_2_0___AVANCE');
    expect(generateFormationCode('!Apprendre l\'anglais:Cours')).toBe('_APPRENDRE_L_ANGLAIS_COURS');
  });

  it('devrait gérer les espaces multiples', () => {
    expect(generateFormationCode('Formation   Excel')).toBe('FORMATION___EXCEL');
  });

  it('devrait limiter à 50 caractères', () => {
    const longName = 'Formation très très très longue qui dépasse largement les 50 caractères autorisés';
    const code = generateFormationCode(longName);
    expect(code).toBe('FORMATION_TRES_TRES_TRES_LONGUE_QUI_DEPASSE_LAR');
    expect(code.length).toBe(50);
  });

  it('devrait retourner une chaîne vide pour une entrée vide', () => {
    expect(generateFormationCode('')).toBe('');
    expect(generateFormationCode('   ')).toBe('');
  });

  it('devrait gérer les caractères Unicode complexes', () => {
    expect(generateFormationCode('Café & Thé')).toBe('CAFE___THE');
    expect(generateFormationCode('Programmation C#')).toBe('PROGRAMMATION_C_');
  });

  // Tests basés sur les exemples réels de votre base de données
  it('devrait générer des codes cohérents avec les noms réels', () => {
    expect(generateFormationCode('[IoT devices] 21-Global structure of a device'))
      .toBe('_IOT_DEVICES__21_GLOBAL_STRUCTURE_OF_A_DEVICE');

    expect(generateFormationCode('#Episode 1- La neurodiversité : de quoi parle-t-on ?'))
      .toBe('_EPISODE_1__LA_NEURODIVERSITE___DE_QUOI_PARLE_');

    expect(generateFormationCode('[Coaching / Mentoring] Posture Relationnelle'))
      .toBe('_COACHING___MENTORING__POSTURE_RELATIONNELLE');
  });
});

describe('isValidFormationCode', () => {
  it('devrait accepter les codes valides', () => {
    expect(isValidFormationCode('EXCEL_AVANCE')).toBe(true);
    expect(isValidFormationCode('FORMATION_SIMPLE')).toBe(true);
    expect(isValidFormationCode('ABC123')).toBe(true);
  });

  it('devrait rejeter les codes trop courts', () => {
    expect(isValidFormationCode('AB')).toBe(false);
    expect(isValidFormationCode('A')).toBe(false);
  });

  it('devrait rejeter les codes trop longs', () => {
    const longCode = 'A'.repeat(51);
    expect(isValidFormationCode(longCode)).toBe(false);
  });

  it('devrait rejeter les codes avec caractères invalides', () => {
    expect(isValidFormationCode('excel-avancé')).toBe(false);
    expect(isValidFormationCode('Excel Avancé')).toBe(false);
    expect(isValidFormationCode('excel@avance')).toBe(false);
  });

  it('devrait rejeter les codes vides', () => {
    expect(isValidFormationCode('')).toBe(false);
    expect(isValidFormationCode('   ')).toBe(false);
  });
});
