export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  createdAt: Date
}

export interface MedicalTerm {
  id: string
  term: string
  meaning: string
  pronunciation?: string
  categories: Category[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface MedicalPhrase {
  id: string
  phrase: string
  explanation: string
  categories: Category[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface Category {
  id: string
  name: string
  description?: string
  color: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}