import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/phrases/[id] - Get single phrase
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

    const phrase = await prisma.medicalPhrase.findFirst({
      where: {
        id: (await params).id,
        user: { id: user.id },
      },
      include: {
        categories: true,
      },
    });

    if (!phrase) {
      return NextResponse.json({ error: "Phrase not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: phrase,
    });
  } catch (error) {
    console.error("Error fetching phrase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/phrases/[id] - Update phrase
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
    const { phrase: phraseText, explanation, context, categories } = body;

    if (!phraseText?.trim() || !explanation?.trim()) {
      return NextResponse.json(
        { error: "Phrase and explanation are required" },
        { status: 400 }
      );
    }

    const phraseId = (await params).id;

    // Check if phrase exists and belongs to user
    const existingPhrase = await prisma.medicalPhrase.findFirst({
      where: {
        id: phraseId,
        createdBy: user.id,
      },
    });
    if (!existingPhrase) {
      return NextResponse.json({ error: "Phrase not found" }, { status: 404 });
    }

    // Check for duplicate phrase
    const duplicatePhrase = await prisma.medicalPhrase.findFirst({
      where: {
        phrase: phraseText.trim(),
        createdBy: user.id,
        id: { not: phraseId },
      },
    });
    if (duplicatePhrase) {
      return NextResponse.json(
        { error: "A phrase with this text already exists" },
        { status: 409 }
      );
    }

    // Update phrase and categories in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the phrase
      const updatedPhrase = await tx.medicalPhrase.update({
        where: { id: phraseId },
        data: {
          phrase: phraseText.trim(),
          explanation: explanation.trim(),
          // context: context?.trim() || null,
        },
      });

      // Update categories
      await tx.medicalPhraseCategory.deleteMany({
        where: { phraseId },
      });

      if (Array.isArray(categories) && categories.length > 0) {
        await tx.medicalPhraseCategory.createMany({
          data: categories.map((categoryId: string) => ({
            phraseId,
            categoryId,
          })),
        });
      }

      // Fetch the complete updated phrase with categories
      return await tx.medicalPhrase.findUnique({
        where: { id: phraseId },
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
      message: "Phrase updated successfully",
    });
  } catch (error) {
    console.error("Error updating phrase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/phrases/[id] - Delete phrase
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

    // Check if phrase exists and belongs to user
    const existingPhrase = await prisma.medicalPhrase.findFirst({
      where: {
        id: (await params).id,
        user: { id: user.id },
      },
    });

    if (!existingPhrase) {
      return NextResponse.json({ error: "Phrase not found" }, { status: 404 });
    }

    // Delete the phrase
    await prisma.medicalPhrase.delete({
      where: {
        id: (await params).id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Phrase deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting phrase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
