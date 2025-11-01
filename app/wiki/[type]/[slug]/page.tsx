import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getWikiArticleByTypeAndSlug, generateJsonLd } from "@/lib/wiki-server"
import { InfoboxCard } from "@/components/wiki/infobox-card"
import { ToastBanner } from "@/components/wiki/toast-banner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from "react-markdown"
import type { WikiArticle } from "@/lib/types"

interface PageProps {
  params: Promise<{ type: string; slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { type, slug } = await params
  const article = getWikiArticleByTypeAndSlug(type, slug)

  if (!article) {
    return {
      title: "Article Not Found",
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pawsocial.com"
  const imageUrl = article.coverImage
    ? article.coverImage.startsWith("http")
      ? article.coverImage
      : `${baseUrl}${article.coverImage}`
    : `${baseUrl}/icon-512x512.png`

  return {
    title: article.title,
    description: article.content.substring(0, 160).replace(/\n/g, " "),
    openGraph: {
      title: article.title,
      description: article.content.substring(0, 160).replace(/\n/g, " "),
      url: `${baseUrl}/wiki/${type}/${slug}`,
      siteName: "PawSocial",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      locale: "en_US",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.content.substring(0, 160).replace(/\n/g, " "),
      images: [imageUrl],
    },
    keywords: [
      article.category,
      ...(article.species || []),
      ...(article.subcategory ? [article.subcategory] : []),
      "pet care",
      "animal",
    ],
  }
}

export default async function WikiArticlePage({ params }: PageProps) {
  const { type, slug } = await params
  const article = getWikiArticleByTypeAndSlug(type, slug)

  if (!article) {
    notFound()
  }

  // Generate JSON-LD structured data
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pawsocial.com"
  const jsonLd = generateJsonLd(article, baseUrl)

  // Get author info (placeholder for server-side)
  // In a real app, you'd fetch from a server-side database
  const authorName = "Pet Care Expert"

  // Determine if this is latest version (for demo, assume all are latest)
  const isLatest = true
  const lastReviewedDate = article.updatedAt

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\u003c"),
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Main Content */}
          <div>
            {/* Toast Banner */}
            <ToastBanner
              article={article}
              isLatest={isLatest}
              lastReviewedDate={lastReviewedDate}
            />

            {/* Article Header */}
            <Card className={article.coverImage ? "p-0 overflow-hidden mb-6" : "mb-6"}>
              {article.coverImage && (
                <div className="w-full overflow-hidden">
                  <img
                    src={article.coverImage || "/placeholder.svg"}
                    alt={article.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
              <CardHeader className={`space-y-5 ${article.coverImage ? "pt-8" : ""}`}>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {article.category}
                  </Badge>
                  {article.subcategory && (
                    <Badge variant="outline" className="capitalize">
                      {article.subcategory}
                    </Badge>
                  )}
                  {article.species?.map((species) => (
                    <Badge key={species} variant="outline" className="capitalize">
                      {species}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
                  {article.title}
                </h1>
              </CardHeader>

              {/* Content Blocks */}
              <CardContent className="prose prose-lg prose-slate max-w-none dark:prose-invert">
                <div className="prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-code:text-sm prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border">
                  <ReactMarkdown>{article.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Infobox */}
          <aside className="hidden lg:block">
            <InfoboxCard
              article={article}
              viewCount={article.views}
              likeCount={article.likes?.length || 0}
              authorName={authorName}
            />
          </aside>
        </div>
      </div>
    </>
  )
}

