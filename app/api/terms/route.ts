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

    const terms = await prisma.medicalTerm.findMany({
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
    const transformedTerms = terms.map(term => ({
      ...term,
      categories: term.categories.map(tc => tc.category)
    }))

    return NextResponse.json({
      success: true,
      data: transformedTerms
    })
  } catch (error) {
    console.error('Error fetching terms:', error)
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

    const { term, meaning, pronunciation, categoryIds } = await request.json()

    if (!term || !meaning) {
      return NextResponse.json(
        { success: false, error: 'Term and meaning are required' },
        { status: 400 }
      )
    }

    const medicalTerm = await prisma.medicalTerm.create({
      data: {
        term,
        meaning,
        pronunciation,
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
    const transformedTerm = {
      ...medicalTerm,
      categories: medicalTerm.categories.map(tc => tc.category)
    }

    return NextResponse.json({
      success: true,
      data: transformedTerm
    })
  } catch (error) {
    console.error('Error creating term:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}