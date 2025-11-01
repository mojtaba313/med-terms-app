import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/terms/[id] - Get single term
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

    const term = await prisma.medicalTerm.findFirst({
      where: {
        id: (await params).id,
        user: { id: user.id },
      },
      include: {
        categories: true,
      },
    });

    if (!term) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: term,
    });
  } catch (error) {
    console.error("Error fetching term:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/terms/[id] - Update term
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
    const { term: termText, meaning, pronunciation, categories } = body;

    if (!termText?.trim() || !meaning?.trim()) {
      return NextResponse.json(
        { error: "Term and meaning are required" },
        { status: 400 }
      );
    }

    const termId = (await params).id;

    // Check if term exists and belongs to user
    const existingTerm = await prisma.medicalTerm.findFirst({
      where: {
        id: termId,
        createdBy: user.id,
      },
    });
    if (!existingTerm) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    // Check for duplicate term
    const duplicateTerm = await prisma.medicalTerm.findFirst({
      where: {
        term: termText.trim(),
        createdBy: user.id,
        id: { not: termId },
      },
    });
    if (duplicateTerm) {
      return NextResponse.json(
        { error: "A term with this name already exists" },
        { status: 409 }
      );
    }

    // Update term and categories in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the term
      const updatedTerm = await tx.medicalTerm.update({
        where: { id: termId },
        data: {
          term: termText.trim(),
          meaning: meaning.trim(),
          pronunciation: pronunciation?.trim() || null,
        },
      });

      // Update categories
      await tx.medicalTermCategory.deleteMany({
        where: { termId },
      });

      if (Array.isArray(categories) && categories.length > 0) {
        await tx.medicalTermCategory.createMany({
          data: categories.map((categoryId: string) => ({
            termId,
            categoryId,
          })),
        });
      }

      // Fetch the complete updated term with categories
      return await tx.medicalTerm.findUnique({
        where: { id: termId },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Term updated successfully",
    });
  } catch (error) {
    console.error("Error updating term:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/terms/[id] - Delete term
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

    // Check if term exists and belongs to user
    const existingTerm = await prisma.medicalTerm.findFirst({
      where: {
        id: (await params).id,
        user: { id: user.id },
      },
    });

    if (!existingTerm) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    // Delete the term
    await prisma.medicalTerm.delete({
      where: {
        id: (await params).id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Term deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting term:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
