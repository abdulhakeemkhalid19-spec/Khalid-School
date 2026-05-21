import { useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { SCHOOL_NAME } from '../../lib/constants'

const SCHOOL_WHATSAPP = '2348012345678' // Change to real school WhatsApp number

export default function Complaints() {
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('complaint')

  const sendWhatsApp = () => {
    if (!message.trim()) return
    const text = `*${category.toUpperCase()}*\nFrom: ${name}\n\n${message}`
    const url = `https://wa.me/${SCHOOL_WHATSAPP}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-4">
      <div className="bg-school-dark text-white rounded-xl p-5">
        <h2 className="font-bold text-lg">Contact School</h2>
        <p className="text-blue-200 text-sm mt-1">Send message directly to {SCHOOL_NAME}</p>
      </div>
      <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
            placeholder="Enter your name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark">
            <option value="complaint">Complaint</option>
            <option value="suggestion">Suggestion</option>
            <option value="enquiry">Enquiry</option>
            <option value="emergency">Emergency</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-school-dark"
            placeholder="Type your message..." rows={5} />
        </div>
        <button onClick={sendWhatsApp} disabled={!message.trim() || !name.trim()}
          className="w-full flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl py-3 font-medium hover:bg-green-600 disabled:opacity-50">
          <MessageCircle size={20} />
          Send via WhatsApp
        </button>
      </div>
    </div>
  )
}
