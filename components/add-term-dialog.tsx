import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Category } from '../types'

interface AddTermDialogProps {
  categories: Category[]
  onClose: () => void
  onAdd: (term: { term: string; meaning: string; pronunciation?: string; categoryIds: string[] }) => void
}

export function AddTermDialog({ categories, onClose, onAdd }: AddTermDialogProps) {
  const [term, setTerm] = useState('')
  const [meaning, setMeaning] = useState('')
  const [pronunciation, setPronunciation] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!term.trim() || !meaning.trim()) return

    onAdd({
      term: term.trim(),
      meaning: meaning.trim(),
      pronunciation: pronunciation.trim() || undefined,
      categoryIds: selectedCategories
    })
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Add New Medical Term</CardTitle>
          <CardDescription>
            Add a new medical term with its meaning and pronunciation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Term *</label>
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="e.g., Hypertension"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Meaning *</label>
              <Input
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                placeholder="e.g., High blood pressure"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Pronunciation</label>
              <Input
                value={pronunciation}
                onChange={(e) => setPronunciation(e.target.value)}
                placeholder="e.g., haɪ.pərˈten.ʃən"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Categories</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors ${
                      selectedCategories.includes(category.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm">{category.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add Term
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}