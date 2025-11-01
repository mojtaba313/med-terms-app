import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Category } from "../types";
import { motion, AnimatePresence } from "framer-motion";

interface AddTermDialogProps {
  categories: Category[];
  onClose: () => void;
  onAdd: (term: {
    term: string;
    meaning: string;
    pronunciation?: string;
    categoryIds: string[];
  }) => Promise<void>;
}

export function AddTermDialog({
  categories,
  onClose,
  onAdd,
}: AddTermDialogProps) {
  const [term, setTerm] = useState("");
  const [meaning, setMeaning] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !meaning.trim()) return;
    setSubmitting(true);

    await onAdd({
      term: term.trim(),
      meaning: meaning.trim(),
      pronunciation: pronunciation.trim() || undefined,
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>➕ افزودن اصطلاح پزشکی جدید</CardTitle>
              <CardDescription>
                اصطلاح جدید را به همراه معنی و تلفظ اضافه کنید
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">اصطلاح *</label>
                  <Input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="مثال: Hypertension"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">معنی *</label>
                  <Input
                    value={meaning}
                    onChange={(e) => setMeaning(e.target.value)}
                    placeholder="مثال: فشار خون بالا"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">تلفظ (اختیاری)</label>
                  <Input
                    value={pronunciation}
                    onChange={(e) => setPronunciation(e.target.value)}
                    placeholder="مثال: haɪ.pərˈten.ʃən"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">دسته‌بندی‌ها</label>
                  {categories?.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      هیچ دسته‌بندی موجود نیست. لطفاً ابتدا دسته‌بندی ایجاد
                      کنید.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {categories?.map((category) => (
                        <motion.div
                          key={category.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-all ${
                            selectedCategories.includes(category.id)
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => toggleCategory(category.id)}
                        >
                          <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="hover:scale-105 transition-transform"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:scale-105 transition-transform"
                    disabled={true}
                  >
                    افزودن اصطلاح
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
