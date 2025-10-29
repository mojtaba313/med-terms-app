import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface AddCategoryDialogProps {
  onClose: () => void
  onAdd: (category: { name: string; description?: string; color: string }) => void
}

const defaultColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
]

export function AddCategoryDialog({ onClose, onAdd }: AddCategoryDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(defaultColors[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onAdd({
      name: name.trim(),
      description: description.trim() || undefined,
      color: selectedColor
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>
            Create a new category to organize your medical terms and phrases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cardiology, Neurology"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Heart and circulatory system terms"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {defaultColors.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-sm text-muted-foreground">{selectedColor}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Add Category
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}