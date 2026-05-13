import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Calendar, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

const EVENT_TYPES = [
  { value: 'exam', label: 'Exam', color: 'bg-red-100 text-red-700' },
  { value: 'holiday', label: 'Holiday', color: 'bg-green-100 text-green-700' },
  { value: 'resumption', label: 'Resumption', color: 'bg-blue-100 text-blue-700' },
  { value: 'event', label: 'Event', color: 'bg-purple-100 text-purple-700' },
  { value: 'closing', label: 'Closing', color: 'bg-yellow-100 text-yellow-700' },
]

export default function SchoolCalendar() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    date: '',
    end_date: '',
    type: 'event',
    description: '',
  })

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('calendar_events')
        .insert(form)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar-events'] })
      toast.success('Event added!')
      setShowForm(false)
      setForm({ title: '', date: '', end_date: '', type: 'event', description: '' })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar-events'] })
      toast.success('Event deleted!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const handleSave = () => {
    if (!form.title || !form.date) {
      toast.error('Please fill in title and date')
      return
    }
    saveMutation.mutate()
  }

  const getTypeStyle = (type: string) => {
    return EVENT_TYPES.find(t => t.value === type)?.color ?? 'bg-gray-100 text-gray-700'
  }

  const upcomingEvents = events?.filter((e: any) =>
    new Date(e.date) >= new Date()
  ) ?? []

  const pastEvents = events?.filter((e: any) =>
    new Date(e.date) < new Date()
  ) ?? []

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-school-dark text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-school-blue"
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-school-dark text-white">
          <h3 className="font-semibold">Upcoming Events</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : upcomingEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Calendar size={32} className="mx-auto mb-2 opacity-50" />
            <p>No upcoming events</p>
          </div>
        ) : (
          <div className="divide-y">
            {upcomingEvents.map((event: any) => (
              <div key={event.id} className="p-4 flex items-start justify-between gap-3">
                <div className="flex gap-3">
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
                    {event.end_date && (
                      <p className="text-xs text-gray-400">
                        Ends: {new Date(event.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this event?')) {
                      deleteMutation.mutate(event.id)
                    }
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-500">Past Events</h3>
          </div>
          <div className="divide-y opacity-60">
            {pastEvents.map((event: any) => (
              <div key={event.id} className="p-4 flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="text-center min-w-[50px]">
                    <p className="text-xl font-bold text-gray-400">
                      {new Date(event.date).getDate()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(event.date).toLocaleString('default', { month: 'short' })}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-gray-500">{event.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getTypeStyle(event.type)}`}>
                        {event.type}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(event.id)}
                  className="p-1.5 text-red-400 hover:bg-red-50 rounded"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-school-dark">Add Event</h2>
              <button onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="e.g. First Term Exams"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type *
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                >
                  {EVENT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
                  placeholder="Optional description..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-school-dark text-white rounded-lg py-2.5 text-sm font-medium hover:bg-school-blue disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Add Event'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 border rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
