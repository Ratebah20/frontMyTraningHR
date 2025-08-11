import { Avatar } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal } from "lucide-react"

interface VaultTableProps {
  userView?: boolean
}

const tickets = [
  {
    id: "TK-001",
    title: "Problème d'imprimante",
    priority: "high",
    status: "En cours",
    requester: "Jean Dupont",
    assignedTo: "Support IT",
    createdAt: "18.02.2024",
    category: "Hardware",
  },
  {
    id: "TK-002",
    title: "Accès réseau impossible",
    priority: "medium",
    status: "Nouveau",
    requester: "Marie Martin",
    assignedTo: "Non assigné",
    createdAt: "17.02.2024",
    category: "Réseau",
  },
]

export function VaultTable({ userView = false }: VaultTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID/Titre</TableHead>
          <TableHead>Priorité</TableHead>
          <TableHead>Statut</TableHead>
          {!userView && <TableHead>Demandeur</TableHead>}
          <TableHead>{userView ? 'Support assigné' : 'Assigné à'}</TableHead>
          <TableHead>Date création</TableHead>
          <TableHead>Catégorie</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets
          .filter(ticket => userView ? ticket.requester === "Jean Dupont" : true) // Exemple de filtrage pour utilisateur
          .map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium">{ticket.id}</div>
                    <div className="text-xs text-muted-foreground">{ticket.title}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                  ticket.priority === "high" ? "bg-red-500/10 text-red-500" 
                  : ticket.priority === "medium" ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-green-500/10 text-green-500"
                }`}>
                  {ticket.priority}
                </span>
              </TableCell>
              <TableCell>{ticket.status}</TableCell>
              {!userView && <TableCell>{ticket.requester}</TableCell>}
              <TableCell>{ticket.assignedTo}</TableCell>
              <TableCell>{ticket.createdAt}</TableCell>
              <TableCell>{ticket.category}</TableCell>
              <TableCell>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  )
}

