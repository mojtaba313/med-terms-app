"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { MedicalPhrase, Category } from "../types";
import { useToast } from "../hooks/use-toast";
import { motion } from "framer-motion";

interface EditPhraseDialogProps {
  phrase: MedicalPhrase;
  onClose: () => void;
  onSave: (phraseData: {
    phrase: string;
    explanation: string;
    context?: string;
    categories: string[];
  }) => void;
}

export function EditPhraseDialog({ phrase, onClose, onSave }: EditPhraseDialogProps) {
  const [phraseText, setPhraseText] = useState(phrase.phrase);
  const [explanation, setExplanation] = useState(phrase.explanation);
  // const [context, setContext] = useState(phrase.context || "");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    phrase.categories?.map(cat => cat.id)
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
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
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
    
    if (!phraseText.trim() || !explanation.trim()) {
      toast({
        title: "خطا",
        description: "عبارت و توضیح الزامی هستند",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await onSave({
        phrase: phraseText.trim(),
        explanation: explanation.trim(),
        // context: context.trim() || undefined,
        categories: selectedCategories,
      });
    } catch (error) {
      console.error("Error in dialog:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
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
        <Card className="shadow-2xl border-0 bg-linear-to-br from-white to-green-50">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              ✏️ ویرایش عبارت
              <Button
                variant="ghost"
                size="sm"
                onClick={() => speakText(phraseText)}
                className="h-8 w-8 p-0 hover:bg-green-100"
              >
                🔊
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phrase Field */}
              <div className="space-y-2">
                <Label htmlFor="edit-phrase" className="text-sm font-medium text-gray-700">
                  عبارت *
                </Label>
                <Input
                  ref={firstInputRef}
                  id="edit-phrase"
                  type="text"
                  value={phraseText}
                  onChange={(e) => setPhraseText(e.target.value)}
                  placeholder="مثال: How are you feeling today?"
                  className="w-full text-right"
                  required
                />
              </div>

              {/* Explanation Field */}
              <div className="space-y-2">
                <Label htmlFor="edit-explanation" className="text-sm font-medium text-gray-700">
                  توضیح *
                </Label>
                <Input
                  id="edit-explanation"
                  type="text"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="مثال: حالتان امروز چطور است؟"
                  className="w-full text-right"
                  required
                />
              </div>

              {/* Context Field */}
              <div className="space-y-2">
                <Label htmlFor="edit-context" className="text-sm font-medium text-gray-700">
                  زمینه استفاده (اختیاری)
                </Label>
                {/* <textarea
                  id="edit-context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="شرایط و زمینه‌ای که این عبارت در آن استفاده می‌شود..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-right"
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
                      <div key={i} className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
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
                            ? 'border-green-500 bg-green-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm flex-1 text-right">{category.name}</span>
                        {selectedCategories.includes(category.id) && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview Section */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h4 className="font-medium text-gray-700 mb-3">📋 پیش‌نمایش:</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600">عبارت:</span>
                    <p className="font-medium text-gray-800 text-lg">{phraseText || "---"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">توضیح:</span>
                    <p className="font-medium text-gray-800">{explanation || "---"}</p>
                  </div>
                  {/* {context && (
                    <div>
                      <span className="text-sm text-gray-600">زمینه استفاده:</span>
                      <p className="text-gray-700 text-sm mt-1">{context}</p>
                    </div>
                  )} */}
                  {selectedCategories?.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">دسته‌بندی‌ها:</span>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedCategories?.map(catId => {
                          const category = categories.find(c => c.id === catId);
                          return category ? (
                            <span
                              key={category.id}
                              className="px-2 py-1 text-xs rounded-full text-white font-medium"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
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
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all duration-200 hover:scale-105"
                  disabled={isLoading || !phraseText.trim() || !explanation.trim()}
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