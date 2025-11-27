'use client';

import { GroupedSession, CollectiveSession } from '@/lib/types';

interface ConvocationData {
  formationNom: string;
  organismeNom?: string;
  organismeContact?: string;
  participants: Array<{
    nom: string;
    prenom: string;
  }>;
  langue?: string;
  dateDebut?: string;
  dateFin?: string;
  heureDebut?: string;
  heureFin?: string;
  dureeHeures?: number;
  format?: string;
  lieu?: string;
  commentaire?: string;
}

interface ConvocationTemplateProps {
  data: ConvocationData;
}

export function ConvocationTemplate({ data }: ConvocationTemplateProps) {
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

  return (
    <div className="convocation-page">
      <style jsx>{`
        .convocation-page {
          background-color: white;
          width: 210mm;
          min-height: 297mm;
          padding: 40px;
          box-sizing: border-box;
          font-family: 'Arial', sans-serif;
          position: relative;
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
          margin-bottom: 20px;
        }
        .header-text {
          text-align: center;
          font-size: 14px;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          font-size: 14px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          vertical-align: top;
        }
        .table-header {
          background-color: #e0e0e0;
          color: #F16E00;
          text-align: center;
          font-weight: bold;
          font-size: 18px;
          padding: 15px;
          text-transform: uppercase;
        }
        .label-col {
          background-color: #e6e6e6;
          width: 30%;
          font-weight: normal;
        }
        .participants-list {
          line-height: 1.4;
        }
        .footer-note {
          margin-top: 20px;
          border: 1px solid #000;
          padding: 10px;
          font-style: italic;
          font-size: 13px;
          background-color: #f9f9f9;
        }
        .page-footer {
          margin-top: 50px;
          text-align: center;
          font-size: 12px;
          color: #333;
        }
        .restricted {
          color: #F16E00;
          font-size: 10px;
        }
        @media print {
          .convocation-page {
            padding: 20mm;
            box-shadow: none;
          }
        }
      `}</style>

      <div className="logo">orange<sup>TM</sup></div>

      <div className="header-text">
        Convocation formation - {data.formationNom}
      </div>

      <table>
        <thead>
          <tr>
            <th colSpan={2} className="table-header">CONVOCATION FORMATION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="label-col">Nom de la formation :</td>
            <td>{data.formationNom}</td>
          </tr>
          <tr>
            <td className="label-col">Organisme de formation :</td>
            <td>{data.organismeNom || 'Non défini'}</td>
          </tr>
          <tr>
            <td className="label-col">Contact organisme :</td>
            <td>{data.organismeContact || ''}</td>
          </tr>
          <tr>
            <td className="label-col">Participant(s) :</td>
            <td className="participants-list">
              {data.participants.map((p, i) => (
                <span key={i}>
                  {p.nom.toUpperCase()} {p.prenom}
                  {i < data.participants.length - 1 && <br />}
                </span>
              ))}
            </td>
          </tr>
          <tr>
            <td className="label-col">Langue(s) :</td>
            <td>{data.langue || 'Français'}</td>
          </tr>
          <tr>
            <td className="label-col">Date(s) :</td>
            <td>
              {formatDate(data.dateDebut)}
              {data.dateFin && data.dateFin !== data.dateDebut && ` - ${formatDate(data.dateFin)}`}
            </td>
          </tr>
          <tr>
            <td className="label-col">Horaires :</td>
            <td>{formatHoraires()}</td>
          </tr>
          <tr>
            <td className="label-col">Durée :</td>
            <td>{formatDuree()}</td>
          </tr>
          <tr>
            <td className="label-col">Format :</td>
            <td>{data.format || 'Présentiel'}</td>
          </tr>
          <tr>
            <td className="label-col">Lieu :</td>
            <td style={{ whiteSpace: 'pre-line' }}>{data.lieu || 'À définir'}</td>
          </tr>
          <tr>
            <td className="label-col">Commentaire :</td>
            <td>{data.commentaire || ''}</td>
          </tr>
        </tbody>
      </table>

      <div className="footer-note">
        Merci de penser à établir une fiche de présence à remettre au service HR à la fin de la formation.<br />
        Au besoin, le template fiche de présence est disponible sur la page Plazza HR.<br />
        N'hésitez pas à contacter le service HR pour tout besoin.
      </div>

      <div className="page-footer">
        Orange Luxembourg<br />
        <span className="restricted">. Orange Restricted</span>
      </div>
    </div>
  );
}

export function mapGroupedSessionToConvocation(session: GroupedSession): ConvocationData {
  return {
    formationNom: session.formationNom,
    organismeNom: session.organisme,
    participants: session.participants.map(p => ({
      nom: p.nom,
      prenom: p.prenom,
    })),
    dateDebut: session.dateDebut,
    dateFin: session.dateFin,
    dureeHeures: session.dureeHeures,
    format: session.typeFormation === 'externe' ? 'Chez le prestataire' :
            session.typeFormation === 'interne' ? 'En interne' : 'Présentiel',
  };
}

export function mapCollectiveSessionToConvocation(session: CollectiveSession): ConvocationData {
  return {
    formationNom: session.formation?.nomFormation || session.titre || '',
    organismeNom: session.organisme?.nomOrganisme,
    organismeContact: session.organisme?.contact,
    participants: (session.participants || []).map(p => ({
      nom: p.collaborateur?.nom || '',
      prenom: p.collaborateur?.prenom || '',
    })),
    dateDebut: session.dateDebut,
    dateFin: session.dateFin,
    heureDebut: session.heureDebut,
    heureFin: session.heureFin,
    dureeHeures: session.dureePrevue,
    format: session.modalite === 'presentiel' ? 'Présentiel' :
            session.modalite === 'distanciel' ? 'À distance' : 'Hybride',
    lieu: session.lieu,
    commentaire: session.description,
  };
}
