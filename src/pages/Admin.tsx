import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HydraCard, HydraCardHeader, HydraCardTitle, HydraCardContent } from '@/components/ui/hydra-card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Shield, 
  Loader2, 
  UserPlus, 
  Trash2, 
  Users,
  Crown,
  Star,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserWithRoles {
  user_id: string;
  username: string | null;
  display_name: string | null;
  roles: AppRole[];
}

interface RoleEntry {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

const roleIcons: Record<AppRole, React.ElementType> = {
  supervisor: Crown,
  admin: Shield,
  moderator: Star,
  user: User,
};

const roleColors: Record<AppRole, string> = {
  supervisor: 'bg-hydra-supervisor/20 text-hydra-supervisor border-hydra-supervisor/50',
  admin: 'bg-hydra-admin/20 text-hydra-admin border-hydra-admin/50',
  moderator: 'bg-hydra-moderator/20 text-hydra-moderator border-hydra-moderator/50',
  user: 'bg-hydra-user/20 text-hydra-user border-hydra-user/50',
};

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { isSupervisor, loading: rolesLoading } = useUserRoles();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (!isSupervisor) {
        toast.error('Доступ запрещён');
        navigate('/');
        return;
      }
      fetchUsersWithRoles();
    }
  }, [user, authLoading, isSupervisor, rolesLoading, navigate]);

  const fetchUsersWithRoles = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name');

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Map roles to users
      const usersMap = new Map<string, UserWithRoles>();

      (profiles || []).forEach((profile) => {
        usersMap.set(profile.user_id, {
          user_id: profile.user_id,
          username: profile.username,
          display_name: profile.display_name,
          roles: [],
        });
      });

      (roles || []).forEach((roleEntry: RoleEntry) => {
        const userEntry = usersMap.get(roleEntry.user_id);
        if (userEntry) {
          userEntry.roles.push(roleEntry.role);
        }
      });

      setUsers(Array.from(usersMap.values()));
    } catch (error: any) {
      console.error('fetchUsersWithRoles error:', error);
      toast.error(error?.message || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUserId || !selectedRole) return;

    setAdding(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUserId,
          role: selectedRole,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('У пользователя уже есть эта роль');
        } else {
          toast.error(error.message || 'Ошибка добавления роли');
        }
      } else {
        toast.success('Роль добавлена');
        setSelectedUserId('');
        await fetchUsersWithRoles();
      }
    } catch (error: any) {
      console.error('handleAddRole error:', error);
      toast.error(error?.message || 'Непредвиденная ошибка');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast.success('Роль удалена');
      fetchUsersWithRoles();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (authLoading || rolesLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 px-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-hydra-arbiter" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-hydra-arbiter to-primary bg-clip-text text-transparent">
            Панель администратора
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Role Card */}
          <HydraCard variant="glass" className="lg:col-span-1">
            <HydraCardHeader>
              <UserPlus className="h-5 w-5 text-primary" />
              <HydraCardTitle>Назначить роль</HydraCardTitle>
            </HydraCardHeader>
            <HydraCardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Пользователь</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        {u.display_name || u.username || u.user_id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Роль</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleAddRole} 
                disabled={!selectedUserId || adding}
                className="w-full hydra-glow-sm"
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Добавить роль
              </Button>
            </HydraCardContent>
          </HydraCard>

          {/* Users List */}
          <HydraCard variant="glass" className="lg:col-span-2">
            <HydraCardHeader>
              <Users className="h-5 w-5 text-primary" />
              <HydraCardTitle>Пользователи и роли</HydraCardTitle>
            </HydraCardHeader>
            <HydraCardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Роли</TableHead>
                    <TableHead className="w-[100px]">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {u.display_name || u.username || 'Без имени'}
                          </p>
                          {u.username && u.display_name && (
                            <p className="text-sm text-muted-foreground">@{u.username}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 ? (
                            <span className="text-muted-foreground text-sm">Нет ролей</span>
                          ) : (
                            u.roles.map((role) => {
                              const Icon = roleIcons[role];
                              return (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className={cn('flex items-center gap-1', roleColors[role])}
                                >
                                  <Icon className="h-3 w-3" />
                                  {role}
                                </Badge>
                              );
                            })
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.roles.map((role) => (
                          <Button
                            key={role}
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRole(u.user_id, role)}
                            className="h-8 w-8 text-muted-foreground hover:text-hydra-critical"
                            title={`Удалить роль ${role}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </HydraCardContent>
          </HydraCard>
        </div>
      </div>
    </Layout>
  );
}
