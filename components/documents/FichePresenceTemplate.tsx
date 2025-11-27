'use client';

import { GroupedSession, CollectiveSession } from '@/lib/types';

interface FichePresenceData {
  formationNom: string;
  formateurNom?: string;
  date?: string;
  dureeHeures?: number;
  lieu?: string;
  lieuExterne?: string;
  participants: Array<{
    nom: string;
    prenom: string;
    societe?: string;
  }>;
}

interface FichePresenceTemplateProps {
  data: FichePresenceData;
}

export function FichePresenceTemplate({ data }: FichePresenceTemplateProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return new Date().toLocaleDateString('fr-FR');
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const isBertrange = !data.lieuExterne || data.lieu?.toLowerCase().includes('bertrange');
  const emptyRows = Math.max(0, 13 - data.participants.length);

  return (
    <div className="fiche-page">
      <style jsx>{`
        .fiche-page {
          background-color: white;
          width: 210mm;
          min-height: 297mm;
          padding: 40px;
          box-sizing: border-box;
          font-family: 'Arial', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .logo {
          width: 60px;
          height: 60px;
          background-color: #F16E00;
          color: white;
          font-weight: bold;
          display: flex;
          align-items: flex-end;
          padding: 5px;
          font-size: 14px;
          margin-bottom: 30px;
        }
        .info-block {
          font-size: 14px;
          line-height: 1.8;
          margin-bottom: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
        }
        .checkbox-group {
          display: flex;
          gap: 20px;
          margin-top: 5px;
          margin-bottom: 10px;
        }
        .checkbox-group label {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .checkbox-group input[type="checkbox"] {
          width: 16px;
          height: 16px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-top: 10px;
        }
        th, td {
          border: 1px solid #666;
          padding: 8px;
          height: 25px;
          vertical-align: middle;
        }
        th {
          background-color: #e0e0e0;
          text-align: left;
          font-weight: bold;
        }
        .highlight {
          background-color: #ffccaa;
        }
        .signature-section {
          margin-top: 40px;
          font-size: 14px;
          font-weight: bold;
        }
        .signature-box {
          border: 1px solid #000;
          width: 300px;
          height: 80px;
          margin-top: 5px;
        }
        .footer-text {
          margin-top: 50px;
          font-size: 12px;
        }
        @media print {
          .fiche-page {
            padding: 15mm;
            box-shadow: none;
          }
          .checkbox-group input[type="checkbox"] {
            -webkit-appearance: checkbox;
          }
        }
      `}</style>

      <div className="logo">orange<sup>TM</sup></div>

      <div className="info-block">
        <div className="info-row">
          <span><strong>Nom de la formation :</strong> {data.formationNom}</span>
        </div>

        {data.formateurNom && (
          <div className="info-row" style={{ marginTop: '10px' }}>
            <span><strong>Nom du formateur :</strong> {data.formateurNom}</span>
          </div>
        )}

        <div className="info-row" style={{ marginTop: '10px' }}>
          <span><strong>Date :</strong> {formatDate(data.date)}</span>
          <span><strong>Durée :</strong> {data.dureeHeures ? `${data.dureeHeures}h` : '_____'}</span>
        </div>

        <div style={{ marginTop: '10px' }}><strong>Localisation :</strong></div>

        <div className="checkbox-group">
          <label>
            <input type="checkbox" defaultChecked={isBertrange} disabled /> Bertrange (siège OLU)
          </label>
          <label>
            <input type="checkbox" defaultChecked={!isBertrange} disabled /> Externe : {data.lieuExterne || '_________________'}
          </label>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: '15%' }}>DATE</th>
            <th style={{ width: '20%' }}>NOM</th>
            <th style={{ width: '20%' }}>Prénom</th>
            <th style={{ width: '20%' }}>Société</th>
            <th style={{ width: '25%' }}>Signature</th>
          </tr>
        </thead>
        <tbody>
          {data.participants.map((participant, index) => (
            <tr key={index}>
              <td>{formatDate(data.date)}</td>
              <td className="highlight">{participant.nom}</td>
              <td className="highlight">{participant.prenom}</td>
              <td>{participant.societe || 'Orange Luxembourg'}</td>
              <td></td>
            </tr>
          ))}
          {/* Lignes vides pour compléter */}
          {Array.from({ length: emptyRows }).map((_, index) => (
            <tr key={`empty-${index}`}>
              <td>&nbsp;</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="signature-section">
        Signature Formateur :
        <div className="signature-box"></div>
      </div>

      <div className="footer-text">
        Formulaire à retourner au service RH (en original)
      </div>
    </div>
  );
}

export function mapGroupedSessionToFichePresence(session: GroupedSession): FichePresenceData {
  return {
    formationNom: session.formationNom,
    date: session.dateDebut,
    dureeHeures: session.dureeHeures,
    participants: session.participants.map(p => ({
      nom: p.nom,
      prenom: p.prenom,
      societe: 'Orange Luxembourg',
    })),
  };
}

export function mapCollectiveSessionToFichePresence(session: CollectiveSession): FichePresenceData {
  return {
    formationNom: session.formation?.nomFormation || session.titre || '',
    formateurNom: session.formateurNom,
    date: session.dateDebut,
    dureeHeures: session.dureePrevue,
    lieu: session.lieu,
    lieuExterne: session.modalite !== 'presentiel' || !session.lieu?.toLowerCase().includes('bertrange')
      ? session.lieu
      : undefined,
    participants: (session.participants || []).map(p => ({
      nom: p.collaborateur?.nom || '',
      prenom: p.collaborateur?.prenom || '',
      societe: 'Orange Luxembourg',
    })),
  };
}
