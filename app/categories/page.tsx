"use client";
import { useState, useEffect } from "react";
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
import { Category } from "../../types";
import { useAuth } from "../../components/auth-provider";
import { motion, AnimatePresence } from "framer-motion";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
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
      } else {
        alert("Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Error adding category");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="text-center">در حال بارگذاری...</div>
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
              {filteredCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  layout
                >
                  <Card
                    className="hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-sm hover:border-blue-200 cursor-pointer group"
                    style={{ 
                      borderRight: `4px solid ${category.color}`,
                      borderLeft: 'none'
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full shadow-sm group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: category.color }}
                    ></div>
                        <CardTitle className="text-lg font-bold text-gray-800">
                          {category.name}
                        </CardTitle>
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

          {filteredCategories.length === 0 && !isLoading && (
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
                    {categories.length === 0
                      ? "با ایجاد اولین دسته‌بندی شروع کنید"
                      : "معیارهای جستجوی خود را تنظیم کنید"}
                  </p>
                  {categories.length === 0 && (
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
      </main>
    </div>
  );
}