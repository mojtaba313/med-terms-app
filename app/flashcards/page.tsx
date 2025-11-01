"use client";
import { useState, useEffect, useCallback, useRef } from "react";
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
import { MedicalTerm, MedicalPhrase, Category } from "../../types";
import { useToast } from "../../hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

type FlashcardItem = {
  id: string;
  type: "term" | "phrase";
  front: string;
  back: string;
  pronunciation?: string;
  categories: Category[];
};

type StudySession = {
  id: string;
  allCards: FlashcardItem[];
  remainingCards: FlashcardItem[];
  correctCards: FlashcardItem[];
  currentCard: FlashcardItem | null;
  showAnswer: boolean;
  isTransitioning: boolean;
  correctCount: number;
  totalReviews: number;
};

export default function FlashcardsPage() {
  const [allFlashcards, setAllFlashcards] = useState<FlashcardItem[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<FlashcardItem[]>(
    []
  );
  const [basketCards, setBasketCards] = useState<FlashcardItem[]>([]);
  const [studySession, setStudySession] = useState<StudySession | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<"browse" | "basket">("browse");
  const { toast } = useToast();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const studySessionRef = useRef<StudySession | null>(null);
  studySessionRef.current = studySession;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
    loadBasketFromStorage();
  }, []);

  useEffect(() => {
    filterFlashcards();
  }, [allFlashcards, debouncedSearchTerm, selectedCategories]);

  useEffect(() => {
    saveBasketToStorage();
  }, [basketCards]);

  const loadBasketFromStorage = useCallback(() => {
    try {
      const savedBasket = localStorage.getItem("flashcard-basket");
      if (savedBasket) {
        const parsed = JSON.parse(savedBasket);
        if (Array.isArray(parsed)) {
          setBasketCards(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading basket from storage:", error);
      toast({
        title: "خطا",
        description: "در بارگذاری سبد مرور مشکل پیش آمد",
        variant: "destructive",
      });
    }
  }, [toast]);

  const saveBasketToStorage = useCallback(() => {
    try {
      localStorage.setItem("flashcard-basket", JSON.stringify(basketCards));
    } catch (error) {
      console.error("Error saving basket to storage:", error);
    }
  }, [basketCards]);

  const fetchData = useCallback(async () => {
    const controller = new AbortController();

    try {
      const [termsRes, phrasesRes, categoriesRes] = await Promise.all([
        fetch("/api/terms", { signal: controller.signal }),
        fetch("/api/phrases", { signal: controller.signal }),
        fetch("/api/categories", { signal: controller.signal }),
      ]);

      const flashcardsData: FlashcardItem[] = [];

      if (termsRes.ok) {
        const termsData = await termsRes.json();
        const terms = termsData.data || [];
        terms.forEach((term: MedicalTerm) => {
          flashcardsData.push({
            id: `term-${term.id}`,
            type: "term",
            front: term.term,
            back: term.meaning,
            pronunciation: term.pronunciation,
            categories: term.categories,
          });
        });
      }

      if (phrasesRes.ok) {
        const phrasesData = await phrasesRes.json();
        const phrases = phrasesData.data || [];
        phrases.forEach((phrase: MedicalPhrase) => {
          flashcardsData.push({
            id: `phrase-${phrase.id}`,
            type: "phrase",
            front: phrase.phrase,
            back: phrase.explanation,
            categories: phrase.categories,
          });
        });
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.data || []);
      }

      setAllFlashcards(flashcardsData);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error fetching data:", error);
        toast({
          title: "خطا",
          description: "در دریافت اطلاعات مشکل پیش آمد",
          variant: "destructive",
        });
      }
    }

    return () => controller.abort();
  }, [toast]);

  const filterFlashcards = useCallback(() => {
    let filtered = allFlashcards;

    // Search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (card) =>
          card.front
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          card.back.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories?.length > 0) {
      filtered = filtered.filter((card) =>
        card.categories.some((cat) => selectedCategories.includes(cat.id))
      );
    }

    setFilteredFlashcards(filtered);
  }, [allFlashcards, debouncedSearchTerm, selectedCategories]);

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

  // Basket functions
  const addToBasket = (card: FlashcardItem) => {
    if (!basketCards.find((c) => c.id === card.id)) {
      setBasketCards((prev) => [...prev, card]);
      toast({
        title: "اضافه شد",
        description: "کارت به سبد مرور اضافه شد",
      });
    }
  };

  const removeFromBasket = (cardId: string) => {
    setBasketCards((prev) => prev.filter((card) => card.id !== cardId));
    toast({
      title: "حذف شد",
      description: "کارت از سبد مرور حذف شد",
    });
  };

  const addAllToBasket = () => {
    const newCards = filteredFlashcards.filter(
      (card) => !basketCards.find((basketCard) => basketCard.id === card.id)
    );
    if (newCards?.length > 0) {
      setBasketCards((prev) => [...prev, ...newCards]);
      toast({
        title: "اضافه شد",
        description: `${newCards?.length} کارت به سبد مرور اضافه شد`,
      });
    }
  };

  const clearBasket = () => {
    setBasketCards([]);
    toast({
      title: "پاک شد",
      description: "سبد مرور خالی شد",
    });
  };

  const isInBasket = (cardId: string) => {
    return basketCards.some((card) => card.id === cardId);
  };

  const startStudySession = (cards: FlashcardItem[]) => {
    if (cards?.length === 0) {
      toast({
        title: "خطا",
        description: "سبد مرور خالی است",
        variant: "destructive",
      });
      return;
    }

    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);

    const session: StudySession = {
      id: Date.now().toString(),
      allCards: shuffledCards,
      remainingCards: [...shuffledCards],
      correctCards: [],
      currentCard: shuffledCards[0],
      showAnswer: false,
      isTransitioning: false,
      correctCount: 0,
      totalReviews: 0,
    };

    setStudySession(session);
  };

  const handleShowAnswer = () => {
    if (!studySessionRef.current) return;

    setStudySession({
      ...studySessionRef.current,
      showAnswer: true,
    });
  };

  const handleAnswer = (knewAnswer: boolean) => {
    if (!studySessionRef.current || !studySessionRef.current.currentCard)
      return;

    const currentSession = studySessionRef.current;
    const currentCard = currentSession.currentCard;

    let newRemainingCards = [...currentSession.remainingCards];
    let newCorrectCards = [...currentSession.correctCards];

    // Remove current card from remaining cards
    newRemainingCards = newRemainingCards.filter(
      (card) => card.id !== currentCard?.id
    );

    if (knewAnswer) {
      if (currentCard) newCorrectCards.push(currentCard);
    } else {
      if (currentCard) newRemainingCards.push(currentCard);
    }

    // Start transition
    setStudySession({
      ...currentSession,
      isTransitioning: true,
      showAnswer: true,
      correctCount: knewAnswer
        ? currentSession.correctCount + 1
        : currentSession.correctCount,
      totalReviews: currentSession.totalReviews + 1,
    });

    // Move to next card after showing answer
    setTimeout(() => {
      const nextCard =
        newRemainingCards?.length > 0 ? newRemainingCards[0] : null;

      setStudySession((current) => {
        if (!current) return null;

        return {
          ...current,
          remainingCards: newRemainingCards,
          correctCards: newCorrectCards,
          currentCard: nextCard,
          isTransitioning: false,
          showAnswer: false,
        };
      });
    }, 1500);
  };

  const endStudySession = () => {
    setStudySession(null);
  };

  const getSessionProgress = () => {
    if (!studySession) return 0;
    const total = studySession.allCards?.length;
    const completed = total - studySession.remainingCards?.length;
    return (completed / total) * 100;
  };

  const getSessionStatus = () => {
    if (!studySession) return "";

    if (studySession.remainingCards?.length === 0) {
      return "تکمیل شده! 🎉";
    }

    const round =
      studySession.allCards?.length - studySession.remainingCards?.length + 1;
    return `دور ${round} از ${studySession.allCards?.length}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!studySession) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (!studySession.showAnswer) {
          handleShowAnswer();
        }
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (studySession.showAnswer && !studySession.isTransitioning) {
          handleAnswer(false);
        }
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (studySession.showAnswer && !studySession.isTransitioning) {
          handleAnswer(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [studySession]);

  if (studySession) {
    const progress = getSessionProgress();
    const sessionStatus = getSessionStatus();

    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <Button onClick={endStudySession} variant="outline" size="sm">
                ← بازگشت
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-semibold">{sessionStatus}</h2>
                <p className="text-sm text-muted-foreground">
                  {studySession.correctCount} از {studySession.totalReviews}{" "}
                  صحیح
                </p>
              </div>
              <div className="w-20"></div>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <Card>
                <CardContent className="p-3">
                  <div className="text-xl font-bold text-blue-600">
                    {studySession.allCards?.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    کل کارت‌ها
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xl font-bold text-green-600">
                    {studySession.correctCards?.length}
                  </div>
                  <div className="text-xs text-muted-foreground">مسلط شده</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xl font-bold text-orange-600">
                    {studySession.remainingCards?.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    مانده برای مرور
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Flashcard */}
            {studySession.currentCard ? (
              <div
                className={`transition-all duration-500 ${
                  studySession.isTransitioning
                    ? "opacity-70 scale-95"
                    : "opacity-100 scale-100"
                }`}
              >
                <Card
                  className={`border-2 ${
                    studySession.showAnswer
                      ? "border-green-300 bg-linear-to-br from-green-50 to-green-100"
                      : "border-blue-300 bg-linear-to-br from-blue-50 to-blue-100"
                  } shadow-lg`}
                >
                  <CardContent className="p-8">
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {studySession.currentCard.type === "term"
                            ? "📖"
                            : "💬"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {studySession.currentCard.type === "term"
                            ? "اصطلاح پزشکی"
                            : "عبارت پزشکی"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {studySession.allCards?.length -
                          studySession.remainingCards?.length +
                          1}{" "}
                        / {studySession.allCards?.length}
                      </div>
                    </div>

                    {/* Question */}
                    {!studySession.showAnswer && (
                      <div className="text-center space-y-6">
                        <div className="flex items-center justify-center gap-3">
                          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
                            {studySession.currentCard.front}
                          </h2>
                          {studySession.currentCard.pronunciation && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                speakText(studySession.currentCard!.front)
                              }
                              className="p-2 hover:bg-blue-100 rounded-full"
                            >
                              🔊
                            </Button>
                          )}
                        </div>
                        {studySession.currentCard.pronunciation && (
                          <p className="text-xl text-blue-600 font-medium">
                            {studySession.currentCard.pronunciation}
                          </p>
                        )}
                        <div className="space-y-3">
                          <Button
                            onClick={handleShowAnswer}
                            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
                            size="lg"
                          >
                            نمایش پاسخ (Space)
                          </Button>
                          <p className="text-sm text-muted-foreground">
                            از کلید Space یا Enter استفاده کنید
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Answer */}
                    {studySession.showAnswer && (
                      <div className="text-center space-y-6 animate-fade-in">
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-3">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
                              {studySession.currentCard.front}
                            </h2>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                speakText(studySession.currentCard!.front)
                              }
                              className="p-2 hover:bg-blue-100 rounded-full"
                            >
                              🔊
                            </Button>
                          </div>
                          <div className="border-t border-gray-300 pt-4">
                            <h3 className="text-2xl md:text-3xl font-bold text-green-700 leading-tight">
                              {studySession.currentCard.back}
                            </h3>
                          </div>
                        </div>

                        {studySession.currentCard.pronunciation && (
                          <p className="text-xl text-blue-600 font-medium">
                            {studySession.currentCard.pronunciation}
                          </p>
                        )}

                        {/* Categories */}
                        <div className="flex flex-wrap gap-2 justify-center">
                          {studySession.currentCard.categories?.map(
                            (category) => (
                              <span
                                key={category.id}
                                className="px-3 py-1 text-sm rounded-full text-white font-medium shadow-sm"
                                style={{ backgroundColor: category.color }}
                              >
                                {category.name}
                              </span>
                            )
                          )}
                        </div>

                        {/* Answer Buttons */}
                        {!studySession.isTransitioning ? (
                          <div className="flex gap-4 justify-center pt-4">
                            <Button
                              onClick={() => handleAnswer(false)}
                              className="bg-red-600 hover:bg-red-700 px-6 py-3 text-lg min-w-32 shadow-lg"
                              size="lg"
                            >
                              ❌ بلد نبودم (←)
                            </Button>
                            <Button
                              onClick={() => handleAnswer(true)}
                              className="bg-green-600 hover:bg-green-700 px-6 py-3 text-lg min-w-32 shadow-lg"
                              size="lg"
                            >
                              ✅ بلد بودم (→)
                            </Button>
                          </div>
                        ) : (
                          <div className="pt-4">
                            <div className="text-lg font-semibold text-green-700 animate-pulse">
                              در حال انتقال به کارت بعدی...
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              // Session Completed
              <Card className="text-center py-12 border-2 border-green-300 bg-linear-to-br from-green-50 to-green-100">
                <CardContent>
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold mb-2">
                    تبریک! مرور تکمیل شد
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    شما تمام کارت‌ها را با موفقیت مرور کردید
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        {studySession.correctCount}
                      </div>
                      <div className="text-sm text-green-700">پاسخ صحیح</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {studySession.totalReviews}
                      </div>
                      <div className="text-sm text-blue-700">تعداد مرور</div>
                    </div>
                  </div>
                  <Button
                    onClick={endStudySession}
                    className="bg-blue-600 hover:bg-blue-700 px-8 shadow-lg"
                    size="lg"
                  >
                    بازگشت به سبد مرور
                  </Button>
                </CardContent>
              </Card>
            )}
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
          {/* Header with Basket Info */}
          <motion.div
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                فلش کارت‌ها
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                سیستم مرور هوشمند با سبد مرور
              </p>
            </div>

            <div className="flex gap-2">
              {/* Basket Info */}
              {basketCards?.length > 0 && (
                <motion.div
                  className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-2 rounded-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="text-lg">🛒</span>
                  <span className="font-medium">
                    {basketCards?.length} کارت در سبد
                  </span>
                  <Button
                    onClick={() => startStudySession(basketCards)}
                    className="bg-orange-600 hover:bg-orange-700 text-white h-8 px-3 text-sm"
                  >
                    شروع مرور
                  </Button>
                  <Button
                    onClick={clearBasket}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-orange-200"
                  >
                    🗑️
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex border-b">
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "browse"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("browse")}
              >
                مرور کارت‌ها
              </button>
              <button
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === "basket"
                    ? "border-b-2 border-orange-600 text-orange-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab("basket")}
              >
                سبد مرور ({basketCards?.length})
              </button>
            </div>
          </motion.div>

          {/* Filter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-md border-0 bg-linear-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-4 md:p-6">
                <div className="space-y-4">
                  {/* Search Input */}
                  <div>
                    <Input
                      placeholder="جستجو در فلش کارت‌ها..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-right"
                    />
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-right">
                      فیلتر بر اساس دسته‌بندی:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories?.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategories((prev) =>
                              prev.includes(category.id)
                                ? prev.filter((id) => id !== category.id)
                                : [...prev, category.id]
                            );
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedCategories.includes(category.id)
                              ? "text-white shadow-md"
                              : "bg-white text-gray-700 hover:bg-gray-50 border"
                          }`}
                          style={{
                            backgroundColor: selectedCategories.includes(
                              category.id
                            )
                              ? category.color
                              : undefined,
                            borderColor: selectedCategories.includes(
                              category.id
                            )
                              ? category.color
                              : "#e5e7eb",
                          }}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={addAllToBasket}
                      disabled={filteredFlashcards?.length === 0}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      ➕ افزودن همه به سبد
                    </Button>
                    <Button
                      onClick={() => setSelectedCategories([])}
                      variant="outline"
                    >
                      پاک کردن فیلترها
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cards Grid */}
          <motion.div
            className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            layout
          >
            <AnimatePresence>
              {(activeTab === "browse" ? filteredFlashcards : basketCards)?.map(
                (card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.05, 0.5),
                    }}
                    layout
                  >
                    <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-white shadow-sm group">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {card.type === "term" ? "📖" : "💬"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {card.type === "term" ? "اصطلاح" : "عبارت"}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {card.pronunciation && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => speakText(card.front)}
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                              >
                                🔊
                              </Button>
                            )}
                            {activeTab === "browse" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addToBasket(card)}
                                disabled={isInBasket(card.id)}
                                className={`h-8 w-8 p-0 ${
                                  isInBasket(card.id)
                                    ? "bg-green-50 text-green-600"
                                    : "hover:bg-green-50"
                                }`}
                              >
                                {isInBasket(card.id) ? "✅" : "🛒"}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromBasket(card.id)}
                                className="h-8 w-8 p-0 hover:bg-red-50"
                              >
                                🗑️
                              </Button>
                            )}
                          </div>
                        </div>
                        <CardTitle className="text-lg font-bold text-gray-800 leading-tight mt-2">
                          {card.front}
                        </CardTitle>
                        {card.pronunciation && (
                          <CardDescription className="text-blue-600 font-medium">
                            {card.pronunciation}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 leading-relaxed">
                          {card.back}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-3">
                          {card.categories?.map((category) => (
                            <span
                              key={category.id}
                              className="px-2 py-1 text-xs rounded-full text-white font-medium"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.name}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </motion.div>

          {/* Empty States */}
          {activeTab === "browse" && filteredFlashcards?.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="text-center py-12 border-0 shadow-lg bg-linear-to-br from-gray-50 to-blue-50">
                <CardContent>
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold mb-2">
                    هیچ کارتی یافت نشد
                  </h3>
                  <p className="text-muted-foreground">
                    {allFlashcards?.length === 0
                      ? "هنوز هیچ کارتی اضافه نشده است"
                      : "معیارهای جستجوی خود را تنظیم کنید"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "basket" && basketCards?.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="text-center py-12 border-0 shadow-lg bg-linear-to-br from-gray-50 to-orange-50">
                <CardContent>
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-lg font-semibold mb-2">
                    سبد مرور خالی است
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    کارت‌هایی را برای مرور به سبد اضافه کنید
                  </p>
                  <Button
                    onClick={() => setActiveTab("browse")}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    مشاهده کارت‌ها
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
