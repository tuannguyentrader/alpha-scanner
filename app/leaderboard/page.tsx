import type { Metadata } from 'next'
import LeaderboardClient from './LeaderboardClient'

interface PageProps {
  searchParams: Promise<{ symbol?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const symbol = params.symbol?.toUpperCase()

  const title = symbol
    ? `${symbol} Signal Accuracy | Alpha Scanner Leaderboard`
    : 'Alpha Scanner Leaderboard'
  const description = symbol
    ? `See ${symbol} trading signal accuracy, win rate, and rank on Alpha Scanner`
    : 'See which trading pairs have the highest signal accuracy'

  const ogImage = symbol
    ? `/api/og/leaderboard/${encodeURIComponent(symbol)}`
    : '/og-image.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function LeaderboardPage() {
  return <LeaderboardClient />
}
