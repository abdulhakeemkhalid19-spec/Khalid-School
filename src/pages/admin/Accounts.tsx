import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { ROLES } from '../../lib/constants'
import { UserCog, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function Accounts() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false })
      return data ?? []
    }
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-users'] })
      toast.success('Role updated!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-users'] })
      toast.success('Account deleted!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const filtered = users?.filter((u: any) =>
    u.user_id?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-school-dark bg-white"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered?.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <UserCog size={40} className="mx-auto mb-2 opacity-50" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-school-dark text-white">
                <tr>
                  <th className="text-left p-3 text-sm">User ID</th>
                  <th className="text-left p-3 text-sm">Current Role</th>
                  <th className="text-left p-3 text-sm">Change Role</th>
                  <th className="text-left p-3 text-sm">Joined</th>
                  <th className="text-left p-3 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm font-mono text-xs">
                      {user.user_id?.substring(0, 16)}...
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize font-medium ${
                        user.role === 'admin' ? 'bg-red-100 text-red-700' :
                        user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'parent' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        defaultValue={user.role}
                        onChange={(e) => updateRoleMutation.mutate({
                          userId: user.user_id,
                          role: e.target.value
                        })}
                        className="border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-school-dark"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r} className="capitalize">{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          if (confirm('Delete this account?')) {
                            deleteMutation.mutate(user.user_id)
                          }
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
            }
