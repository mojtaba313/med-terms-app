'use client'

import { useAuth } from '../components/auth-provider'
import { LoginForm } from '../components/login-form'
import { Dashboard } from '../components/dashboard'
import { motion, AnimatePresence } from 'framer-motion'

export default function Home() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-400 via-blue-500 to-cyan-500">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <div className="text-6xl mb-4">🏥</div>
          <div className="text-xl font-semibold">در حال بارگذاری سیستم پزشکی...</div>
          <div className="mt-2 text-blue-100">لطفاً منتظر بمانید</div>
        </motion.div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-linear-to-br from-blue-400 via-blue-500 to-cyan-500"
        >
          <LoginForm />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Dashboard />
        </motion.div>
      )}
    </AnimatePresence>
  )
}