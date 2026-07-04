'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Card, Button, Loading, Modal, Input } from '@/modules/shared';
import { ConfirmDialog } from '@/modules/shared/components/ui/confirm-dialog';
import { api } from '@/modules/shared/services/api';

export default function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createSelected, setCreateSelected] = useState<number[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [addingToTeam, setAddingToTeam] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [deleteTeamConfirm, setDeleteTeamConfirm] = useState<any>(null);
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState<{ teamId: number; member: any } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [teamsData, usersData] = await Promise.all([
      api.get<any[]>('/teams'),
      api.get<any[]>('/teams/users'),
    ]);
    setTeams(teamsData);
    setUsers(usersData);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleCreateMember = (id: number) => {
    setCreateSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setActionLoading(true);
    await api.post('/teams', {
      name: createName,
      description: createDesc,
      members: createSelected,
    });
    setCreateOpen(false);
    setCreateName('');
    setCreateDesc('');
    setCreateSelected([]);
    setActionLoading(false);
    await load();
  };

  const openEdit = (team: any) => {
    setEditingTeam(team);
    setEditName(team.name);
    setEditDesc(team.description || '');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editName.trim() || !editingTeam) return;
    setActionLoading(true);
    const updated: any = await api.put(`/teams/${editingTeam.id}`, {
      name: editName,
      description: editDesc,
    });
    setTeams((prev) =>
      prev.map((t) => (t.id === editingTeam.id ? { ...t, ...updated } : t))
    );
    setEditOpen(false);
    setEditingTeam(null);
    setActionLoading(false);
  };

  const handleDeleteTeam = async () => {
    if (!deleteTeamConfirm) return;
    setActionLoading(true);
    await api.delete(`/teams/${deleteTeamConfirm.id}`);
    setTeams((prev) => prev.filter((t) => t.id !== deleteTeamConfirm.id));
    setDeleteTeamConfirm(null);
    setActionLoading(false);
  };

  const handleAddMember = async (teamId: number) => {
    if (!selectedUserId) return;
    setActionLoading(true);
    const updated = await api.post(`/teams/${teamId}/members`, {
      userId: Number(selectedUserId),
    });
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? updated : t))
    );
    setAddingToTeam(null);
    setSelectedUserId('');
    setActionLoading(false);
  };

  const handleRemoveMember = async () => {
    if (!removeMemberConfirm) return;
    const { teamId, member } = removeMemberConfirm;
    setActionLoading(true);
    const updated = await api.delete(`/teams/${teamId}/members/${member.id}`);
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? updated : t))
    );
    setRemoveMemberConfirm(null);
    setActionLoading(false);
  };

  const getNonMembers = (team: any) =>
    users.filter((u: any) => !team.members?.some((m: any) => m.id === u.id));

  const getInitials = (name: string) =>
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader backHref="/settings" backLabel="Volver a Configuración" title="Equipos" description="Gestiona los grupos de trabajo y sus miembros" />
        <Button onClick={() => setCreateOpen(true)}>Crear equipo</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {teams.map((team) => {
          const nonMembers = getNonMembers(team);
          return (
            <Card key={team.id} className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[var(--text)] truncate">
                    {team.name}
                  </h3>
                  {team.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                      {team.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(team)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--celeste-600)] hover:bg-[var(--sidebar-hover)] transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTeamConfirm(team)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--danger)] hover:bg-red-500/10 transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {team.stats && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs text-[var(--text-secondary)]">
                  <span>Tickets: <strong className="text-[var(--text)]">{team.stats.tickets ?? 0}</strong></span>
                  <span>Tareas: <strong className="text-[var(--text)]">{team.stats.tasks ?? 0}</strong></span>
                  <span>Leads: <strong className="text-[var(--text)]">{team.stats.leads ?? 0}</strong></span>
                </div>
              )}

              <div className="border-t border-[var(--border)] pt-4 mt-auto">
                <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                  Miembros ({team.members?.length || 0})
                </p>
                {team.members?.length > 0 && (
                  <ul className="space-y-1.5 mb-3">
                    {team.members.map((member: any) => (
                      <li key={member.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--celeste-400)] to-[var(--celeste-600)] flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                            {getInitials(member.name)}
                          </div>
                          <span className="text-sm text-[var(--text)] truncate">{member.name}</span>
                        </div>
                        <button
                          onClick={() => setRemoveMemberConfirm({ teamId: team.id, member })}
                          className="p-1 rounded text-gray-300 hover:text-[var(--danger)] hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                          title="Quitar miembro"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {nonMembers.length > 0 && (
                  <div>
                    {addingToTeam === team.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="block w-full rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        >
                          <option value="">Seleccionar...</option>
                          {nonMembers.map((u: any) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleAddMember(team.id)}
                          loading={actionLoading}
                          disabled={!selectedUserId}
                        >
                          Agregar
                        </Button>
                        <button
                          onClick={() => { setAddingToTeam(null); setSelectedUserId(''); }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--text-muted)]"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddingToTeam(team.id)}
                      >
                        + Agregar miembro
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {teams.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm font-medium">No hay equipos todavía</p>
            <p className="text-xs mt-1">Crea tu primer equipo para empezar a colaborar</p>
            <Button className="mt-4" size="sm" onClick={() => setCreateOpen(true)}>
              Crear equipo
            </Button>
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Crear equipo">
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Nombre del equipo"
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Descripción</label>
            <textarea
              value={createDesc}
              onChange={(e) => setCreateDesc(e.target.value)}
              placeholder="Descripción del equipo"
              rows={3}
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] placeholder:text-gray-400 hover:border-[var(--celeste-400)] transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Miembros ({createSelected.length} seleccionados)
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-[var(--border)] rounded-lg p-2">
              {users.map((user: any) => (
                <label
                  key={user.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[var(--secondary)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={createSelected.includes(user.id)}
                    onChange={() => toggleCreateMember(user.id)}
                    className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--celeste-400)] to-[var(--celeste-600)] flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-sm text-[var(--text)]">{user.name}</span>
                  <span className="text-xs text-[var(--text-secondary)] ml-auto">{user.email}</span>
                </label>
              ))}
              {users.length === 0 && (
                <p className="text-xs text-[var(--text-secondary)] text-center py-3">
                  No hay usuarios disponibles
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} loading={actionLoading} disabled={!createName.trim()}>
              Crear
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar equipo">
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Nombre del equipo"
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Descripción</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Descripción del equipo"
              rows={3}
              className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] placeholder:text-gray-400 hover:border-[var(--celeste-400)] transition-all"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleEdit} loading={actionLoading} disabled={!editName.trim()}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTeamConfirm}
        onClose={() => setDeleteTeamConfirm(null)}
        onConfirm={handleDeleteTeam}
        title="Eliminar equipo"
        message={`Â¿Estás seguro de que deseas eliminar "${deleteTeamConfirm?.name}"? Esta acción no se puede deshacer.`}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={!!removeMemberConfirm}
        onClose={() => setRemoveMemberConfirm(null)}
        onConfirm={handleRemoveMember}
        title="Quitar miembro"
        message={`Â¿Estás seguro de que deseas quitar a "${removeMemberConfirm?.member?.name}" del equipo?`}
        confirmText="Quitar"
        loading={actionLoading}
      />
    </div>
  );
}


