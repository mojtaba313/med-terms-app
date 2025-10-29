import { prisma } from '@/lib/prisma'
import { verifyJWT } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    try {
      await verifyJWT(token)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const phrases = await prisma.medicalPhrase.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        },
        user: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match our frontend types
    const transformedPhrases = phrases.map(phrase => ({
      ...phrase,
      categories: phrase.categories.map(pc => pc.category)
    }))

    return NextResponse.json({
      success: true,
      data: transformedPhrases
    })
  } catch (error) {
    console.error('Error fetching phrases:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = await verifyJWT(token)

    const { phrase, explanation, categoryIds } = await request.json()

    if (!phrase || !explanation) {
      return NextResponse.json(
        { success: false, error: 'Phrase and explanation are required' },
        { status: 400 }
      )
    }

    const medicalPhrase = await prisma.medicalPhrase.create({
      data: {
        phrase,
        explanation,
        createdBy: payload.userId,
        categories: categoryIds && categoryIds.length > 0 ? {
          create: categoryIds.map((categoryId: string) => ({
            categoryId
          }))
        } : undefined
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        user: {
          select: {
            username: true
          }
        }
      }
    })

    // Transform the data
    const transformedPhrase = {
      ...medicalPhrase,
      categories: medicalPhrase.categories.map(pc => pc.category)
    }

    return NextResponse.json({
      success: true,
      data: transformedPhrase
    })
  } catch (error) {
    console.error('Error creating phrase:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}