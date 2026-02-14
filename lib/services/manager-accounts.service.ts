import api from '../api';

// Types for manager accounts
export interface ManagerAccount {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  statut: 'actif' | 'suspendu' | 'invitation_en_attente';
  collaborateurId: number;
  collaborateur?: {
    id: number;
    nomComplet: string;
    departement?: {
      id: number;
      nomDepartement: string;
    };
    _count?: {
      subordonnes: number;
    };
  };
  derniereConnexion?: string;
  dateInvitation?: string;
  dateCreation: string;
}

export interface ManagerAccountsResponse {
  data: ManagerAccount[];
  stats: {
    total: number;
    actifs: number;
    suspendus: number;
    invitationsEnAttente: number;
  };
}

export interface InvitableManager {
  id: number;
  nomComplet: string;
  email?: string;
  departement?: {
    id: number;
    nomDepartement: string;
  };
  nombreSubordonnes: number;
}

export interface InviteManagerDto {
  collaborateurId: number;
}

export interface InviteManagerResponse {
  message: string;
  account: ManagerAccount;
}

export const managerAccountsService = {
  /**
   * Get all manager accounts with stats
   */
  async getManagerAccounts(): Promise<ManagerAccountsResponse> {
    const response = await api.get('/auth/manager-accounts');
    return response.data;
  },

  /**
   * Get list of managers who can be invited (have subordinates, no account yet)
   */
  async getInvitableManagers(): Promise<InvitableManager[]> {
    const response = await api.get('/auth/manager-accounts/invitable');
    return response.data;
  },

  /**
   * Invite a manager by creating an account
   */
  async inviteManager(data: InviteManagerDto): Promise<InviteManagerResponse> {
    const response = await api.post('/auth/invite-manager', data);
    return response.data;
  },

  /**
   * Suspend a manager account
   */
  async suspendAccount(id: number): Promise<{ message: string }> {
    const response = await api.patch(`/auth/manager-accounts/${id}/suspend`);
    return response.data;
  },

  /**
   * Reactivate a suspended manager account
   */
  async reactivateAccount(id: number): Promise<{ message: string }> {
    const response = await api.patch(`/auth/manager-accounts/${id}/reactivate`);
    return response.data;
  },

  /**
   * Revoke (delete) a manager account
   */
  async revokeAccount(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/auth/manager-accounts/${id}`);
    return response.data;
  },
};
