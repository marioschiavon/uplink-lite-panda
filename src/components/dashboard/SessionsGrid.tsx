import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SessionManagementCard from "@/components/SessionManagementCard";
import { Skeleton } from "@/components/ui/skeleton";

interface SessionData {
  id: string;
  name: string;
  api_session: string | null;
  api_token: string | null;
  api_token_full: string | null;
  status: string | null;
  qr: string | null;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
  requires_subscription?: boolean;
}

interface SessionStatus {
  status: boolean;
  message?: string;
  qrCode?: string;
}

interface SessionsGridProps {
  sessions: SessionData[];
  sessionStatuses: Record<string, SessionStatus>;
  onViewQr: (session: SessionData) => void;
  onStartSession: (session: SessionData) => void;
  onDeleteSession: (sessionId: string) => void;
  loading?: boolean;
}

export function SessionsGrid({
  sessions,
  sessionStatuses,
  onViewQr,
  onStartSession,
  onDeleteSession,
  loading = false,
}: SessionsGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch = session.name.toLowerCase().includes(searchTerm.toLowerCase());
    const status = sessionStatuses[session.id];
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && status?.status === true) ||
      (statusFilter === "offline" && (!status || status.status !== true)) ||
      (statusFilter === "qrcode" && (status?.qrCode || status?.message?.toUpperCase() === "QRCODE"));

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar sessão..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="qrcode">Aguardando QR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== "all"
              ? "Nenhuma sessão encontrada com os filtros aplicados"
              : "Nenhuma sessão criada ainda"}
          </p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
          initial="hidden"
          animate="show"
        >
          {filteredSessions.map((session) => (
            <motion.div
              key={session.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <SessionManagementCard
                session={session}
                status={sessionStatuses[session.id] || null}
                onViewQr={() => onViewQr(session)}
                onStartSession={() => onStartSession(session)}
                onDelete={() => onDeleteSession(session.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
