"use client";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { useToast } from "../hooks/use-toast";
import { motion } from "framer-motion";
import { Category } from "../types";

interface ImportFromJsonDialogProps {
  onClose: () => void;
  onImport: () => void;
  type: "terms" | "phrases";
}

export function ImportFromJsonDialog({
  onClose,
  onImport,
  type,
}: ImportFromJsonDialogProps) {
  const [jsonText, setJsonText] = useState("");
  const [globalCategories, setGlobalCategories] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    []
  );
  const [newCategory, setNewCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setAvailableCategories(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const handleImport = async () => {
    if (!jsonText.trim()) {
      toast({
        title: "خطا",
        description: "لطفا محتوای JSON را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const parsedData = JSON.parse(jsonText);

      // Support both array format and object with items
      const items = Array.isArray(parsedData) ? parsedData : parsedData.items;

      if (!Array.isArray(items)) {
        throw new Error(
          "داده‌ها باید به صورت آرایه یا آبجکت با فیلد items باشند"
        );
      }

      // Validate each item based on type
      for (const item of items) {
        if (type === "terms") {
          if (!item.term || !item.meaning) {
            throw new Error("هر اصطلاح باید دارای فیلدهای term و meaning باشد");
          }
        } else {
          if (!item.phrase || !item.explanation) {
            throw new Error(
              "هر عبارت باید دارای فیلدهای phrase و explanation باشد"
            );
          }
        }
      }

      // Send to API with globalCategories
      const response = await fetch(`/api/${type}/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          globalCategories:
            globalCategories.length > 0 ? globalCategories : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "خطا در وارد کردن داده‌ها");
      }

      toast({
        title: "موفق",
        description: `${items.length} ${
          type === "terms" ? "اصطلاح" : "عبارت"
        } با موفقیت وارد شد`,
      });

      onImport();
      onClose();
    } catch (error: any) {
      console.error("Error importing data:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در پردازش داده‌های JSON",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGlobalCategory = (categoryName: string) => {
    setGlobalCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const addNewCategory = () => {
    if (newCategory.trim() && !globalCategories.includes(newCategory.trim())) {
      setGlobalCategories((prev) => [...prev, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const removeGlobalCategory = (categoryName: string) => {
    setGlobalCategories((prev) => prev.filter((name) => name !== categoryName));
  };

  const handleExample = () => {
    const example =
      type === "terms"
        ? JSON.stringify(
            [
              {
                term: "Hypertension",
                meaning: "فشار خون بالا",
                pronunciation: "/ˌhaɪ.pərˈten.ʃən/",
                explanation:
                  "شرایطی که در آن فشار خون در شریان‌ها به طور مداوم بالا است",
              },
              {
                term: "Tachycardia",
                meaning: "تندتپشی",
                pronunciation: "/tæk.ɪˈkɑːr.di.ə/",
                explanation: "ضربان قلب سریع‌تر از حالت طبیعی",
              },
            ],
            null,
            2
          )
        : JSON.stringify(
            [
              {
                phrase: "How are you feeling today?",
                explanation: "حالتان امروز چطور است؟",
                context: "پرسش معمول از بیمار درباره حال عمومی",
              },
              {
                phrase: "Take a deep breath",
                explanation: "یک نفس عمیق بکشید",
                context: "دستور به بیمار هنگام معاینه ریه",
              },
            ],
            null,
            2
          );

    setJsonText(example);
  };

  const handleClear = () => {
    setJsonText("");
    setGlobalCategories([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden overflow-y-scroll"
      >
        <Card className="w-full h-full flex flex-col">
          <CardHeader className="border-b bg-linear-to-r from-green-50 to-blue-50">
            <CardTitle className="text-xl flex items-center gap-2">
              📥 وارد کردن {type === "terms" ? "اصطلاحات" : "عبارات"} از JSON
            </CardTitle>
            <CardDescription>
              دسته‌بندی‌های مشترک را انتخاب کنید و داده‌های JSON را وارد نمایید
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden flex flex-col gap-4 p-6">
            {/* Global Categories Section */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                🏷️ دسته‌بندی‌های مشترک
              </h4>
              <p className="text-sm text-purple-600 mb-3">
                این دسته‌بندی‌ها به همه آیتم‌های وارد شده اضافه خواهند شد
              </p>

              {/* Selected Global Categories */}
              {globalCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {globalCategories.map((categoryName) => (
                    <motion.span
                      key={categoryName}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                    >
                      {categoryName}
                      <button
                        onClick={() => removeGlobalCategory(categoryName)}
                        className="hover:text-purple-900 text-xs"
                      >
                        ✕
                      </button>
                    </motion.span>
                  ))}
                </div>
              )}

              {/* Available Categories */}
              <div>
                {isCategoriesLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="h-8 bg-purple-200 rounded animate-pulse"
                      ></div>
                    ))}
                  </div>
                ) : availableCategories.length === 0 ? (
                  <p className="text-sm text-purple-600 text-center py-2">
                    هیچ دسته‌بندی موجود نیست
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableCategories.map((category) => (
                      <motion.label
                        key={category.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${
                          globalCategories.includes(category.name)
                            ? "border-purple-500 bg-purple-100 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={globalCategories.includes(category.name)}
                          onChange={() => toggleGlobalCategory(category.name)}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="text-sm flex-1 text-right">
                          {category.name}
                        </span>
                      </motion.label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* JSON Input Section */}
            <div className="space-y-3 flex-1 flex flex-col">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">
                  محتوای JSON ({type === "terms" ? "اصطلاحات" : "عبارات"})
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExample}
                    className="text-xs"
                  >
                    🎯 مشاهده نمونه
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="text-xs"
                  >
                    🗑️ پاک کردن همه
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={`// ساختار ساده - آرایه‌ای از ${
                    type === "terms" ? "اصطلاحات" : "عبارات"
                  }\n// می‌توانید از فیلد categories در هر آیتم برای دسته‌بندی‌های خاص استفاده کنید\n\n[\n  {\n    "${
                    type === "terms" ? "term" : "phrase"
                  }": "...",\n    "${
                    type === "terms" ? "meaning" : "explanation"
                  }": "...",\n    "categories": ["دسته‌اختصاصی"]\n  }\n]`}
                  className="w-full h-full p-4 border border-gray-300 rounded-lg font-mono text-sm leading-relaxed"
                  rows={10}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Preview Section */}
            {globalCategories.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  👁️ پیش‌نمایش دسته‌بندی‌ها
                </h4>
                <p className="text-sm text-green-600 mb-2">
                  همه آیتم‌های وارد شده به این دسته‌بندی‌ها اضافه خواهند شد:
                </p>
                <div className="flex flex-wrap gap-2">
                  {globalCategories.map((categoryName) => {
                    const category = availableCategories.find(
                      (c) => c.name === categoryName
                    );
                    return (
                      <span
                        key={categoryName}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm"
                        style={{
                          backgroundColor: category?.color || "#6B7280",
                        }}
                      >
                        {categoryName}
                        {category && (
                          <div className="w-2 h-2 rounded-full bg-white/80"></div>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                💡 راهنمای سریع
              </h4>
              <ul className="text-blue-600 text-sm space-y-1 list-disc list-inside">
                <li>دسته‌بندی‌های مشترک برای همه آیتم‌ها اعمال می‌شوند</li>
                <li>
                  می‌توانید از فیلد <code>categories</code> در JSON برای
                  دسته‌بندی‌های خاص هر آیتم استفاده کنید
                </li>
                <li>دسته‌بندی‌های جدید به طور خودکار ایجاد می‌شوند</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="min-w-24"
              >
                لغو
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading || !jsonText.trim()}
                className="bg-green-600 hover:bg-green-700 min-w-32 shadow-lg transition-all duration-200 hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>در حال وارد کردن...</span>
                  </div>
                ) : (
                  `📥 وارد کردن ${type === "terms" ? "اصطلاحات" : "عبارات"}`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
