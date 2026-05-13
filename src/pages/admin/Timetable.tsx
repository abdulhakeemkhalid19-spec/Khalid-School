import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { CLASSES } from '../../lib/constants'
import { Save, Clock } from 'lucide-react'
import { toast } from 'sonner'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7']

export default function Timetable() {
  const qc = useQueryClient()
  const [selectedClass, setSelectedClass] = useState('')
  const [timetable, setTimetable] = useState<Record<string, string>>({})

  const { data: existing } = useQuery({
    queryKey: ['timetable', selectedClass],
    queryFn: async () => {
      const { data } = await supabase
        .from('timetable')
        .select('*')
        .eq('class', selectedClass)
      const map: Record<string, string> = {}
      data?.forEach((t: any) => {
        map[`${t.day}-${t.period}`] = t.subject
      })
      setTimetable(map)
      return data ?? []
    },
    enabled: !!selectedClass
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = Object.entries(timetable).map(([key, subject]) => {
        const [day, ...periodParts] = key.split('-')
        const period = periodParts.join('-')
        return {
          class: selectedClass,
          day,
          period,
          subject,
        }
      })
      const { error } = await supabase
        .from('timetable')
        .upsert(records, { onConflict: 'class,day,period' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetable'] })
      toast.success('Timetable saved!')
    },
    onError: (e: any) => toast.error(e.message)
  })

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
          >
            <option value="">Select Class</option>
            {CLASSES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !selectedClass}
            className="flex items-center gap-2 bg-school-dark text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-school-blue disabled:opacity-50"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      {!selectedClass ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400 shadow-sm">
          <Clock size={40} className="mx-auto mb-2 opacity-50" />
          <p>Select a class to manage timetable</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-school-dark text-white">
                <tr>
                  <th className="text-left p-3">Period</th>
                  {DAYS.map(day => (
                    <th key={day} className="p-3 text-center min-w-[120px]">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(period => (
                  <tr key={period} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-school-dark">{period}</td>
                    {DAYS.map(day => {
                      const key = `${day}-${period}`
                      return (
                        <td key={day} className="p-2">
                          <input
                            value={timetable[key] ?? ''}
                            onChange={(e) => setTimetable({
                              ...timetable,
                              [key]: e.target.value
                            })}
                            className="w-full border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-school-dark"
                            placeholder="Subject"
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
