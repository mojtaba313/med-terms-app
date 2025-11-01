import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Category } from "../types";

interface AddPhraseDialogProps {
  categories: Category[];
  onClose: () => void;
  onAdd: (phrase: {
    phrase: string;
    explanation: string;
    categoryIds: string[];
  }) => Promise<void>;
}

export function AddPhraseDialog({
  categories,
  onClose,
  onAdd,
}: AddPhraseDialogProps) {
  const [phrase, setPhrase] = useState("");
  const [explanation, setExplanation] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phrase.trim() || !explanation.trim()) return;
    setSubmitting(true);

    await onAdd({
      phrase: phrase.trim(),
      explanation: explanation.trim(),
      categoryIds: selectedCategories,
    });
    setSubmitting(false);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>افزودن اصطلاح پزشکی جدید</CardTitle>
          <CardDescription>
            لطفاً اطلاعات اصطلاح پزشکی جدید را وارد کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">اصطلاح</label>
              <Input
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="مثلا MRI (مراقبت عصبی)"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">توضیحات</label>
              <Textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="توضیح بده اصطلاح ینی چی"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Categories</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categories?.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors ${
                      selectedCategories.includes(category.id)
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200"
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
                لغو
              </Button>
              <Button
                disabled={submitting}
                type="submit"
                className="bg-green-600 hover:bg-green-700"
              >
                افزودن اصطلاح
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
