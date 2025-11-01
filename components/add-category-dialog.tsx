"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "../hooks/use-toast";

interface AddCategoryDialogProps {
  onClose: () => void;
  onAdd: (categoryData: {
    name: string;
    description?: string;
    color: string;
  }) => void;
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
];

export function AddCategoryDialog({ onClose, onAdd }: AddCategoryDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(predefinedColors[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    
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

    setIsSubmitting(true);
    
    try {
      await onAdd({
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
      });
    } catch (error) {
      console.error("Error in dialog:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        ref={dialogRef}
        className="w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <Card className="shadow-2xl border-0 bg-linear-to-br from-white to-blue-50">
          <CardHeader className="border-b border-gray-200">
            <CardTitle id="dialog-title" className="text-xl font-bold text-gray-800">
              افزودن دسته‌بندی جدید
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="category-name" className="text-sm font-medium text-gray-700">
                  نام دسته‌بندی *
                </Label>
                <Input
                  ref={firstInputRef}
                  id="category-name"
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
                <Label htmlFor="category-description" className="text-sm font-medium text-gray-700">
                  توضیحات (اختیاری)
                </Label>
                <textarea
                  id="category-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="توضیحات مربوط به این دسته‌بندی..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                />
              </div>

              {/* Color Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  رنگ دسته‌بندی
                </Label>
                <div className="grid grid-cols-4 gap-3">
                  {predefinedColors?.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                        selectedColor === color
                          ? "border-gray-800 shadow-lg scale-110"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: selectedColor }}
                  ></div>
                  <span className="text-sm text-gray-600 font-mono">
                    {selectedColor}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 hover:scale-105"
                  disabled={isSubmitting || !name.trim()}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>در حال افزودن...</span>
                    </div>
                  ) : (
                    "➕ افزودن دسته‌بندی"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}