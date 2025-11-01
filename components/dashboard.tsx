'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './layout/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import Link from 'next/link'
import { MedicalTerm, MedicalPhrase, Category } from '../types'
import { motion } from 'framer-motion'

export function Dashboard() {
  const [stats, setStats] = useState({
    terms: 0,
    phrases: 0,
    categories: 0
  })
  const [recentTerms, setRecentTerms] = useState<MedicalTerm[]>([])
  const [recentPhrases, setRecentPhrases] = useState<MedicalPhrase[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [termsRes, phrasesRes, categoriesRes] = await Promise.all([
        fetch('/api/terms'),
        fetch('/api/phrases'),
        fetch('/api/categories')
      ])

      if (termsRes.ok) {
        const termsData = await termsRes.json()
        const terms = termsData.data || []
        setStats(prev => ({ ...prev, terms: terms?.length }))
        setRecentTerms(terms.slice(0, 5))
      }

      if (phrasesRes.ok) {
        const phrasesData = await phrasesRes.json()
        const phrases = phrasesData.data || []
        setStats(prev => ({ ...prev, phrases: phrases?.length }))
        setRecentPhrases(phrases.slice(0, 5))
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setStats(prev => ({ ...prev, categories: categoriesData.data?.length || 0 }))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <div className="flex h-screen bg-linear-to-br from-gray-50 to-blue-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <h1 className="text-4xl font-bold text-violet-500 mb-2">
              🏥 پنل مدیریت اصطلاحات پزشکی
            </h1>
            <p className="text-gray-600 text-lg">
              سیستم تخصصی مدیریت و یادگیری اصطلاحات پزشکی
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-3">
            <Card className="modern-card hover-lift border-l-4 border-blue-400">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-bold text-blue-800">📖 اصطلاحات پزشکی</CardTitle>
                <div className="text-2xl text-blue-500">📖</div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stats.terms}</div>
                <p className="text-sm text-blue-700">
                  اصطلاحات تخصصی با معنی و تلفظ
                </p>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift border-l-4 border-green-400">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-bold text-green-800">💬 عبارات پزشکی</CardTitle>
                <div className="text-2xl text-green-500">💬</div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900 mb-2">{stats.phrases}</div>
                <div className="text-sm text-green-700">
                  اختصارات و عبارات پزشکی
                </div>
              </CardContent>
            </Card>

            <Card className="modern-card hover-lift border-l-4 border-purple-400">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-bold text-purple-800">🏷️ دسته‌بندی‌ها</CardTitle>
                <div className="text-2xl text-purple-500">🏷️</div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900 mb-2">{stats.categories}</div>
                <div className="text-sm text-purple-700">
                  سازمان‌دهی بر اساس تخصص‌ها
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Terms */}
            <motion.div variants={itemVariants}>
              <Card className="modern-card hover-lift">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <div>
                    <CardTitle className="text-xl font-bold">📚 آخرین اصطلاحات</CardTitle>
                    <CardDescription>اصطلاحات پزشکی اضافه شده اخیر</CardDescription>
                  </div>
                  <Link href="/terms">
                    <Button className="btn-modern text-sm py-2">مشاهده همه</Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {recentTerms?.map((term, index) => (
                    <motion.div 
                      key={term.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-linear-to-r from-blue-50 to-white border border-blue-100"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-lg text-gray-800">{term.term}</div>
                        <div className="text-sm text-gray-600 line-clamp-1">
                          {term.meaning}
                        </div>
                      </div>
                      <div className="flex gap-1 mr-3">
                        {term.categories.slice(0, 2)?.map(cat => (
                          <span
                            key={cat.id}
                            className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: cat.color }}
                            title={cat.name}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                  {recentTerms?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">📖</div>
                      هنوز اصطلاحی اضافه نشده است
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Phrases */}
            <motion.div variants={itemVariants}>
              <Card className="modern-card hover-lift">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <div>
                    <CardTitle className="text-xl font-bold">💊 آخرین عبارات</CardTitle>
                    <CardDescription>عبارات و اختصارات پزشکی اخیر</CardDescription>
                  </div>
                  <Link href="/phrases">
                    <Button className="btn-modern text-sm py-2">مشاهده همه</Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {recentPhrases?.map((phrase, index) => (
                    <motion.div 
                      key={phrase.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl bg-linear-to-r from-green-50 to-white border border-green-100"
                    >
                      <div className="font-bold text-lg text-blue-600 mb-1">{phrase.phrase}</div>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {phrase.explanation}
                      </div>
                    </motion.div>
                  ))}
                  {recentPhrases?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">💬</div>
                      هنوز عبارتی اضافه نشده است
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <Card className="modern-card">
              <CardHeader className="text-center border-b pb-6">
                <CardTitle className="text-2xl font-bold gradient-text">⚡ اقدامات سریع</CardTitle>
                <CardDescription>دسترسی سریع به امکانات اصلی سیستم</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 **:text-violet-600">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Link href="/terms">
                    <Button className="w-full h-24 flex-col gap-3 modern-card hover-lift border-2 border-dashed border-blue-200 hover:border-blue-400">
                      <span className="text-3xl">📖</span>
                      <span className="font-bold">افزودن اصطلاح جدید</span>
                    </Button>
                  </Link>
                  <Link href="/phrases">
                    <Button className="w-full h-24 flex-col gap-3 modern-card hover-lift border-2 border-dashed border-green-200 hover:border-green-400">
                      <span className="text-3xl">💬</span>
                      <span className="font-bold">افزودن عبارت جدید</span>
                    </Button>
                  </Link>
                  <Link href="/categories">
                    <Button className="w-full h-24 flex-col gap-3 modern-card hover-lift border-2 border-dashed border-purple-200 hover:border-purple-400">
                      <span className="text-3xl">🏷️</span>
                      <span className="font-bold">مدیریت دسته‌بندی‌ها</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}