"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../auth-provider";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [basketCount, setBasketCount] = useState(0);

  useEffect(() => {
    // Load basket count from localStorage
    const savedBasket = localStorage.getItem("flashcard-basket");
    if (savedBasket) {
      const basket = JSON.parse(savedBasket);
      setBasketCount(basket?.length);
    }

    // Listen for storage changes (if multiple tabs are open)
    const handleStorageChange = () => {
      const savedBasket = localStorage.getItem("flashcard-basket");
      if (savedBasket) {
        const basket = JSON.parse(savedBasket);
        setBasketCount(basket?.length);
      } else {
        setBasketCount(0);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const navigation = [
    { name: "داشبورد", href: "/", icon: "🏠" },
    { name: "اصطلاحات پزشکی", href: "/terms", icon: "📖" },
    { name: "عبارت‌های پزشکی", href: "/phrases", icon: "💬" },
    { name: "دسته بندی ها", href: "/categories", icon: "🏷️" },
    {
      name: "فلش کارت ها",
      href: "/flashcards",
      icon: `🎴 ${basketCount > 0 ? `(${basketCount})` : ""}`,
    },
    ...(user?.role === "admin"
      ? [{ name: "کاربران", href: "/users", icon: "👥" }]
      : []),
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          variant="outline"
          size="sm"
          className="bg-white"
        >
          ☰
        </Button>
      </div>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-gray-200 min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">MD</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">دستیار اصطلاحات</h1>
            <p className="text-xs text-gray-500">دستیار دانشجوی پزشکی</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden ml-auto"
            onClick={() => setIsMobileOpen(false)}
          >
            ✕
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation?.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <Button
            onClick={() => logout()}
            variant="outline"
            className="w-full justify-start text-sm"
          >
            <span className="mr-2">🚪</span>
            خروج از حساب
          </Button>
        </div>
      </div>
    </>
  );
}
