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
        alert("Failed to add term");
      }
    } catch (error) {
      console.error("Error adding term:", error);
      alert("Error adding term");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Medical Terms
              </h1>
              <p className="text-muted-foreground">
                Manage and browse medical terminology
              </p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              + Add New Term
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 flex-col sm:flex-row">
                <div className="flex-1">
                  <Input
                    placeholder="Search terms or meanings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Terms Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTerms.map((term) => (
              <Card key={term.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{term.term}</CardTitle>
                    {term.pronunciation && (
                      <span className="text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded">
                        {term.pronunciation}
                      </span>
                    )}
                  </div>
                  <CardDescription>{term.meaning}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {term.categories.map((category) => (
                      <span
                        key={category.id}
                        className="px-2 py-1 text-xs rounded-full text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Created: {new Date(term.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTerms.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">📖</div>
                <h3 className="text-lg font-semibold">No terms found</h3>
                <p className="text-muted-foreground">
                  {terms.length === 0
                    ? "Get started by adding your first medical term"
                    : "Try adjusting your search or filter criteria"}
                </p>
                {terms.length === 0 && (
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    className="mt-4"
                  >
                    Add Your First Term
                  </Button>
                )}
              </CardContent>
            </Card>
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
