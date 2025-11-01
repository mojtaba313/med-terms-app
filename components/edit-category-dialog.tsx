"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Category } from "../types";
import { useToast } from "../hooks/use-toast";
import { motion } from "framer-motion";

interface EditCategoryDialogProps {
  category: Category;
  onClose: () => void;
  onSave: (categoryData: {
    name: string;
    description?: string;
    color: string;
  }) => Promise<void>;
}

const predefinedColors = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#F97316", // orange
  "#6366F1", // indigo
  "#14B8A6", // teal
  "#F43F5E", // rose
  "#8B5CF6", // purple
  "#06B6D4", // cyan
  "#D946EF", // fuchsia
];

export function EditCategoryDialog({
  category,
  onClose,
  onSave,
}: EditCategoryDialogProps) {
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description || "");
  const [selectedColor, setSelectedColor] = useState(category.color);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "خطا",
        description: "نام دسته‌بندی الزامی است",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
      });
    } catch (error) {
      console.error("Error in dialog:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
  };

  const getColorName = (color: string) => {
    const colorNames: { [key: string]: string } = {
      "#3B82F6": "آبی",
      "#EF4444": "قرمز",
      "#10B981": "سبز",
      "#F59E0B": "کهربایی",
      "#8B5CF6": "بنفش",
      "#EC4899": "صورتی",
      "#06B6D4": "فیروزه‌ای",
      "#84CC16": "لیمویی",
      "#F97316": "نارنجی",
      "#6366F1": "نیلی",
      "#14B8A6": "آبی دریایی",
      "#F43F5E": "رزی",
      "#D946EF": "ارکیده",
    };
    return colorNames[color] || "سفارشی";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 bg-linear-to-br from-white to-purple-50 max-h-[90vh] overflow-y-scroll">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              ✏️ ویرایش دسته‌بندی
              <div
                className="w-6 h-6 rounded-full shadow-md"
                style={{ backgroundColor: selectedColor }}
              ></div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-category-name"
                  className="text-sm font-medium text-gray-700"
                >
                  نام دسته‌بندی *
                </Label>
                <Input
                  ref={firstInputRef}
                  id="edit-category-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: اصطلاحات قلب و عروق"
                  className="w-full text-right"
                  required
                />
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="edit-category-description"
                  className="text-sm font-medium text-gray-700"
                >
                  توضیحات (اختیاری)
                </Label>
                <textarea
                  id="edit-category-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات مربوط به این دسته‌بندی..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-right"
                />
              </div>

              {/* Color Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  رنگ دسته‌بندی
                </Label>
                <div className="grid grid-cols-5 gap-3">
                  {predefinedColors?.map((color) => (
                    <motion.button
                      key={color}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-200 shadow-sm ${
                        selectedColor === color
                          ? "border-gray-800 shadow-lg scale-110 ring-2 ring-offset-2 ring-purple-200"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full shadow-md border"
                      style={{ backgroundColor: selectedColor }}
                    ></div>
                    <span className="text-sm text-gray-600 font-medium">
                      {getColorName(selectedColor)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 font-mono">
                    {selectedColor}
                  </span>
                </div>
              </div>

              {/* Preview Section */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h4 className="font-medium text-gray-700 mb-3">
                  👁️ پیش‌نمایش:
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: selectedColor }}
                    ></div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 text-right">
                        {name || "نام دسته‌بندی"}
                      </h5>
                      {description && (
                        <p className="text-sm text-gray-600 text-right mt-1">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    این نمایی از دسته‌بندی پس از ذخیره است
                  </div>
                </div>
              </div>

              {/* Stats Preview */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  📊 اطلاعات دسته‌بندی
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center bg-white rounded p-2 border">
                    <div className="text-blue-600 font-bold">
                      {(category as any)._count?.terms || 0}
                    </div>
                    <div className="text-blue-700 text-xs">اصطلاحات</div>
                  </div>
                  <div className="text-center bg-white rounded p-2 border">
                    <div className="text-green-600 font-bold">
                      {(category as any)._count?.phrases || 0}
                    </div>
                    <div className="text-green-700 text-xs">عبارات</div>
                  </div>
                </div>
                <div className="text-xs text-blue-600 mt-2 text-center">
                  این اعداد پس از ذخیره تغییرات به‌روز می‌شوند
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
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all duration-200 hover:scale-105"
                  disabled={isLoading || !name.trim()}
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
