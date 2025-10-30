import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@medicalapp.com',
      password: hashedPassword,
      role: 'admin'
    }
  })

  console.log('Admin user created:', admin.username)

  // Create default categories with error handling
  const categoriesData = [
    {
      name: 'Cardiology',
      description: 'Heart and circulatory system',
      color: '#dc2626',
      createdBy: admin.id
    },
    {
      name: 'Neurology',
      description: 'Nervous system and brain',
      color: '#2563eb',
      createdBy: admin.id
    },
    {
      name: 'Gastroenterology',
      description: 'Digestive system',
      color: '#16a34a',
      createdBy: admin.id
    },
    {
      name: 'Orthopedics',
      description: 'Musculoskeletal system',
      color: '#ea580c',
      createdBy: admin.id
    },
    {
      name: 'Pediatrics',
      description: 'Medical care for children',
      color: '#9333ea',
      createdBy: admin.id
    },
    {
      name: 'Dermatology',
      description: 'Skin and its diseases',
      color: '#ca8a04',
      createdBy: admin.id
    }
  ]

  console.log('Creating categories...')
  
  for (const categoryData of categoriesData) {
    try {
      // First try to find if category exists
      const existingCategory = await prisma.category.findFirst({
        where: { name: categoryData.name }
      })

      if (existingCategory) {
        // Update existing category
        await prisma.category.update({
          where: { id: existingCategory.id },
          data: {
            description: categoryData.description,
            color: categoryData.color
          }
        })
        console.log(`✅ Category updated: ${categoryData.name}`)
      } else {
        // Create new category
        await prisma.category.create({
          data: categoryData
        })
        console.log(`✅ Category created: ${categoryData.name}`)
      }
    } catch (error) {
      console.log(`❌ Error with category ${categoryData.name}:`, (error as any).message)
    }
  }

  // Create sample medical terms with error handling
  console.log('Creating medical terms...')
  
  const medicalTermsData = [
    {
      term: 'Hypertension',
      meaning: 'High blood pressure',
      pronunciation: 'haɪ.pərˈten.ʃən',
      createdBy: admin.id
    },
    {
      term: 'Tachycardia',
      meaning: 'Abnormally rapid heart rate',
      pronunciation: 'tæk.ɪˈkɑːr.di.ə',
      createdBy: admin.id
    },
    {
      term: 'Cerebrovascular',
      meaning: 'Relating to the brain and its blood vessels',
      pronunciation: 'sɛr.ɪ.broʊˈvæs.kjə.lər',
      createdBy: admin.id
    },
    {
      term: 'Arthritis',
      meaning: 'Inflammation of joints',
      pronunciation: 'ɑːrˈθraɪ.tɪs',
      createdBy: admin.id
    },
    {
      term: 'Diabetes',
      meaning: 'Metabolic disorder characterized by high blood sugar',
      pronunciation: 'ˌdaɪ.əˈbiː.tiːz',
      createdBy: admin.id
    },
    {
      term: 'Pneumonia',
      meaning: 'Inflammation of the lungs',
      pronunciation: 'nuːˈmoʊ.njə',
      createdBy: admin.id
    }
  ]

  for (const termData of medicalTermsData) {
    try {
      const existingTerm = await prisma.medicalTerm.findFirst({
        where: { term: termData.term }
      })

      if (existingTerm) {
        await prisma.medicalTerm.update({
          where: { id: existingTerm.id },
          data: {
            meaning: termData.meaning,
            pronunciation: termData.pronunciation
          }
        })
        console.log(`✅ Medical term updated: ${termData.term}`)
      } else {
        await prisma.medicalTerm.create({
          data: termData
        })
        console.log(`✅ Medical term created: ${termData.term}`)
      }
    } catch (error) {
      console.log(`❌ Error with medical term ${termData.term}:`, (error as any).message)
    }
  }

  // Create sample medical phrases with error handling
  console.log('Creating medical phrases...')
  
  const medicalPhrasesData = [
    {
      phrase: 'MI',
      explanation: 'Myocardial Infarction - Heart attack',
      createdBy: admin.id
    },
    {
      phrase: 'CVA',
      explanation: 'Cerebrovascular Accident - Stroke',
      createdBy: admin.id
    },
    {
      phrase: 'GERD',
      explanation: 'Gastroesophageal Reflux Disease',
      createdBy: admin.id
    },
    {
      phrase: 'COPD',
      explanation: 'Chronic Obstructive Pulmonary Disease',
      createdBy: admin.id
    },
    {
      phrase: 'UTI',
      explanation: 'Urinary Tract Infection',
      createdBy: admin.id
    },
    {
      phrase: 'AED',
      explanation: 'Automated External Defibrillator',
      createdBy: admin.id
    }
  ]

  for (const phraseData of medicalPhrasesData) {
    try {
      const existingPhrase = await prisma.medicalPhrase.findFirst({
        where: { phrase: phraseData.phrase }
      })

      if (existingPhrase) {
        await prisma.medicalPhrase.update({
          where: { id: existingPhrase.id },
          data: {
            explanation: phraseData.explanation
          }
        })
        console.log(`✅ Medical phrase updated: ${phraseData.phrase}`)
      } else {
        await prisma.medicalPhrase.create({
          data: phraseData
        })
        console.log(`✅ Medical phrase created: ${phraseData.phrase}`)
      }
    } catch (error) {
      console.log(`❌ Error with medical phrase ${phraseData.phrase}:`, (error as any).message)
    }
  }

  // Create some sample flashcards
  console.log('Creating sample flashcards...')
  
  const sampleTerms = await prisma.medicalTerm.findMany({ take: 3 })
  const samplePhrases = await prisma.medicalPhrase.findMany({ take: 2 })

  const flashcardsData = [
    {
      type: 'term',
      front: 'Hypertension',
      back: 'High blood pressure',
      medicalTermId: sampleTerms[0]?.id,
      createdBy: admin.id
    },
    {
      type: 'term',
      front: 'Tachycardia',
      back: 'Abnormally rapid heart rate',
      medicalTermId: sampleTerms[1]?.id,
      createdBy: admin.id
    },
    {
      type: 'phrase',
      front: 'MI',
      back: 'Myocardial Infarction - Heart attack',
      medicalPhraseId: samplePhrases[0]?.id,
      createdBy: admin.id
    },
    {
      type: 'custom',
      front: 'Normal blood pressure range',
      back: '120/80 mmHg or lower',
      createdBy: admin.id
    }
  ]

  for (const flashcardData of flashcardsData) {
    try {
      // Check if flashcard already exists
      let existingFlashcard;
      
      // if (flashcardData.medicalTermId) {
      //   existingFlashcard = await prisma.flashcard.findFirst({
      //     where: { medicalTermId: flashcardData.medicalTermId }
      //   })
      // } else if (flashcardData.medicalPhraseId) {
      //   existingFlashcard = await prisma.flashcard.findFirst({
      //     where: { medicalPhraseId: flashcardData.medicalPhraseId }
      //   })
      // } else {
      //   existingFlashcard = await prisma.flashcard.findFirst({
      //     where: { 
      //       front: flashcardData.front,
      //       type: 'custom'
      //     }
      //   })
      // }

      // if (existingFlashcard) {
      //   await prisma.flashcard.update({
      //     where: { id: existingFlashcard.id },
      //     data: flashcardData
      //   })
      //   console.log(`✅ Flashcard updated: ${flashcardData.front}`)
      // } else {
      //   await prisma.flashcard.create({
      //     data: flashcardData
      //   })
      //   console.log(`✅ Flashcard created: ${flashcardData.front}`)
      // }
    } catch (error) {
      console.log(`❌ Error with flashcard ${flashcardData.front}:`, (error as any).message)
    }
  }

  console.log('🎉 Database seeded successfully!')
  console.log('📊 Summary:')
  console.log(`   👤 Admin user: ${admin.username}`)
  console.log(`   📁 Categories: ${categoriesData.length}`)
  console.log(`   📖 Medical terms: ${medicalTermsData.length}`)
  console.log(`   💬 Medical phrases: ${medicalPhrasesData.length}`)
  console.log(`   🃏 Flashcards: ${flashcardsData.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })