'use client';

import { useState } from 'react';
import { Button, Menu, ActionIcon, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  FilePdf,
  Envelope,
  ClipboardText,
  CaretDown,
  Printer,
} from '@phosphor-icons/react';
import { GroupedSession, CollectiveSession, UnifiedSession } from '@/lib/types';
import {
  mapGroupedSessionToConvocation,
  mapCollectiveSessionToConvocation,
} from './ConvocationTemplate';
import {
  mapGroupedSessionToFichePresence,
  mapCollectiveSessionToFichePresence,
} from './FichePresenceTemplate';
import { FichePresenceModal } from './FichePresenceModal';

type SessionType = GroupedSession | CollectiveSession | UnifiedSession | any;

interface DocumentGeneratorProps {
  session: SessionType;
  sessionType: 'grouped' | 'collective' | 'unified';
  variant?: 'button' | 'menu' | 'icon';
}

function isGroupedSession(session: SessionType): session is GroupedSession {
  return 'groupKey' in session && 'stats' in session;
}

function isUnifiedSession(session: SessionType): session is UnifiedSession {
  return 'type' in session && (session.type === 'individuelle' || session.type === 'collective');
}

// Extraire le nom de la formation depuis différentes structures possibles
function getFormationNom(session: any): string {
  // Priorité 1: formation.nom (format API sessions/:id)
  if (session.formation?.nom) return session.formation.nom;
  // Priorité 2: formation.nomFormation (format complet)
  if (session.formation?.nomFormation) return session.formation.nomFormation;
  // Priorité 3: formationNom direct (format groupé)
  if (session.formationNom) return session.formationNom;
  // Priorité 4: titre de session collective
  if (session.titre) return session.titre;
  return '';
}

// Extraire le nom de l'organisme depuis différentes structures possibles
function getOrganismeNom(session: any): string {
  // Priorité 1: organisme.nom (format API sessions/:id)
  if (session.organisme?.nom) return session.organisme.nom;
  // Priorité 2: organisme.nomOrganisme (format complet)
  if (session.organisme?.nomOrganisme) return session.organisme.nomOrganisme;
  // Priorité 3: organismeNom direct (format groupé)
  if (session.organismeNom) return session.organismeNom;
  return '';
}

// Extraire le contact de l'organisme
function getOrganismeContact(session: any): string {
  if (session.organisme?.contact) return session.organisme.contact;
  if (session.formateurContact) return session.formateurContact;
  return '';
}

// Extraire la durée en heures
function getDureeHeures(session: any): number | undefined {
  if (session.dureeHeures) return session.dureeHeures;
  if (session.dureePrevue) return session.dureePrevue;
  if (session.formation?.dureeHeures) return session.formation.dureeHeures;
  if (session.formation?.dureePrevue) return session.formation.dureePrevue;
  return undefined;
}

// Mapper une session unifiée vers les données de convocation
function mapUnifiedSessionToConvocation(session: any) {
  const participants: Array<{ nom: string; prenom: string }> = [];

  // Session collective avec participants
  if (session.type === 'collective' && session.participants) {
    session.participants.forEach((p: any) => {
      if (p.collaborateur) {
        participants.push({
          nom: p.collaborateur.nom || '',
          prenom: p.collaborateur.prenom || '',
        });
      }
    });
  }
  // Session individuelle avec collaborateur
  else if (session.collaborateur) {
    participants.push({
      nom: session.collaborateur.nom || '',
      prenom: session.collaborateur.prenom || '',
    });
  }

  return {
    formationNom: getFormationNom(session),
    organismeNom: getOrganismeNom(session),
    organismeContact: getOrganismeContact(session),
    participants,
    dateDebut: session.dateDebut,
    dateFin: session.dateFin,
    heureDebut: session.heureDebut,
    heureFin: session.heureFin,
    dureeHeures: getDureeHeures(session),
    format: session.modalite === 'presentiel' ? 'Présentiel' :
            session.modalite === 'distanciel' ? 'À distance' :
            session.modalite === 'hybride' ? 'Hybride' : 'Présentiel',
    lieu: session.lieu || '',
    commentaire: session.commentaire || session.description || '',
  };
}

