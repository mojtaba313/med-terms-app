"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MedicalTerm, Category } from "../types";
import { useToast } from "../hooks/use-toast";
import { motion } from "framer-motion";

interface EditTermDialogProps {
  term: MedicalTerm;
  onClose: () => void;
  onSave: (termData: {
    term: string;
    meaning: string;
    pronunciation?: string;
    explanation?: string;
    categories: string[];
  }) => void;
}

export function EditTermDialog({ term, onClose, onSave }: EditTermDialogProps) {
  const [termText, setTermText] = useState(term.term);
  const [meaning, setMeaning] = useState(term.meaning);
  const [pronunciation, setPronunciation] = useState(term.pronunciation || "");
  // const [explanation, setExplanation] = useState(term.explanation || "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    term.categories?.map((cat) => cat.id)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const { toast } = useToast();

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    fetchCategories();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "خطا",
        description: "در دریافت دسته‌بندی‌ها مشکلی پیش آمد",
        variant: "destructive",
      });
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termText.trim() || !meaning.trim()) {
      toast({
        title: "خطا",
        description: "اصطلاح و معنی الزامی هستند",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await onSave({
        term: termText.trim(),
        meaning: meaning.trim(),
        pronunciation: pronunciation.trim() || undefined,
        // explanation: explanation.trim() || undefined,
        categories: selectedCategories,
      });
    } catch (error) {
      console.error("Error in dialog:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "خطا",
        description: "مرورگر شما از قابلیت پخش صدا پشتیبانی نمی‌کند",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="shadow-2xl border-0 bg-linear-to-br from-white to-blue-50">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              ✏️ ویرایش اصطلاح
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speakText(termText)}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                🔊
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Term Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-term"
                  className="text-sm font-medium text-gray-700"
                >
                  اصطلاح *
                </Label>
                <Input
                  ref={firstInputRef}
                  id="edit-term"
                  type="text"
                  value={termText}
                  onChange={(e) => setTermText(e.target.value)}
                  placeholder="مثال: Hypertension"
                  className="w-full text-right"
                  required
                />
              </div>

              {/* Meaning Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-meaning"
                  className="text-sm font-medium text-gray-700"
                >
                  معنی *
                </Label>
                <Input
                  id="edit-meaning"
                  type="text"
                  value={meaning}
                  onChange={(e) => setMeaning(e.target.value)}
                  placeholder="مثال: فشار خون بالا"
                  className="w-full text-right"
                  required
                />
              </div>

              {/* Pronunciation Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-pronunciation"
                  className="text-sm font-medium text-gray-700"
                >
                  تلفظ (اختیاری)
                </Label>
                <Input
                  id="edit-pronunciation"
                  type="text"
                  value={pronunciation}
                  onChange={(e) => setPronunciation(e.target.value)}
                  placeholder="مثال: /ˌhaɪ.pərˈten.ʃən/"
                  className="w-full text-right"
                />
              </div>

              {/* Explanation Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-explanation"
                  className="text-sm font-medium text-gray-700"
                >
                  توضیحات بیشتر (اختیاری)
                </Label>
                {/* <textarea
                  id="edit-explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="توضیحات کامل‌تر درباره این اصطلاح..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                /> */}
              </div>

              {/* Categories Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  دسته‌بندی‌ها
                </Label>
                {isCategoriesLoading ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[...Array(4)]?.map((_, i) => (
                      <div
                        key={i}
                        className="h-10 bg-gray-200 rounded-md animate-pulse"
                      ></div>
                    ))}
                  </div>
                ) : categories?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    هیچ دسته‌بندی موجود نیست. لطفاً ابتدا دسته‌بندی ایجاد کنید.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {categories?.map((category) => (
                      <motion.div
                        key={category.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-all ${
                          selectedCategories.includes(category.id)
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm flex-1 text-right">
                          {category.name}
                        </span>
                        {selectedCategories.includes(category.id) && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isLoading}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 hover:scale-105"
                  disabled={isLoading || !termText.trim() || !meaning.trim()}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>در حال ذخیره...</span>
                    </div>
                  ) : (
                    "💾 ذخیره تغییرات"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
