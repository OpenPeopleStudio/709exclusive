import { NextResponse } from 'next/server'
import { searchGoogleImages } from '@/lib/imageSources/google'

export async function GET() {
  try {
    console.log('Testing Google API...')
    console.log('API Key exists:', !!process.env.GOOGLE_IMAGE_API_KEY)
    console.log('Search Engine ID exists:', !!process.env.GOOGLE_SEARCH_ENGINE_ID)

    const images = await searchGoogleImages({
      brand: 'Nike',
      model: 'Air Force 1',
      limit: 5
    })

    return NextResponse.json({
      success: true,
      imagesCount: images.length,
      sampleImage: images[0],
      allImages: images
    })

  } catch (error) {
    console.error('Google test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      envCheck: {
        hasApiKey: !!process.env.GOOGLE_IMAGE_API_KEY,
        hasSearchId: !!process.env.GOOGLE_SEARCH_ENGINE_ID,
        apiKeyLength: process.env.GOOGLE_IMAGE_API_KEY?.length,
        searchIdLength: process.env.GOOGLE_SEARCH_ENGINE_ID?.length
      }
    }, { status: 500 })
  }
}