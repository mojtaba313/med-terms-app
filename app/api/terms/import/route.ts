import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    if (!payload?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { globalCategories, items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items must be an array" },
        { status: 400 }
      );
    }

    const results = [];

    for (const item of items) {
      // Validate required fields
      if (!item.term || !item.meaning) {
        continue; // Skip invalid items
      }

      // Process categories - merge globalCategories with item categories
      let allCategoryNames: string[] = [];

      // Add global categories
      if (Array.isArray(globalCategories)) {
        allCategoryNames.push(...globalCategories);
      }

      // Add item-specific categories
      if (Array.isArray(item.categories)) {
        allCategoryNames.push(...item.categories);
      }

      // Remove duplicates
      allCategoryNames = [...new Set(allCategoryNames)];

      let categoryIds: string[] = [];

      for (const categoryName of allCategoryNames) {
        if (typeof categoryName !== "string") continue;

        let category = await prisma.category.findFirst({
          where: {
            name: categoryName.trim(),
            user: { id: user.id },
          },
        });

        // Create category if it doesn't exist
        if (!category) {
          category = await prisma.category.create({
            data: {
              name: categoryName.trim(),
              color: getRandomColor(),
              createdBy: user.id,
            },
          });
        }

        if (category) {
          categoryIds.push(category.id);
        }
      }

      // Create the term
      const term = await prisma.medicalTerm.create({
        data: {
          term: item.term,
          meaning: item.meaning,
          pronunciation: item.pronunciation || null,
          // explanation: item.explanation || null,
          createdBy: user.id,
          categories: categoryIds?.length > 0
            ? {
                create: categoryIds?.map((categoryId: string) => ({
                  category: {
                    connect: { id: categoryId },
                  },
                })),
              }
            : undefined,
        },
        include: {
          categories: true,
        },
      });

      results.push(term);
    }

    return NextResponse.json({
      message: `${results.length} terms imported successfully`,
      data: results,
    });
  } catch (error) {
    console.error("Error importing terms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getRandomColor() {
  const colors = [
    "#3B82F6",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
