'use client';

import { useState } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  TextInput,
  Radio,
  Button,
  Paper,
  Divider,
  Table,
  Box,
  Alert,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  Printer,
  MapPin,
  Calendar,
  Clock,
  Warning,
} from '@phosphor-icons/react';
import { SignaturePad } from './SignaturePad';

interface Participant {
  nom: string;
  prenom: string;
  societe?: string;
}

interface FichePresenceModalProps {
  opened: boolean;
  onClose: () => void;
  data: {
    formationNom: string;
    formateurNom?: string;
    date?: string;
    dureeHeures?: number;
    lieu?: string;
    participants: Participant[];
  };
}

export function FichePresenceModal({
  opened,
  onClose,
  data,
}: FichePresenceModalProps) {
  const [locationType, setLocationType] = useState<'bertrange' | 'externe'>(
    data.lieu?.toLowerCase().includes('bertrange') ? 'bertrange' : 'externe'
  );
  const [lieuExterne, setLieuExterne] = useState(
    data.lieu && !data.lieu.toLowerCase().includes('bertrange') ? data.lieu : ''
  );
  const [formateurNom, setFormateurNom] = useState(data.formateurNom || '');
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    data.date ? new Date(data.date) : new Date()
  );
  const [duree, setDuree] = useState(data.dureeHeures?.toString() || '');
  const [signature, setSignature] = useState<string | null>(null);

  const formatDate = (date: Date | null) => {
    if (!date) return new Date().toLocaleDateString('fr-FR');
    return date.toLocaleDateString('fr-FR');
  };

  const handlePrint = () => {
    if (locationType === 'externe' && !lieuExterne.trim()) {
      notifications.show({
        title: 'Localisation requise',
        message: 'Veuillez saisir la localisation externe.',
        color: 'orange',
        icon: <Warning size={16} />,
      });
      return;
    }

    // Générer le HTML et ouvrir la fenêtre d'impression
    const htmlContent = generateFichePresenceHTML();
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 300);
      };

      notifications.show({
        title: 'Document généré',
        message: 'La fenêtre d\'impression s\'est ouverte.',
        color: 'green',
      });
    }
  };

  const generateFichePresenceHTML = () => {
    const participantRows = data.participants
      .map(
        (p) => `
      <tr>
        <td style="border: 1px solid #666; padding: 8px; height: 30px;">${formatDate(selectedDate)}</td>
        <td style="border: 1px solid #666; padding: 8px; height: 30px; background-color: #ffccaa;">${p.nom}</td>
        <td style="border: 1px solid #666; padding: 8px; height: 30px; background-color: #ffccaa;">${p.prenom}</td>
        <td style="border: 1px solid #666; padding: 8px; height: 30px;">${p.societe || 'Orange Luxembourg'}</td>
        <td style="border: 1px solid #666; padding: 8px; height: 30px;"></td>
      </tr>
    `
      )
      .join('');

    const emptyRowsCount = Math.max(0, 12 - data.participants.length);
    const emptyRows = Array.from({ length: emptyRowsCount })
      .map(
        () => `
      <tr>
        <td style="border: 1px solid #666; padding: 8px; height: 30px;">&nbsp;</td>
        <td style="border: 1px solid #666; padding: 8px; height: 30px;"></td>
        <td style="border: 1px solid #666; padding: 8px; height: 30px;"></td>
        <td style="border: 1px solid #666; padding: 8px; height: 30px;"></td>
        <td style="border: 1px solid #666; padding: 8px; height: 30px;"></td>
      </tr>
    `
      )
      .join('');

    const signatureHtml = signature
      ? `<img src="${signature}" style="max-width: 280px; max-height: 70px; object-fit: contain;" />`
      : '';

    // Logo SVG Orange officiel encodé en base64
    const logoSvg = `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="50" height="50" fill="#FF7900"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M44.3086 36.4067H45.0269V36.1003H43.21V36.4067H43.9283V38.3961H44.3086V36.4067ZM47.6413 38.3961H48.0198V36.1074H47.4406L46.7663 37.8503L46.0814 36.1074H45.4969V38.3961H45.8755V36.4789H45.886L46.6378 38.3961H46.8772L47.629 36.4789H47.6413V38.3961Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M37.873 42.2059C37.873 44.4911 39.0949 45.8063 41.1424 45.8063C42.5702 45.8063 43.6301 45.2887 44.2199 44.3063L42.8801 43.5633C42.4523 44.1654 41.9963 44.4436 41.3044 44.4436C40.2287 44.4436 39.6829 43.7799 39.6688 42.4647H44.2938C44.2938 42.4092 44.2972 42.352 44.3007 42.294C44.3043 42.2341 44.3079 42.1734 44.3079 42.1126C44.3079 39.8538 43.1195 38.5774 41.1125 38.5774C39.1054 38.5774 37.873 39.9207 37.873 42.2059ZM41.1125 39.8133C41.984 39.8133 42.5121 40.3591 42.5121 41.2887H39.704C39.7727 40.3415 40.2885 39.8133 41.1125 39.8133Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M36.7711 45.2869V38.7112L35.2323 38.7148L35.0894 39.5084C34.9474 39.1683 34.4215 38.5845 33.0862 38.5845C31.6091 38.5862 30.2939 39.8855 30.2939 42.2077C30.2939 44.5563 31.5704 45.6795 33.1883 45.6795C34.2499 45.6795 34.6918 45.1866 34.9823 44.669L35.007 44.6936V45.5017C35.007 46.588 34.5475 47.0422 33.5985 47.0422C32.5756 47.0422 32.3679 46.7007 32.2922 46.3591L30.4876 46.6496C30.7411 47.8433 32.007 48.3802 33.3714 48.3802C36.683 48.3591 36.7711 46.4489 36.7711 45.2869ZM35.014 41.8468C35.014 42.7693 34.8978 44.1795 33.5105 44.1901C32.1689 44.1989 32.1091 42.7817 32.1091 41.9225C32.1091 40.3574 32.8415 39.8785 33.4982 39.8785C34.4858 39.8785 35.014 40.7623 35.014 41.8468Z" fill="white"/>
<path d="M22.8066 38.9207L24.319 38.7112L24.4845 39.5351C25.3383 38.9101 26.0161 38.5774 26.87 38.5774C28.2996 38.5774 29.0355 39.3362 29.0355 40.838V45.6742H27.2098V41.1566C27.2098 40.3063 26.988 39.9242 26.3295 39.9242C25.7838 39.9242 25.2397 40.176 24.62 40.6954V45.6777H22.8066V38.9207Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M17.2892 45.7605C18.1038 45.7635 18.9007 45.5232 19.5779 45.0703L19.7451 45.6813H21.3649V40.646C21.3649 39.3696 20.3578 38.5862 18.548 38.5862C17.2217 38.585 16.2346 39.0369 15.5867 39.9418L16.8191 40.646C17.224 40.1261 17.8522 39.8299 18.511 39.8485C19.2187 39.8485 19.6025 40.1408 19.6025 40.646V41.0316C16.6571 41.3644 15.2275 42.1883 15.2275 43.7429C15.2275 44.8978 15.9934 45.7605 17.2892 45.7605ZM17.8402 44.5122C17.3109 44.5122 17.017 44.0767 17.0163 43.6108C17.0175 42.7898 17.8274 42.3519 19.5339 42.1355V43.7798C18.974 44.2728 18.4159 44.5122 17.8402 44.5122ZM17.0163 43.6108C17.0163 43.6102 17.0163 43.6096 17.0163 43.6091V43.6126C17.0163 43.612 17.0163 43.6114 17.0163 43.6108Z" fill="white"/>
<path d="M10.833 38.7325H12.5707V39.5494C13.0485 38.9787 13.7413 38.6314 14.4844 38.5899C14.5633 38.5878 14.6421 38.5919 14.7203 38.6022V40.317H14.6323C13.8365 40.317 12.9668 40.4402 12.6957 41.0582V45.6779H10.833V38.7325Z" fill="white"/>
<path fill-rule="evenodd" clip-rule="evenodd" d="M2.70605 42.2166C2.70605 44.7307 4.33458 45.8821 6.14267 45.8821C7.94901 45.8821 9.57929 44.7342 9.57929 42.2219C9.57929 39.7096 7.95077 38.5564 6.14267 38.5564C4.33458 38.5564 2.70605 39.7025 2.70605 42.2166ZM4.52472 42.2096C4.52472 41.3293 4.77824 40.0969 6.14267 40.0969C7.50711 40.0969 7.76063 41.3205 7.76063 42.2096C7.76063 43.0986 7.50711 44.331 6.14267 44.331C4.77824 44.331 4.52472 43.0898 4.52472 42.2096Z" fill="white"/>
</svg>`;

    // Checkbox checked/unchecked symbols
    const checkedBox = '☑';
    const uncheckedBox = '☐';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche de présence - ${data.formationNom}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      background-color: white;
      width: 210mm;
      min-height: 297mm;
      padding: 40px;
    }
    @media print {
      @page { size: A4; margin: 15mm; }
      body { padding: 0; }
    }
    .container {
      width: 100%;
      font-family: Arial, sans-serif;
    }
    .logo {
      margin-bottom: 30px;
    }
    .info-section {
      font-size: 14px;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    .info-row {
      margin-top: 10px;
    }
    .flex-row {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    }
    .location-row {
      display: flex;
      gap: 30px;
      margin-top: 5px;
    }
    .location-item {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .checkbox {
      font-size: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 10px;
    }
    th {
      background-color: #e0e0e0;
      text-align: left;
      font-weight: bold;
      border: 1px solid #666;
      padding: 8px;
    }
    td {
      border: 1px solid #666;
      padding: 8px;
      height: 30px;
    }
    .highlight {
      background-color: #ffccaa;
    }
    .signature-section {
      margin-top: 40px;
    }
    .signature-label {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .signature-box {
      border: 1px solid #000;
      width: 300px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer {
      margin-top: 50px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      ${logoSvg}
    </div>

    <div class="info-section">
      <div><strong>Nom de la formation :</strong> ${data.formationNom}</div>

      ${formateurNom ? `<div class="info-row"><strong>Nom du formateur :</strong> ${formateurNom}</div>` : ''}

      <div class="flex-row">
        <span><strong>Date :</strong> ${formatDate(selectedDate)}</span>
        <span><strong>Durée :</strong> ${duree ? `${duree}h` : '_____'}</span>
      </div>

      <div class="info-row"><strong>Localisation :</strong></div>
      <div class="location-row">
        <span class="location-item">
          <span class="checkbox">${locationType === 'bertrange' ? checkedBox : uncheckedBox}</span>
          Bertrange (siège OLU)
        </span>
        <span class="location-item">
          <span class="checkbox">${locationType === 'externe' ? checkedBox : uncheckedBox}</span>
          Externe : ${locationType === 'externe' ? lieuExterne : '_________________'}
        </span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 15%;">DATE</th>
          <th style="width: 20%;">NOM</th>
          <th style="width: 20%;">Prénom</th>
          <th style="width: 20%;">Société</th>
          <th style="width: 25%;">Signature</th>
        </tr>
      </thead>
      <tbody>
        ${participantRows}
        ${emptyRows}
      </tbody>
    </table>

    <div class="signature-section">
      <div class="signature-label">Signature Formateur :</div>
      <div class="signature-box">
        ${signatureHtml}
      </div>
    </div>

    <div class="footer">
      Formulaire à retourner au service RH (en original)
    </div>
  </div>
</body>
</html>`;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Printer size={20} />
          <Text fw={600}>Fiche de présence</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        <Paper p="md" withBorder>
          <Text fw={600} mb="sm">{data.formationNom}</Text>
          <Text size="sm" c="dimmed">
            {data.participants.length} participant(s)
          </Text>
        </Paper>

        <Divider label="Informations de la session" labelPosition="center" />

        <TextInput
          label="Nom du formateur"
          placeholder="Saisir le nom du formateur"
          value={formateurNom}
          onChange={(e) => setFormateurNom(e.target.value)}
        />

        <Group grow>
          <DatePickerInput
            label="Date de la formation"
            placeholder="Sélectionner la date"
            value={selectedDate}
            onChange={setSelectedDate}
            locale="fr"
            valueFormat="DD/MM/YYYY"
            leftSection={<Calendar size={16} />}
          />
          <TextInput
            label="Durée (heures)"
            placeholder="Ex: 7"
            value={duree}
            onChange={(e) => setDuree(e.target.value)}
            leftSection={<Clock size={16} />}
          />
        </Group>

        <Divider label="Localisation" labelPosition="center" />

        <Radio.Group
          value={locationType}
          onChange={(value) => setLocationType(value as 'bertrange' | 'externe')}
        >
          <Stack gap="sm">
            <Radio
              value="bertrange"
              label="Bertrange (siège OLU)"
            />
            <Radio
              value="externe"
              label="Localisation externe"
            />
          </Stack>
        </Radio.Group>

        {locationType === 'externe' && (
          <TextInput
            label="Adresse / Lieu externe"
            placeholder="Saisir l'adresse de la formation"
            value={lieuExterne}
            onChange={(e) => setLieuExterne(e.target.value)}
            leftSection={<MapPin size={16} />}
            required
          />
        )}

        <Divider label="Signature du formateur" labelPosition="center" />

        <SignaturePad onSignatureChange={setSignature} />

        {!signature && (
          <Alert variant="light" color="blue">
            La signature est optionnelle. Vous pouvez également signer le document après impression.
          </Alert>
        )}

        <Divider />

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Annuler
          </Button>
          <Button
            leftSection={<Printer size={16} />}
            onClick={handlePrint}
            color="orange"
          >
            Générer et imprimer
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default FichePresenceModal;
