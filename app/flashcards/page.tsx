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
import { MedicalTerm, MedicalPhrase, Category } from "../../types";

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

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    // Load basket from localStorage
    const savedBasket = localStorage.getItem("flashcard-basket");
    if (savedBasket) {
      setBasketCards(JSON.parse(savedBasket));
    }
  }, []);

  useEffect(() => {
    filterFlashcards();
  }, [allFlashcards, searchTerm, selectedCategories]);

  useEffect(() => {
    // Save basket to localStorage
    localStorage.setItem("flashcard-basket", JSON.stringify(basketCards));
  }, [basketCards]);

  const fetchData = async () => {
    try {
      const [termsRes, phrasesRes, categoriesRes] = await Promise.all([
        fetch("/api/terms"),
        fetch("/api/phrases"),
        fetch("/api/categories"),
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
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const filterFlashcards = () => {
    let filtered = allFlashcards;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (card) =>
          card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.back.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((card) =>
        card.categories.some((cat) => selectedCategories.includes(cat.id))
      );
    }

    setFilteredFlashcards(filtered);
  };

  // Basket functions
  const addToBasket = (card: FlashcardItem) => {
    if (!basketCards.find((c) => c.id === card.id)) {
      setBasketCards((prev) => [...prev, card]);
    }
  };

  const removeFromBasket = (cardId: string) => {
    setBasketCards((prev) => prev.filter((card) => card.id !== cardId));
  };

  const addAllToBasket = () => {
    const newCards = filteredFlashcards.filter(
      (card) => !basketCards.find((basketCard) => basketCard.id === card.id)
    );
    setBasketCards((prev) => [...prev, ...newCards]);
  };

  const clearBasket = () => {
    setBasketCards([]);
  };

  const isInBasket = (cardId: string) => {
    return basketCards.some((card) => card.id === cardId);
  };

  const startStudySession = (cards: FlashcardItem[]) => {
    if (cards.length === 0) return;

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
    if (!studySession) return;

    setStudySession({
      ...studySession,
      showAnswer: true,
    });
  };

  const handleAnswer = (knewAnswer: boolean) => {
    if (!studySession || !studySession.currentCard) return;

    const currentCard = studySession.currentCard;
    let newRemainingCards = [...studySession.remainingCards];
    let newCorrectCards = [...studySession.correctCards];

    // Remove current card from remaining cards
    newRemainingCards = newRemainingCards.filter(
      (card) => card.id !== currentCard.id
    );

    if (knewAnswer) {
      // If knew answer, add to correct cards
      newCorrectCards.push(currentCard);
    } else {
      // If didn't know, add back to remaining cards for next round
      newRemainingCards.push(currentCard);
    }

    // Start transition
    setStudySession({
      ...studySession,
      isTransitioning: true,
      showAnswer: true,
      correctCount: knewAnswer
        ? studySession.correctCount + 1
        : studySession.correctCount,
      totalReviews: studySession.totalReviews + 1,
    });

    // Move to next card after showing answer
    setTimeout(() => {
      const nextCard =
        newRemainingCards.length > 0 ? newRemainingCards[0] : null;

      setStudySession({
        ...studySession,
        remainingCards: newRemainingCards,
        correctCards: newCorrectCards,
        currentCard: nextCard,
        isTransitioning: false,
        showAnswer: false,
        correctCount: knewAnswer
          ? studySession.correctCount + 1
          : studySession.correctCount,
        totalReviews: studySession.totalReviews + 1,
      });
    }, 1500);
  };

  const endStudySession = () => {
    setStudySession(null);
  };

  const getSessionProgress = () => {
    if (!studySession) return 0;
    const total = studySession.allCards.length;
    const completed = total - studySession.remainingCards.length;
    return (completed / total) * 100;
  };

  const getSessionStatus = () => {
    if (!studySession) return "";

    if (studySession.remainingCards.length === 0) {
      return "تکمیل شده! 🎉";
    }

    const round =
      studySession.allCards.length - studySession.remainingCards.length + 1;
    return `دور ${round} از ${studySession.allCards.length}`;
  };

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
                    {studySession.allCards.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    کل کارت‌ها
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xl font-bold text-green-600">
                    {studySession.correctCards.length}
                  </div>
                  <div className="text-xs text-muted-foreground">مسلط شده</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <div className="text-xl font-bold text-orange-600">
                    {studySession.remainingCards.length}
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
                        {studySession.allCards.length -
                          studySession.remainingCards.length +
                          1}{" "}
                        / {studySession.allCards.length}
                      </div>
                    </div>

                    {/* Question */}
                    {!studySession.showAnswer && (
                      <div className="text-center space-y-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
                          {studySession.currentCard.front}
                        </h2>
                        {studySession.currentCard.pronunciation && (
                          <p className="text-xl text-blue-600 font-medium">
                            {studySession.currentCard.pronunciation}
                          </p>
                        )}
                        <Button
                          onClick={handleShowAnswer}
                          className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg mt-6"
                          size="lg"
                        >
                          نمایش پاسخ
                        </Button>
                      </div>
                    )}

                    {/* Answer */}
                    {studySession.showAnswer && (
                      <div className="text-center space-y-6 animate-fade-in">
                        <div className="space-y-4">
                          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight">
                            {studySession.currentCard.front}
                          </h2>
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
                          {studySession.currentCard.categories.map(
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
                              ❌ بلد نبودم
                            </Button>
                            <Button
                              onClick={() => handleAnswer(true)}
                              className="bg-green-600 hover:bg-green-700 px-6 py-3 text-lg min-w-32 shadow-lg"
                              size="lg"
                            >
                              ✅ بلد بودم
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              {basketCards.length > 0 && (
                <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-2 rounded-lg">
                  <span className="text-lg">🛒</span>
                  <span className="font-medium">
                    {basketCards.length} کارت در سبد
                  </span>
                  <Button
                    onClick={() => startStudySession(basketCards)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    size="sm"
                  >
                    شروع مرور
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("browse")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "browse"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              جستجو و فیلتر
            </button>
            <button
              onClick={() => setActiveTab("basket")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "basket"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              سبد مرور ({basketCards.length})
            </button>
          </div>

          {/* Browse Tab */}
          {activeTab === "browse" && (
            <>
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle>فیلتر کارت‌ها</CardTitle>
                  <CardDescription>
                    کارت‌های مورد نظر برای مرور را انتخاب کنید
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        جستجو
                      </label>
                      <Input
                        placeholder="جستجو در کارت‌ها..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    {/* Categories */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        دسته‌بندی‌ها
                      </label>
                      <select
                        multiple
                        value={selectedCategories}
                        onChange={(e) =>
                          setSelectedCategories(
                            Array.from(
                              e.target.selectedOptions,
                              (option) => option.value
                            )
                          )
                        }
                        className="w-full border rounded-md p-2 h-32"
                      >
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        برای انتخاب چندگانه Ctrl (Windows) یا Command (Mac) را
                        نگه دارید
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategories([]);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      پاک کردن فیلترها
                    </Button>

                    {filteredFlashcards.length > 0 && (
                      <Button
                        onClick={addAllToBasket}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        ➕ افزودن همه به سبد ({filteredFlashcards.length} کارت)
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cards List */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    کارت‌های فیلتر شده ({filteredFlashcards.length})
                  </CardTitle>
                  <CardDescription>
                    {filteredFlashcards.length === 0
                      ? "هیچ کارتی با فیلترهای انتخاب شده یافت نشد"
                      : "کارت‌های انتخاب شده برای مرور"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredFlashcards.map((card) => (
                      <Card
                        key={card.id}
                        className="hover:shadow-lg transition-shadow border-2 border-blue-100 relative"
                      >
                        <CardContent className="p-4">
                          {/* Add/Remove from Basket Button */}
                          <button
                            onClick={() =>
                              isInBasket(card.id)
                                ? removeFromBasket(card.id)
                                : addToBasket(card)
                            }
                            className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-white transition-colors ${
                              isInBasket(card.id)
                                ? "bg-red-500 hover:bg-red-600"
                                : "bg-green-500 hover:bg-green-600"
                            }`}
                          >
                            {isInBasket(card.id) ? "✕" : "+"}
                          </button>

                          <div className="flex items-center gap-2 mb-3 pr-8">
                            <span className="text-2xl">
                              {card.type === "term" ? "📖" : "💬"}
                            </span>
                            <h3 className="font-semibold text-lg">
                              {card.front}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {card.back}
                          </p>
                          {card.pronunciation && (
                            <p className="text-xs text-blue-600 mb-3">
                              {card.pronunciation}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {card.categories.map((cat) => (
                              <span
                                key={cat.id}
                                className="px-2 py-1 text-xs rounded-full text-white"
                                style={{ backgroundColor: cat.color }}
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Basket Tab */}
          {activeTab === "basket" && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>سبد مرور شما</CardTitle>
                    <CardDescription>
                      {basketCards.length === 0
                        ? "سبد مرور شما خالی است"
                        : `${basketCards.length} کارت برای مرور آماده است`}
                    </CardDescription>
                  </div>
                  {basketCards.length > 0 && (
                    <div className="flex gap-2">
                      <Button onClick={clearBasket} variant="outline" size="sm">
                        🗑️ خالی کردن سبد
                      </Button>
                      <Button
                        onClick={() => startStudySession(basketCards)}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        🎴 شروع مرور
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {basketCards.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-6xl mb-4">🛒</div>
                    <h3 className="text-lg font-semibold mb-2">
                      سبد مرور خالی است
                    </h3>
                    <p>
                      برای شروع، کارت‌هایی را از بخش جستجو به سبد اضافه کنید
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {basketCards.map((card) => (
                      <Card
                        key={card.id}
                        className="hover:shadow-lg transition-shadow border-2 border-orange-200 relative"
                      >
                        <CardContent className="p-4">
                          {/* Remove from Basket Button */}
                          <button
                            onClick={() => removeFromBasket(card.id)}
                            className="absolute top-3 left-3 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white"
                          >
                            ✕
                          </button>

                          <div className="flex items-center gap-2 mb-3 pr-8">
                            <span className="text-2xl">
                              {card.type === "term" ? "📖" : "💬"}
                            </span>
                            <h3 className="font-semibold text-lg">
                              {card.front}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {card.back}
                          </p>
                          {card.pronunciation && (
                            <p className="text-xs text-blue-600 mb-3">
                              {card.pronunciation}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {card.categories.map((cat) => (
                              <span
                                key={cat.id}
                                className="px-2 py-1 text-xs rounded-full text-white"
                                style={{ backgroundColor: cat.color }}
                              >
                                {cat.name}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
