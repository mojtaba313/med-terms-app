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
import { AddPhraseDialog } from "../../components/add-phrase-dialog";
import { MedicalPhrase, Category } from "../../types";

export default function PhrasesPage() {
  const [phrases, setPhrases] = useState<MedicalPhrase[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredPhrases, setFilteredPhrases] = useState<MedicalPhrase[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterPhrases();
  }, [phrases, searchTerm, selectedCategory]);

  const fetchData = async () => {
    try {
      const [phrasesRes, categoriesRes] = await Promise.all([
        fetch("/api/phrases"),
        fetch("/api/categories"),
      ]);

      if (phrasesRes.ok) {
        const phrasesData = await phrasesRes.json();
        setPhrases(phrasesData.data || []);
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

  const filterPhrases = () => {
    let filtered = phrases;

    if (searchTerm) {
      filtered = filtered.filter(
        (phrase) =>
          phrase.phrase.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phrase.explanation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((phrase) =>
        phrase.categories.some((cat) => cat.id === selectedCategory)
      );
    }

    setFilteredPhrases(filtered);
  };

  const handleAddPhrase = async (phraseData: {
    phrase: string;
    explanation: string;
    categoryIds: string[];
  }) => {
    try {
      const response = await fetch("/api/phrases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(phraseData),
      });

      if (response.ok) {
        const result = await response.json();
        setPhrases((prev) => [result.data, ...prev]);
        setShowAddDialog(false);
      } else {
        alert("Failed to add phrase");
      }
    } catch (error) {
      console.error("Error adding phrase:", error);
      alert("Error adding phrase");
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
                Medical Phrases
              </h1>
              <p className="text-muted-foreground">
                Manage and browse medical phrases and abbreviations
              </p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              💬 Add New Phrase
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 flex-col sm:flex-row">
                <div className="flex-1">
                  <Input
                    placeholder="Search phrases or explanations..."
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

          {/* Phrases Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPhrases.map((phrase) => (
              <Card
                key={phrase.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl text-blue-600">
                    {phrase.phrase}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-3">{phrase.explanation}</p>
                  <div className="flex flex-wrap gap-1">
                    {phrase.categories.map((category) => (
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
                    Created: {new Date(phrase.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPhrases.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold">No phrases found</h3>
                <p className="text-muted-foreground">
                  {phrases.length === 0
                    ? "Get started by adding your first medical phrase"
                    : "Try adjusting your search or filter criteria"}
                </p>
                {phrases.length === 0 && (
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    className="mt-4"
                  >
                    Add Your First Phrase
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {showAddDialog && (
          <AddPhraseDialog
            categories={categories}
            onClose={() => setShowAddDialog(false)}
            onAdd={handleAddPhrase}
          />
        )}
      </main>
    </div>
  );
}
