'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './layout/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import Link from 'next/link'
import { MedicalTerm, MedicalPhrase, Category } from '../types'

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
        setStats(prev => ({ ...prev, terms: terms.length }))
        setRecentTerms(terms.slice(0, 5))
      }

      if (phrasesRes.ok) {
        const phrasesData = await phrasesRes.json()
        const phrases = phrasesData.data || []
        setStats(prev => ({ ...prev, phrases: phrases.length }))
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Medical Terminology Dashboard</h1>
            <p className="text-muted-foreground">
              Your personal assistant for managing medical terminology
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Medical Terms</CardTitle>
                <span className="text-2xl">📖</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{stats.terms}</div>
                <p className="text-xs text-blue-700">
                  English terms with meanings and pronunciation
                </p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Medical Phrases</CardTitle>
                <span className="text-2xl">💬</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{stats.phrases}</div>
                <div className="text-xs text-green-700">
                  Abbreviations and medical expressions
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">Categories</CardTitle>
                <span className="text-2xl">🏷️</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{stats.categories}</div>
                <div className="text-xs text-purple-700">
                  Organized by medical specialties
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Terms */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Terms</CardTitle>
                  <CardDescription>Recently added medical terms</CardDescription>
                </div>
                <Link href="/terms">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentTerms.map(term => (
                  <div key={term.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{term.term}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {term.meaning}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {term.categories.slice(0, 2).map(cat => (
                        <span
                          key={cat.id}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                          title={cat.name}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {recentTerms.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No terms added yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Phrases */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Phrases</CardTitle>
                  <CardDescription>Recently added medical phrases</CardDescription>
                </div>
                <Link href="/phrases">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentPhrases.map(phrase => (
                  <div key={phrase.id} className="p-3 border rounded-lg">
                    <div className="font-medium text-blue-600">{phrase.phrase}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {phrase.explanation}
                    </div>
                  </div>
                ))}
                {recentPhrases.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No phrases added yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <Link href="/terms">
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <span className="text-2xl">📖</span>
                    Add New Term
                  </Button>
                </Link>
                <Link href="/phrases">
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <span className="text-2xl">💬</span>
                    Add New Phrase
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button variant="outline" className="w-full h-20 flex-col gap-2">
                    <span className="text-2xl">🏷️</span>
                    Manage Categories
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}