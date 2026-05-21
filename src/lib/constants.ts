export const SCHOOL_NAME = 'Khalid First Project School'
export const SCHOOL_LOCATION = 'Muslim Odinjo, Ibadan'
export const PASS_MARK = 50
export const SCHOOL_WHATSAPP = '2347041304966' // Change to real number

export const CLASSES = [
  'Prep',
  'Nursery 1',
  'Nursery 2',
  'Primary 1',
  'Primary 2',
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
  'JSS1',
  'JSS2',
  'JSS3',
  'SS1',
  'SS2',
  'SS3',
] as const

export const DEPARTMENTS = ['Science', 'Commercial', 'Art'] as const

export const TERMS = ['First', 'Second', 'Third'] as const

export const ROLES = ['admin', 'teacher', 'parent', 'student'] as const

export const GRADES = [
  { min: 75, max: 100, letter: 'A', remark: 'Excellent' },
  { min: 65, max: 74, letter: 'B', remark: 'Very Good' },
  { min: 55, max: 64, letter: 'C', remark: 'Good' },
  { min: 45, max: 54, letter: 'D', remark: 'Pass' },
  { min: 0, max: 44, letter: 'F', remark: 'Fail' },
] as const

export const BEHAVIOUR_RATINGS = [
  'Excellent',
  'Good', 
  'Fair',
  'Poor'
] as const

export const BANK_DETAILS = {
  bankName: 'Access Bank',
  accountName: 'Khalid First Project School',
  accountNumber: '0123456789',
  amount: '₦5,000',
}
