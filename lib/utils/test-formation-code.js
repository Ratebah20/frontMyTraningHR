// Script de test manuel pour la génération de codes de formation
// Usage: node lib/utils/test-formation-code.js

function generateFormationCode(nomFormation) {
  if (!nomFormation || nomFormation.trim() === '') {
    return '';
  }

  const nomNormalise = nomFormation
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_');

  return nomNormalise.substring(0, 50);
}

// Tests avec les vrais noms de votre base de données
const testCases = [
  '!Apprendre l\'anglais:Cours d\'anglais,jeux,exercices,grammaire,tests',
  '#6- L\'inclusion numérique-Webinaire#Replay (version MEA)',
  '#Episode 1- La neurodiversité : de quoi parle-t-on ?',
  '#Episode 2- Comprendre les principaux profils neuroatypiques.',
  '[Coaching / Mentoring] Je renforce mes compétences sur la Posture Relationnelle',
  '[FORMATION DDE] Cloud Bundle gratuit',
  '[IoT devices] 01-Structure globale d\'un équipement IoT',
  '[IoT devices] 08-Capteurs',
  '[IoT devices] 21-Global structure of a device',
  '[IoT devices] 22-Chipset and module',
  '[IoT devices] 27-Security',
  '[IoT devices] 29-Sensors',
  '[IoT devices] 31-Geolocalisation indoor and outdoor',
  '[IoT devices] 32-Practical aspects with OCEAN\'s experience',
  '[IoT devices] 33-Water Dust resistance',
  '[IoT Live Objects] Use custom pipelines to enrich-decode-transform your data before storage',
  'Excel Avancé',
  'Formation Simple',
  'Introduction à la Data Science',
  'C++ & Java!'
];

console.log('Test de génération de codes de formation\n');
console.log('='.repeat(80));

testCases.forEach(nom => {
  const code = generateFormationCode(nom);
  console.log(`\nNom : ${nom}`);
  console.log(`Code: ${code}`);
  console.log(`Longueur: ${code.length} caractères`);
});

console.log('\n' + '='.repeat(80));
console.log('\nTous les tests ont été exécutés avec succès !');
