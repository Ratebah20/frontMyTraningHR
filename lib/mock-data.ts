export const mockData = {
  user: {
    id: 1,
    email: "demo@example.com",
    nom: "Demo",
    prenom: "User",
    role: "admin"
  },
  
  collaborateurs: [
    { id: 1, nom: "Dupont", prenom: "Jean", email: "jean.dupont@example.com", service: "IT", role: "Développeur" },
    { id: 2, nom: "Martin", prenom: "Marie", email: "marie.martin@example.com", service: "RH", role: "Manager" },
    { id: 3, nom: "Bernard", prenom: "Paul", email: "paul.bernard@example.com", service: "Finance", role: "Analyste" }
  ],
  
  formations: [
    { id: 1, titre: "Formation React", description: "Apprendre React", duree: 3, categorie: "Développement" },
    { id: 2, titre: "Formation Agile", description: "Méthodes agiles", duree: 2, categorie: "Management" },
    { id: 3, titre: "Formation Excel", description: "Excel avancé", duree: 1, categorie: "Bureautique" }
  ],
  
  sessions: [
    { id: 1, formation_id: 1, date_debut: "2024-01-15", date_fin: "2024-01-17", places: 10, inscrits: 5 },
    { id: 2, formation_id: 2, date_debut: "2024-02-01", date_fin: "2024-02-02", places: 15, inscrits: 8 },
    { id: 3, formation_id: 3, date_debut: "2024-02-10", date_fin: "2024-02-10", places: 20, inscrits: 12 }
  ],
  
  kpi: {
    totalCollaborateurs: 3,
    totalFormations: 3,
    totalSessions: 3,
    tauxParticipation: 75,
    heuresFormation: 120,
    budget: 15000
  }
};

export const mockAuth = {
  login: async (email: string, password: string) => {
    if (email === "demo@example.com" && password === "demo") {
      return {
        user: mockData.user,
        token: "mock-token-123"
      };
    }
    throw new Error("Identifiants invalides");
  },
  
  logout: async () => {
    return true;
  },
  
  getCurrentUser: () => {
    return mockData.user;
  }
};

export const mockServices = {
  getCollaborateurs: async () => mockData.collaborateurs,
  getFormations: async () => mockData.formations,
  getSessions: async () => mockData.sessions,
  getKPI: async () => mockData.kpi,
  
  getCollaborateurById: async (id: number) => 
    mockData.collaborateurs.find(c => c.id === id),
  
  getFormationById: async (id: number) =>
    mockData.formations.find(f => f.id === id),
  
  getSessionById: async (id: number) =>
    mockData.sessions.find(s => s.id === id),
  
  createCollaborateur: async (data: any) => ({ ...data, id: Date.now() }),
  createFormation: async (data: any) => ({ ...data, id: Date.now() }),
  createSession: async (data: any) => ({ ...data, id: Date.now() }),
  
  updateCollaborateur: async (id: number, data: any) => ({ ...data, id }),
  updateFormation: async (id: number, data: any) => ({ ...data, id }),
  updateSession: async (id: number, data: any) => ({ ...data, id }),
  
  deleteCollaborateur: async (id: number) => true,
  deleteFormation: async (id: number) => true,
  deleteSession: async (id: number) => true
};