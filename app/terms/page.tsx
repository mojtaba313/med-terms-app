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
import { AddTermDialog } from "../../components/add-term-dialog";
import { MedicalTerm, Category } from "../../types";
import { motion, AnimatePresence } from "framer-motion";

export default function TermsPage() {
  const [terms, setTerms] = useState<MedicalTerm[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<MedicalTerm[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterTerms();
  }, [terms, searchTerm, selectedCategory]);

  const fetchData = async () => {
    try {
      const [termsRes, categoriesRes] = await Promise.all([
        fetch("/api/terms"),
        fetch("/api/categories"),
      ]);

      if (termsRes.ok) {
        const termsData = await termsRes.json();
        setTerms(termsData.data || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTerms = () => {
    let filtered = terms;

    if (searchTerm) {
      filtered = filtered.filter(
        (term) =>
          term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
          term.meaning.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((term) =>
        term.categories.some((cat) => cat.id === selectedCategory)
      );
    }

    setFilteredTerms(filtered);
  };

  const handleAddTerm = async (termData: {
    term: string;
    meaning: string;
    pronunciation?: string;
    categoryIds: string[];
  }) => {
    try {
      const response = await fetch("/api/terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(termData),
      });

      if (response.ok) {
        const result = await response.json();
        setTerms((prev) => [result.data, ...prev]);
        setShowAddDialog(false);
      } else {
        alert("خطا در افزودن اصطلاح");
      }
    } catch (error) {
      console.error("Error adding term:", error);
      alert("خطا در افزودن اصطلاح");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="text-center">در حال بارگذاری...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="space-y-6">
          <motion.div 
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                📖 اصطلاحات پزشکی
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                مدیریت و مرور اصطلاحات تخصصی پزشکی
              </p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-300 hover:scale-105"
            >
              ➕ افزودن اصطلاح جدید
            </Button>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="shadow-md border-0 bg-linear-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-4 md:p-6">
                <div className="flex gap-4 flex-col md:flex-row">
                  <div className="flex-1">
                    <Input
                      placeholder="جستجو در اصطلاحات و معانی..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-right"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="">همه دسته‌بندی‌ها</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Terms Grid */}
          <motion.div 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            layout
          >
            <AnimatePresence>
              {filteredTerms.map((term, index) => (
                <motion.div
                  key={term.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  layout
                >
                  <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-sm hover:border-blue-200">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-bold text-gray-800">
                          {term.term}
                        </CardTitle>
                        {term.pronunciation && (
                          <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {term.pronunciation}
                          </span>
                        )}
                      </div>
                      <CardDescription className="text-right text-gray-600">
                        {term.meaning}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {term.categories.map((category) => (
                          <span
                            key={category.id}
                            className="px-2 py-1 text-xs rounded-full text-white shadow-sm"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground text-left">
                        ایجاد شده: {new Date(term.createdAt).toLocaleDateString('fa-IR')}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredTerms.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="text-center py-12 border-0 shadow-lg bg-linear-to-br from-gray-50 to-blue-50">
                <CardContent>
                  <div className="text-6xl mb-4">📖</div>
                  <h3 className="text-lg font-semibold mb-2">هیچ اصطلاحی یافت نشد</h3>
                  <p className="text-muted-foreground mb-4">
                    {terms.length === 0
                      ? "با افزودن اولین اصطلاح پزشکی شروع کنید"
                      : "معیارهای جستجوی خود را تنظیم کنید"}
                  </p>
                  {terms.length === 0 && (
                    <Button
                      onClick={() => setShowAddDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                    >
                      افزودن اولین اصطلاح
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {showAddDialog && (
          <AddTermDialog
            categories={categories}
            onClose={() => setShowAddDialog(false)}
            onAdd={handleAddTerm}
          />
        )}
      </main>
    </div>
  );
}