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
import { Select } from "../../components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    terms: number;
    phrases: number;
    categories: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        setUsers((prev) => [result.data, ...prev]);
        setShowAddForm(false);
        setFormData({ username: "", email: "", password: "", role: "user" });
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user");
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
                👥 کاربران
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                مدیریت کاربران و دسترسی‌های برنامه
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-300 hover:scale-105"
            >
              ➕ افزودن کاربر جدید
            </Button>
          </motion.div>

          {/* Users List */}
          <motion.div 
            className="grid gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <AnimatePresence>
              {users?.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-sm hover:border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg text-gray-800">
                              {user.username}
                            </h3>
                            <span
                              className={`px-3 py-1 text-xs rounded-full font-medium shadow-sm ${
                                user.role === "admin"
                                  ? "bg-purple-500 text-white"
                                  : "bg-blue-500 text-white"
                              }`}
                            >
                              {user.role === "admin" ? "مدیر" : "کاربر"}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-right">{user.email}</p>
                          <div className="flex gap-6 text-sm text-muted-foreground">
                            <span className="bg-gray-50 px-3 py-1 rounded-full">
                              اصطلاحات: {user._count.terms}
                            </span>
                            <span className="bg-gray-50 px-3 py-1 rounded-full">
                              عبارات: {user._count.phrases}
                            </span>
                            <span className="bg-gray-50 px-3 py-1 rounded-full">
                              دسته‌بندی‌ها: {user._count.categories}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground text-left">
                          عضویت: {new Date(user.createdAt).toLocaleDateString('fa-IR')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {users?.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="text-center py-12 border-0 shadow-lg bg-linear-to-br from-gray-50 to-blue-50">
                <CardContent>
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold mb-2">هیچ کاربری یافت نشد</h3>
                  <p className="text-muted-foreground mb-4">
                    با افزودن اولین کاربر شروع کنید
                  </p>
                  <Button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                  >
                    افزودن اولین کاربر
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <motion.div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="w-full max-w-md border-0 shadow-2xl">
                <CardHeader className="bg-linear-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-xl">افزودن کاربر جدید</CardTitle>
                  <CardDescription>
                    ایجاد حساب کاربری جدید برای برنامه
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-right block">نام کاربری *</label>
                      <Input
                        value={formData.username}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                        placeholder="نام کاربری را وارد کنید"
                        required
                        className="text-right"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-right block">ایمیل *</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="ایمیل را وارد کنید"
                        required
                        className="text-right"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-right block">رمز عبور *</label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        placeholder="رمز عبور را وارد کنید"
                        required
                        className="text-right"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-right block">نقش</label>
                      <Select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            role: e.target.value,
                          }))
                        }
                        className="bg-white"
                      >
                        <option value="user">کاربر</option>
                        <option value="admin">مدیر</option>
                      </Select>
                    </div>

                    <div className="flex gap-2 justify-end pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                        className="hover:bg-gray-100"
                      >
                        انصراف
                      </Button>
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                      >
                        ایجاد کاربر
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}