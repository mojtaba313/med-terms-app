import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/categories/[id] - Get single category
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const category = await prisma.category.findFirst({
      where: {
        id: (await params).id,
        user: { id: user.id },
      },
      include: {
        _count: {
          select: {
            termCategories: true,
            phraseCategories: true,
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const body = await request.json();
    const { name, description, color } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: (await params).id,
        user: { id: user.id },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check for duplicate category name (excluding current category)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        user: { id: user.id },
        id: { not: (await params).id },
      },
    });

    if (duplicateCategory) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: {
        id: (await params).id,
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color,
      },
      include: {
        _count: {
          select: {
            termCategories: true,
            phraseCategories: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check if category exists and belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: (await params).id,
        user: { id: user.id },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category has any terms or phrases
    const categoryWithContent = await prisma.category.findFirst({
      where: {
        id: (await params).id,
      },
      include: {
        _count: {
          select: {
            termCategories: true,
            phraseCategories: true,
          },
        },
      },
    });

    if (
      categoryWithContent &&
      (categoryWithContent._count.termCategories > 0 ||
        categoryWithContent._count.phraseCategories > 0)
    ) {
      return NextResponse.json(
        {
          error: "Cannot delete category with content",
          message:
            "Please remove all terms and phrases from this category before deleting it.",
          counts: {
            terms: categoryWithContent._count.termCategories,
            phrases: categoryWithContent._count.phraseCategories,
          },
        },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.category.delete({
      where: {
        id: (await params).id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
