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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

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
              <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
              <p className="text-muted-foreground">
                Organize medical terms and phrases with categories
              </p>
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              🏷️ Add New Category
            </Button>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </CardContent>
          </Card>

          {/* Categories Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category) => (
              <Card
                key={category.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                style={{ borderLeft: `4px solid ${category.color}` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  {category.description && (
                    <CardDescription>{category.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(category.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCategories.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🏷️</div>
                <h3 className="text-lg font-semibold">No categories found</h3>
                <p className="text-muted-foreground">
                  {categories.length === 0
                    ? "Get started by creating your first category"
                    : "Try adjusting your search criteria"}
                </p>
                {categories.length === 0 && (
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    className="mt-4"
                  >
                    Create Your First Category
                  </Button>
                )}
              </CardContent>
            </Card>
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