// Mapper une session unifiée vers les données de fiche de présence
function mapUnifiedSessionToFichePresence(session: any) {
  const participants: Array<{ nom: string; prenom: string; societe?: string }> = [];

  // Session collective avec participants
  if (session.type === 'collective' && session.participants) {
    session.participants.forEach((p: any) => {
      if (p.collaborateur) {
        participants.push({
          nom: p.collaborateur.nom || '',
          prenom: p.collaborateur.prenom || '',
          societe: 'Orange Luxembourg',
        });
      }
    });
  }
  // Session individuelle avec collaborateur
  else if (session.collaborateur) {
    participants.push({
      nom: session.collaborateur.nom || '',
      prenom: session.collaborateur.prenom || '',
      societe: 'Orange Luxembourg',
    });
  }

  const lieu = session.lieu || '';
  const isBertrange = lieu.toLowerCase().includes('bertrange');

  return {
    formationNom: getFormationNom(session),
    formateurNom: session.formateurNom || '',
    date: session.dateDebut,
    dureeHeures: getDureeHeures(session),
    lieu: lieu,
    lieuExterne: !isBertrange && lieu ? lieu : undefined,
    participants,
  };
}

function generatePrintableHTML(content: string, title: string): string {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f0f0f0;
          display: flex;
          justify-content: center;
          padding: 20px;
        }
        @media print {
          body {
            background-color: white;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}

export function DocumentGenerator({
  session,
  sessionType,
  variant = 'menu',
}: DocumentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [fichePresenceModalOpened, setFichePresenceModalOpened] = useState(false);

  // Préparer les données pour la fiche de présence
  const getFichePresenceData = () => {
    let data;
    if (sessionType === 'unified' || isUnifiedSession(session)) {
      data = mapUnifiedSessionToFichePresence(session);
    } else if (isGroupedSession(session)) {
      data = mapGroupedSessionToFichePresence(session);
    } else {
      data = mapCollectiveSessionToFichePresence(session as CollectiveSession);
    }
    return data;
  };

  const generateConvocation = async () => {
    setIsGenerating(true);

    try {
      let data;
      if (sessionType === 'unified' || isUnifiedSession(session)) {
        data = mapUnifiedSessionToConvocation(session);
      } else if (isGroupedSession(session)) {
        data = mapGroupedSessionToConvocation(session);
      } else {
        data = mapCollectiveSessionToConvocation(session as CollectiveSession);
      }

      const title = `Convocation - ${data.formationNom}`;
      const htmlContent = generateConvocationHTML(data);

      // Ouvrir dans une nouvelle fenêtre pour impression
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generatePrintableHTML(htmlContent, title));
        printWindow.document.close();

        // Attendre le chargement puis imprimer
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 250);
        };

        notifications.show({
          title: 'Document généré',
          message: 'Une fenêtre d\'impression s\'est ouverte. Vous pouvez enregistrer en PDF.',
          color: 'green',
        });
      } else {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression');
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      notifications.show({
        title: 'Erreur',
        message: 'Erreur lors de la génération du document',
        color: 'red',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const openFichePresenceModal = () => {
    setFichePresenceModalOpened(true);
  };

  if (variant === 'icon') {
    return (
      <>
        <FichePresenceModal
          opened={fichePresenceModalOpened}
          onClose={() => setFichePresenceModalOpened(false)}
          data={getFichePresenceData()}
        />
        <Menu shadow="md" width={200}>
          <Menu.Target>
            <Tooltip label="Générer des documents">
              <ActionIcon variant="light" color="orange" loading={isGenerating}>
                <FilePdf size={18} />
              </ActionIcon>
            </Tooltip>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Documents</Menu.Label>
            <Menu.Item
              leftSection={<Envelope size={16} />}
              onClick={generateConvocation}
            >
              Convocation
            </Menu.Item>
            <Menu.Item
              leftSection={<ClipboardText size={16} />}
              onClick={openFichePresenceModal}
            >
              Fiche de présence
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </>
    );
  }

  if (variant === 'button') {
    return (
      <>
        <FichePresenceModal
          opened={fichePresenceModalOpened}
          onClose={() => setFichePresenceModalOpened(false)}
          data={getFichePresenceData()}
        />
        <Menu shadow="md" width={220}>
          <Menu.Target>
            <Button
              variant="light"
              color="orange"
              leftSection={<FilePdf size={18} />}
              rightSection={<CaretDown size={14} />}
              loading={isGenerating}
            >
              Documents
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Générer un document</Menu.Label>
            <Menu.Item
              leftSection={<Envelope size={16} />}
              onClick={generateConvocation}
            >
              Convocation formation
            </Menu.Item>
            <Menu.Item
              leftSection={<ClipboardText size={16} />}
              onClick={openFichePresenceModal}
            >
              Fiche de présence
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </>
    );
  }

  // Default: menu variant
  return (
    <>
      <FichePresenceModal
        opened={fichePresenceModalOpened}
        onClose={() => setFichePresenceModalOpened(false)}
        data={getFichePresenceData()}
      />
      <Menu shadow="md" width={220}>
        <Menu.Target>
          <Button
            variant="outline"
            color="orange"
            leftSection={<Printer size={18} />}
            rightSection={<CaretDown size={14} />}
            loading={isGenerating}
          >
            Imprimer
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Documents imprimables</Menu.Label>
          <Menu.Item
            leftSection={<Envelope size={16} />}
            onClick={generateConvocation}
          >
            Convocation formation
          </Menu.Item>
          <Menu.Item
            leftSection={<ClipboardText size={16} />}
            onClick={openFichePresenceModal}
          >
            Fiche de présence
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
}

// Fonctions de génération HTML
function generateConvocationHTML(data: {
  formationNom: string;
  organismeNom?: string;
  organismeContact?: string;
  participants: Array<{ nom: string; prenom: string }>;
  langue?: string;
  dateDebut?: string;
  dateFin?: string;
  heureDebut?: string;
  heureFin?: string;
  dureeHeures?: number;
  format?: string;
  lieu?: string;
  commentaire?: string;
}): string {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatDuree = () => {
    if (!data.dureeHeures) return '';
    if (data.dureeHeures >= 8) {
      const jours = Math.floor(data.dureeHeures / 8);
      const heuresRestantes = data.dureeHeures % 8;
      if (heuresRestantes > 0) {
        return `${jours} jour(s) et ${heuresRestantes} heure(s)`;
      }
      return `${jours} jour(s)`;
    }
    return `${data.dureeHeures} heure(s)`;
  };

  const formatHoraires = () => {
    if (data.heureDebut && data.heureFin) {
      return `${data.heureDebut} - ${data.heureFin}`;
    }
    return '9h00 - 17h00';
  };

  const participantsList = data.participants
    .map(p => `${p.nom.toUpperCase()} ${p.prenom}`)
    .join('<br>');

  const dateDisplay = formatDate(data.dateDebut) +
    (data.dateFin && data.dateFin !== data.dateDebut ? ` - ${formatDate(data.dateFin)}` : '');

  return `
    <div style="background-color: white; width: 210mm; min-height: 297mm; padding: 40px; box-sizing: border-box; font-family: Arial, sans-serif; position: relative;">
      <div style="width: 60px; height: 60px; background-color: #F16E00; color: white; font-weight: bold; display: flex; align-items: flex-end; padding: 5px; font-size: 14px; margin-bottom: 20px;">
        orange<sup>TM</sup>
      </div>

      <div style="text-align: center; font-size: 14px; margin-bottom: 20px;">
        Convocation formation - ${data.formationNom}
      </div>

      <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; font-size: 14px;">
        <thead>
          <tr>
            <th colspan="2" style="background-color: #e0e0e0; color: #F16E00; text-align: center; font-weight: bold; font-size: 18px; padding: 15px; text-transform: uppercase; border: 1px solid #000;">
              CONVOCATION FORMATION
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="background-color: #e6e6e6; width: 30%; border: 1px solid #000; padding: 8px;">Nom de la formation :</td>
            <td style="border: 1px solid #000; padding: 8px;">${data.formationNom}</td>
          </tr>
          <tr>
            <td style="background-color: #e6e6e6; width: 30%; border: 1px solid #000; padding: 8px;">Organisme de formation :</td>
            <td style="border: 1px solid #000; padding: 8px;">${data.organismeNom || 'Non défini'}</td>
          </tr>
          <tr>
            <td style="background-color: #e6e6e6; width: 30%; border: 1px solid #000; padding: 8px;">Contact organisme :</td>
            <td style="border: 1px solid #000; padding: 8px;">${data.organismeContact || ''}</td>
          </tr>
          <tr>
            <td style="background-color: #e6e6e6; width: 30%; border: 1px solid #000; padding: 8px; vertical-align: top;">Participant(s) :</td>
            <td style="border: 1px solid #000; padding: 8px; line-height: 1.4;">${participantsList}</td>
          </tr>
          <tr>
            <td style="background-color: #e6e6e6; width: 30%; border: 1px solid #000; padding: 8px;">Langue(s) :</td>
            <td style="border: 1px solid #000; padding: 8px;">${data.langue || 'Français'}</td>
          </tr>
          <tr>
            <td style="background-color: #e6e6e6; width: 30%; border: 1px solid #000; padding: 8px;">Date(s) :</td>
            <td style="border: 1px solid #000; padding: 8px;">${dateDisplay}</td>
          </tr>
          <tr>
            <td style="background-color: #e6e6e6; width: 30%; border: 1px solid #000; padding: 8px;">Horaires :</td>
            <td style="border: 1px solid #000; padding: 8px;">${formatHoraires()}</td>
          </tr>
          <tr>
            <td style="background-color: #e6e6e6; width: 30%; border: 1px solid #000; padding: 8px;">Durée :</td>
            <td style="border: 1px solid #000; padding: 8px;">${formatDuree()}</td>
          </tr>
          <tr>
            <td style="background-color: #e6e6e6; width: 30%; border: 1px solid #000; padding: 8px;">Format :</td>
            <td style="border: 1px solid #000; padding: 8px;">${data.format || 'Présentiel'}</td>
          </tr>
          <tr>
            <td style="background-color: #e6e6e6; width: 30%; border: 1px solid #000; padding: 8px;">Lieu :</td>
            <td style="border: 1px solid #000; padding: 8px; white-space: pre-line;">${data.lieu || 'À définir'}</td>
          </tr>
          <tr>
            <td style="background-color: #e6e6e6; width: 30%; border: 1px solid #000; padding: 8px;">Commentaire :</td>
            <td style="border: 1px solid #000; padding: 8px;">${data.commentaire || ''}</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 20px; border: 1px solid #000; padding: 10px; font-style: italic; font-size: 13px; background-color: #f9f9f9;">
        Merci de penser à établir une fiche de présence à remettre au service HR à la fin de la formation.<br>
        Au besoin, le template fiche de présence est disponible sur la page Plazza HR.<br>
        N'hésitez pas à contacter le service HR pour tout besoin.
      </div>

      <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #333;">
        Orange Luxembourg<br>
        <span style="color: #F16E00; font-size: 10px;">. Orange Restricted</span>
      </div>
    </div>
  `;
}

function generateFichePresenceHTML(data: {
  formationNom: string;
  formateurNom?: string;
  date?: string;
  dureeHeures?: number;
  lieu?: string;
  lieuExterne?: string;
  participants: Array<{ nom: string; prenom: string; societe?: string }>;
}): string {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString('fr-FR');
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const isBertrange = !data.lieuExterne || data.lieu?.toLowerCase().includes('bertrange');
  const emptyRows = Math.max(0, 13 - data.participants.length);

  const participantRows = data.participants.map(p => `
    <tr>
      <td style="border: 1px solid #666; padding: 8px; height: 25px;">${formatDate(data.date)}</td>
      <td style="border: 1px solid #666; padding: 8px; height: 25px; background-color: #ffccaa;">${p.nom}</td>
      <td style="border: 1px solid #666; padding: 8px; height: 25px; background-color: #ffccaa;">${p.prenom}</td>
      <td style="border: 1px solid #666; padding: 8px; height: 25px;">${p.societe || 'Orange Luxembourg'}</td>
      <td style="border: 1px solid #666; padding: 8px; height: 25px;"></td>
    </tr>
  `).join('');

  const emptyRowsHtml = Array.from({ length: emptyRows }).map(() => `
    <tr>
      <td style="border: 1px solid #666; padding: 8px; height: 25px;">&nbsp;</td>
      <td style="border: 1px solid #666; padding: 8px; height: 25px;"></td>
      <td style="border: 1px solid #666; padding: 8px; height: 25px;"></td>
      <td style="border: 1px solid #666; padding: 8px; height: 25px;"></td>
      <td style="border: 1px solid #666; padding: 8px; height: 25px;"></td>
    </tr>
  `).join('');

  return `
    <div style="background-color: white; width: 210mm; min-height: 297mm; padding: 40px; box-sizing: border-box; font-family: Arial, sans-serif; position: relative; overflow: hidden;">
      <div style="width: 60px; height: 60px; background-color: #F16E00; color: white; font-weight: bold; display: flex; align-items: flex-end; padding: 5px; font-size: 14px; margin-bottom: 30px;">
        orange<sup>TM</sup>
      </div>

      <div style="font-size: 14px; line-height: 1.8; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between;">
          <span><strong>Nom de la formation :</strong> ${data.formationNom}</span>
        </div>

        ${data.formateurNom ? `
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            <span><strong>Nom du formateur :</strong> ${data.formateurNom}</span>
          </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
          <span><strong>Date :</strong> ${formatDate(data.date)}</span>
          <span><strong>Durée :</strong> ${data.dureeHeures ? `${data.dureeHeures}h` : '_____'}</span>
        </div>

        <div style="margin-top: 10px;"><strong>Localisation :</strong></div>

        <div style="display: flex; gap: 20px; margin-top: 5px; margin-bottom: 10px;">
          <label style="display: flex; align-items: center; gap: 5px;">
            <input type="checkbox" ${isBertrange ? 'checked' : ''} disabled style="width: 16px; height: 16px;"> Bertrange (siège OLU)
          </label>
          <label style="display: flex; align-items: center; gap: 5px;">
            <input type="checkbox" ${!isBertrange ? 'checked' : ''} disabled style="width: 16px; height: 16px;"> Externe : ${data.lieuExterne || '_________________'}
          </label>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px;">
        <thead>
          <tr>
            <th style="width: 15%; background-color: #e0e0e0; text-align: left; font-weight: bold; border: 1px solid #666; padding: 8px;">DATE</th>
            <th style="width: 20%; background-color: #e0e0e0; text-align: left; font-weight: bold; border: 1px solid #666; padding: 8px;">NOM</th>
            <th style="width: 20%; background-color: #e0e0e0; text-align: left; font-weight: bold; border: 1px solid #666; padding: 8px;">Prénom</th>
            <th style="width: 20%; background-color: #e0e0e0; text-align: left; font-weight: bold; border: 1px solid #666; padding: 8px;">Société</th>
            <th style="width: 25%; background-color: #e0e0e0; text-align: left; font-weight: bold; border: 1px solid #666; padding: 8px;">Signature</th>
          </tr>
        </thead>
        <tbody>
          ${participantRows}
          ${emptyRowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 40px; font-size: 14px; font-weight: bold;">
        Signature Formateur :
        <div style="border: 1px solid #000; width: 300px; height: 80px; margin-top: 5px;"></div>
      </div>

      <div style="margin-top: 50px; font-size: 12px;">
        Formulaire à retourner au service RH (en original)
      </div>
    </div>
  `;
}

export default DocumentGenerator;
