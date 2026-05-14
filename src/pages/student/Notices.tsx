import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Bell } from 'lucide-react'

export default function StudentNotices() {
  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices-student'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
      return data ?? []
    }
  })

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
          Loading...
        </div>
      ) : notices?.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
          <Bell size={40} className="mx-auto mb-2 opacity-50" />
          <p>No notices yet</p>
        </div>
      ) : (
        notices?.map((notice: any) => (
          <div key={notice.id} className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bell size={18} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-school-dark">{notice.title}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                    {notice.recipient === 'class'
                      ? `Class: ${notice.class}`
                      : notice.recipient}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{notice.body}</p>
                <p className="text-xs text-gray-400">
                  {new Date(notice.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
