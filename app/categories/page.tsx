"use client";
import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "../../components/layout/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AddCategoryDialog } from "../../components/add-category-dialog";
import { EditCategoryDialog } from "../../components/edit-category-dialog";
import { Category } from "../../types";
import { useAuth } from "../../components/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../hooks/use-toast";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = useCallback(async () => {
    const controller = new AbortController();
    try {
      const response = await fetch("/api/categories", {
        signal: controller.signal,
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      } else {
        throw new Error("Failed to fetch categories");
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Error fetching categories:", error);
        toast({
          title: "خطا",
          description: "در دریافت دسته‌بندی‌ها مشکلی پیش آمد",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [toast]);

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const handleAddCategory = async (categoryData: {
    name: string;
    description?: string;
    color: string;
  }) => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        const result = await response.json();
        setCategories((prev) => [result.data, ...prev]);
        setShowAddDialog(false);
        toast({
          title: "موفق",
          description: "دسته‌بندی با موفقیت اضافه شد",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add category");
      }
    } catch (error: any) {
      console.error("Error adding category:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در افزودن دسته‌بندی",
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = async (categoryData: {
    name: string;
    description?: string;
    color: string;
  }) => {
    if (!editingCategory) return;

    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        const result = await response.json();
        setCategories((prev) =>
          prev?.map((cat) => (cat.id === editingCategory.id ? result.data : cat))
        );
        setShowEditDialog(false);
        setEditingCategory(null);
        toast({
          title: "موفق",
          description: "دسته‌بندی با موفقیت ویرایش شد",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update category");
      }
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در ویرایش دسته‌بندی",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("آیا از حذف این دسته‌بندی اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
        toast({
          title: "موفق",
          description: "دسته‌بندی با موفقیت حذف شد",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در حذف دسته‌بندی",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setShowEditDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(6)]?.map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="space-y-6">
          <motion.div 
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                🏷️ دسته‌بندی‌ها
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                سازماندهی اصطلاحات و عبارات پزشکی با دسته‌بندی
              </p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-lg transition-all duration-300 hover:scale-105"
            >
              ➕ افزودن دسته‌بندی جدید
            </Button>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="shadow-md border-0 bg-linear-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-4 md:p-6">
                <Input
                  placeholder="جستجو در دسته‌بندی‌ها..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-right"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Categories Grid */}
          <motion.div 
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            layout
          >
            <AnimatePresence>
              {filteredCategories?.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                  layout
                >
                  <Card
                    className="hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-sm hover:border-blue-200 cursor-pointer group relative"
                    style={{ 
                      borderRight: `4px solid ${category.color}`,
                      borderLeft: 'none'
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-5 h-5 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <CardTitle className="text-lg font-bold text-gray-800">
                            {category.name}
                          </CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(category);
                            }}
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(category.id);
                            }}
                            className="h-8 w-8 p-0 hover:bg-red-50"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                      {category.description && (
                        <CardDescription className="text-right text-gray-600 mt-2 line-clamp-2">
                          {category.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground text-left">
                        ایجاد شده: {new Date(category.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredCategories?.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="text-center py-12 border-0 shadow-lg bg-linear-to-br from-gray-50 to-blue-50">
                <CardContent>
                  <div className="text-6xl mb-4">🏷️</div>
                  <h3 className="text-lg font-semibold mb-2">هیچ دسته‌بندی یافت نشد</h3>
                  <p className="text-muted-foreground mb-4">
                    {categories?.length === 0
                      ? "با ایجاد اولین دسته‌بندی شروع کنید"
                      : "معیارهای جستجوی خود را تنظیم کنید"}
                  </p>
                  {categories?.length === 0 && (
                    <Button
                      onClick={() => setShowAddDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                    >
                      ایجاد اولین دسته‌بندی
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {showAddDialog && (
          <AddCategoryDialog
            onClose={() => setShowAddDialog(false)}
            onAdd={handleAddCategory}
          />
        )}

        {showEditDialog && editingCategory && (
          <EditCategoryDialog
            category={editingCategory}
            onClose={() => {
              setShowEditDialog(false);
              setEditingCategory(null);
            }}
            onSave={handleEditCategory}
          />
        )}
      </main>
    </div>
  );
}