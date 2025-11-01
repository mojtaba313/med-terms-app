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
import { AddTermDialog } from "../../components/add-term-dialog";
import { EditTermDialog } from "../../components/edit-term-dialog";
import { Category, MedicalTerm } from "../../types";
import { useAuth } from "../../components/auth-provider";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../hooks/use-toast";
import { ImportFromJsonDialog } from "../../components/import-from-json-dialog";

export default function TermsPage() {
  const [terms, setTerms] = useState<MedicalTerm[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingTerm, setEditingTerm] = useState<MedicalTerm | null>(null);
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
      fetchTerms();
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = () => {
    fetch("/api/categories")
      .then((response) => response.json())
      .then((data) => {
        setCategories(data.data || []);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        toast({
          title: "خطا",
          description: "در دریافت دسته‌بندی‌ها مشکلی پیش آمد",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const fetchTerms = useCallback(async () => {
    const controller = new AbortController();
    try {
      const response = await fetch("/api/terms", {
        signal: controller.signal,
      });
      if (response.ok) {
        const data = await response.json();
        setTerms(data.data || []);
      } else {
        throw new Error("Failed to fetch terms");
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error fetching terms:", error);
        toast({
          title: "خطا",
          description: "در دریافت اصطلاحات مشکلی پیش آمد",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [toast]);

  const filteredTerms = terms.filter(
    (term) =>
      term.term.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      term.meaning.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      term.pronunciation
        ?.toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase())
    // term.explanation?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const handleAddTerm = async (termData: {
    term: string;
    meaning: string;
    pronunciation?: string;
    explanation?: string;
    categories: string[];
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
        toast({
          title: "موفق",
          description: "اصطلاح با موفقیت اضافه شد",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add term");
      }
    } catch (error: any) {
      console.error("Error adding term:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در افزودن اصطلاح",
        variant: "destructive",
      });
    }
  };

  const handleEditTerm = async (termData: {
    term: string;
    meaning: string;
    pronunciation?: string;
    explanation?: string;
    categories: string[];
  }) => {
    if (!editingTerm) return;

    try {
      const response = await fetch(`/api/terms/${editingTerm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(termData),
      });

      if (response.ok) {
        const result = await response.json();
        setTerms((prev) =>
          prev?.map((term) => (term.id === editingTerm.id ? result.data : term))
        );
        setShowEditDialog(false);
        setEditingTerm(null);
        toast({
          title: "موفق",
          description: "اصطلاح با موفقیت ویرایش شد",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update term");
      }
    } catch (error: any) {
      console.error("Error updating term:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در ویرایش اصطلاح",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTerm = async (termId: string) => {
    if (!confirm("آیا از حذف این اصطلاح اطمینان دارید؟")) return;

    try {
      const response = await fetch(`/api/terms/${termId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTerms((prev) => prev.filter((term) => term.id !== termId));
        toast({
          title: "موفق",
          description: "اصطلاح با موفقیت حذف شد",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete term");
      }
    } catch (error: any) {
      console.error("Error deleting term:", error);
      toast({
        title: "خطا",
        description: error.message || "خطا در حذف اصطلاح",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (term: MedicalTerm) => {
    setEditingTerm(term);
    setShowEditDialog(true);
  };

  // Text-to-speech function
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
              <div className="flex gap-2">
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)]?.map((_, i) => (
                <div
                  key={i}
                  className="h-48 bg-gray-200 rounded animate-pulse"
                ></div>
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
                📖 اصطلاحات پزشکی
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                مدیریت و یادگیری اصطلاحات تخصصی پزشکی
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                📥 وارد کردن از JSON
              </Button>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shadow-lg transition-all duration-300 hover:scale-105"
              >
                ➕ افزودن اصطلاح جدید
              </Button>
            </div>
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
                  placeholder="جستجو در اصطلاحات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-right"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Terms Grid */}
          <motion.div
            className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            layout
          >
            <AnimatePresence>
              {filteredTerms?.map((term, index) => (
                <motion.div
                  key={term.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(index * 0.05, 0.5),
                  }}
                  layout
                >
                  <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-sm hover:border-blue-200 cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => speakText(term.term)}
                            className="h-8 w-8 p-0 hover:bg-blue-50"
                          >
                            🔊
                          </Button>
                          <CardTitle className="text-lg font-bold text-gray-800 leading-tight">
                            {term.term}
                          </CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(term);
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
                              handleDeleteTerm(term.id);
                            }}
                            className="h-8 w-8 p-0 hover:bg-red-50"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                      {term.pronunciation && (
                        <CardDescription className="text-blue-600 font-medium text-sm">
                          {term.pronunciation}
                        </CardDescription>
                      )}
                      <CardDescription className="text-right text-gray-600 mt-2">
                        {term.meaning}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* {term.explanation && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {term.explanation}
                          </p>
                        </div>
                      )} */}
                      <div className="flex flex-wrap gap-1">
                        {term.categories?.map((category) => (
                          <span
                            key={category.id}
                            className="px-2 py-1 text-xs rounded-full text-white font-medium shadow-sm"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground text-left mt-3">
                        ایجاد شده:{" "}
                        {new Date(term.createdAt).toLocaleDateString("fa-IR")}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredTerms?.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="text-center py-12 border-0 shadow-lg bg-linear-to-br from-gray-50 to-blue-50">
                <CardContent>
                  <div className="text-6xl mb-4">📖</div>
                  <h3 className="text-lg font-semibold mb-2">
                    هیچ اصطلاحی یافت نشد
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {terms?.length === 0
                      ? "با ایجاد اولین اصطلاح شروع کنید"
                      : "معیارهای جستجوی خود را تنظیم کنید"}
                  </p>
                  {terms?.length === 0 && (
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => setShowImportDialog(true)}
                        variant="outline"
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        وارد کردن از JSON
                      </Button>
                      <Button
                        onClick={() => setShowAddDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                      >
                        ایجاد اولین اصطلاح
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {showAddDialog && (
          <AddTermDialog
            onClose={() => setShowAddDialog(false)}
            categories={categories}
            // @ts-ignore
            onAdd={handleAddTerm}
          />
        )}

        {showEditDialog && editingTerm && (
          <EditTermDialog
            term={editingTerm}
            onClose={() => {
              setShowEditDialog(false);
              setEditingTerm(null);
            }}
            onSave={handleEditTerm}
          />
        )}

        {showImportDialog && (
          <ImportFromJsonDialog
            onClose={() => setShowImportDialog(false)}
            onImport={() => {
              fetchTerms();
              toast({
                title: "موفق",
                description: "اصطلاحات با موفقیت وارد شدند",
              });
            }}
            type="terms"
          />
        )}
      </main>
    </div>
  );
}
