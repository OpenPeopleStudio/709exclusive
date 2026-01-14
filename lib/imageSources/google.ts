export interface GoogleImageResult {
  imageUrl: string
  thumbnail: string
  width: number
  height: number
  sourcePage: string
}

export async function searchGoogleImages({
  brand,
  model,
  limit = 10
}: {
  brand: string
  model: string
  limit?: number
}): Promise<GoogleImageResult[]> {
  const query = `"${brand} ${model}" product studio white background`

  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', process.env.GOOGLE_IMAGE_API_KEY!)
  url.searchParams.set('cx', process.env.GOOGLE_SEARCH_ENGINE_ID!)
  url.searchParams.set('searchType', 'image')
  url.searchParams.set('q', query)
  url.searchParams.set('imgType', 'photo')
  url.searchParams.set('imgSize', 'large')
  url.searchParams.set('safe', 'active')
  url.searchParams.set('num', limit.toString())

  const res = await fetch(url.toString())
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Google image search failed: ${res.status} ${error}`)
  }

  const json = await res.json()

  return (json.items || []).map((item: {
    link: string
    image: {
      thumbnailLink: string
      width: number
      height: number
      contextLink: string
    }
  }) => ({
    imageUrl: item.link,
    thumbnail: item.image.thumbnailLink,
    width: item.image.width,
    height: item.image.height,
    sourcePage: item.image.contextLink
  }))
}