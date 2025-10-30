import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    const { term, meaning, pronunciation, categoryIds = [] } = await request.json();

    if (!term || !meaning) {
      return NextResponse.json(
        { error: "Term and meaning are required" },
        { status: 400 }
      );
    }

    // Fix: Handle categories properly
    const medicalTerm = await prisma.medicalTerm.create({
      data: {
        term,
        meaning,
        pronunciation,
        createdBy: payload.userId,
        categories: categoryIds.length > 0 ? {
          create: categoryIds.map((categoryId: string) => ({
            category: {
              connect: { id: categoryId }
            }
          }))
        } : undefined
      },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });

    // Transform the response to match the frontend expectations
    const transformedTerm = {
      ...medicalTerm,
      categories: medicalTerm.categories.map(tc => tc.category)
    };

    return NextResponse.json({ 
      success: true, 
      data: transformedTerm 
    });

  } catch (error: any) {
    console.error("Error creating term:", error);
    
    if (error.code === 'P2018') {
      return NextResponse.json(
        { error: "One or more categories not found" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await verifyJWT(token);

    const terms = await prisma.medicalTerm.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the response
    const transformedTerms = terms.map(term => ({
      ...term,
      categories: term.categories.map(tc => tc.category)
    }));

    return NextResponse.json({ 
      success: true, 
      data: transformedTerms 
    });

  } catch (error) {
    console.error("Error fetching terms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}