import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);

    const phrases = await prisma.medicalPhrase.findMany({
      where: {
        createdBy: payload.userId,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the response
    const transformedTerms = phrases?.map((phrase) => ({
      ...phrase,
      categories: phrase.categories?.map((tc) => tc.category),
    }));

    return NextResponse.json({
      success: true,
      data: transformedTerms,
    });
  } catch (error) {
    console.error("Error fetching phrases:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const { phrase, explanation, categoryIds } = await request.json();

    if (!phrase || !explanation) {
      return NextResponse.json(
        { success: false, error: "Phrase and explanation are required" },
        { status: 400 }
      );
    }

    const medicalPhrase = await prisma.medicalPhrase.create({
      data: {
        phrase,
        explanation,
        createdBy: payload.userId,
        categories:
          categoryIds?.length > 0
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
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    const transformedPhrase = {
      ...medicalPhrase,
      categories: medicalPhrase.categories?.map((tc) => tc.category),
    };

    return NextResponse.json({
      success: true,
      data: transformedPhrase,
    });
  } catch (error) {
    console.error("Error creating phrase:", error);

    // Handle specific Prisma errors
    if (error instanceof Error && "code" in error && error.code === "P2018") {
      return NextResponse.json(
        { success: false, error: "One or more categories were not found" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
