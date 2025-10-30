'use client'

import { useState } from 'react'
import { useAuth } from './auth-provider'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { motion } from 'framer-motion'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const success = await login(username, password)
    if (!success) {
      alert('ورود ناموفق بود! لطفاً اطلاعات خود را بررسی کنید.')
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-linear-to-br from-blue-400 via-blue-500 to-cyan-500"></div>
      
      {/* عناصر دکوراتیو */}
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-float">❤️</div>
      <div className="absolute top-20 right-20 text-4xl opacity-30 animate-float" style={{animationDelay: '1s'}}>💊</div>
      <div className="absolute bottom-20 left-20 text-5xl opacity-25 animate-float" style={{animationDelay: '2s'}}>🩺</div>
      <div className="absolute bottom-10 right-10 text-3xl opacity-20 animate-float" style={{animationDelay: '1.5s'}}>🏥</div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass border-0 shadow-2xl">
          <CardHeader className="space-y-1 text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="text-6xl mb-4 heart-beat">🏥</div>
            </motion.div>
            <CardTitle className="text-3xl font-bold gradient-text">
              سیستم اصطلاحات پزشکی
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              به پنل تخصصی پزشکی خوش آمدید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">نام کاربری</label>
                  <Input
                    type="text"
                    placeholder="نام کاربری خود را وارد کنید"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="modern-input text-center text-lg py-4"
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">رمز عبور</label>
                  <Input
                    type="password"
                    placeholder="رمز عبور خود را وارد کنید"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="modern-input text-center text-lg py-4"
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button 
                  type="submit" 
                  className="w-full btn-modern text-lg py-4" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>در حال ورود...</span>
                    </div>
                  ) : (
                    '🚀 ورود به سیستم'
                  )}
                </Button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-sm text-gray-500 bg-blue-50 rounded-lg p-3"
              >
                <div className="font-medium">اطلاعات آزمایشی:</div>
                <div>نام کاربری: <span className="font-bold">admin</span></div>
                <div>رمز عبور: <span className="font-bold">admin123</span></div>
              </motion.div>
            </form>
          </CardContent>
        </Card>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-white mt-6 text-sm"
        >
          سیستم مدیریت اصطلاحات تخصصی پزشکی
        </motion.div>
      </motion.div>
    </div>
  )
}