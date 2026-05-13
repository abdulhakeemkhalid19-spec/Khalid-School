import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Calendar } from 'lucide-react'

const EVENT_TYPES = [
  { value: 'exam', label: 'Exam', color: 'bg-red-100 text-red-700' },
  { value: 'holiday', label: 'Holiday', color: 'bg-green-100 text-green-700' },
  { value: 'resumption', label: 'Resumption', color: 'bg-blue-100 text-blue-700' },
  { value: 'event', label: 'Event', color: 'bg-purple-100 text-purple-700' },
  { value: 'closing', label: 'Closing', color: 'bg-yellow-100 text-yellow-700' },
]

export default function TeacherCalendar() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true })
      return data ?? []
    }
  })

  const getTypeStyle = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type)?.color ?? 'bg-gray-100 text-gray-700'
  }

  const upcomingEvents = events?.filter((e: any) =>
    new Date(e.date) >= new Date()
  ) ?? []

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-school-dark text-white">
          <h3 className="font-semibold">School Calendar</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : upcomingEvents.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Calendar size={40} className="mx-auto mb-2 opacity-50" />
            <p>No upcoming events</p>
          </div>
        ) : (
          <div className="divide-y">
            {upcomingEvents.map((event: any) => (
              <div key={event.id} className="p-4 flex gap-4">
                <div className="text-center min-w-[50px]">
                  <p className="text-xl font-bold text-school-dark">
                    {new Date(event.date).getDate()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.date).toLocaleString('default', { month: 'short' })}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(event.date).getFullYear()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getTypeStyle(event.type)}`}>
                      {event.type}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-xs text-gray-500">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
