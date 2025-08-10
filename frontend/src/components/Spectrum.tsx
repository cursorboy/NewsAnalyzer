import type { Article } from '../lib/api'
import { motion } from 'framer-motion'

export function Spectrum({ articles }: { articles: Article[] }) {
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Blue (Liberal) on the left, Red (Conservative) on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-gray-100 to-red-500" />
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute left-2 top-2 bg-white/90 text-xs px-2 py-1 rounded">Liberal</div>
        <div className="absolute right-2 top-2 bg-white/90 text-xs px-2 py-1 rounded">Conservative</div>
        <div className="absolute left-2 bottom-2 bg-white/90 text-xs px-2 py-1 rounded">Liberal</div>
        <div className="absolute right-2 bottom-2 bg-white/90 text-xs px-2 py-1 rounded">Conservative</div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 bg-white/90 text-xs px-2 py-1 rounded">Neutral</div>
      </div>
      
      {articles.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 rounded-lg p-6 text-center">
            <p className="text-gray-600">No articles found for this search.</p>
            <p className="text-sm text-gray-500 mt-2">Try a different search term or check back later.</p>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0">
          <div className="relative w-full h-full" id="spectrum-stage">
            <div className="w-full h-full relative">
              {articles.map((a, index) => (
                <PositionedCard key={a.url || index} article={a} index={index} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PositionedCard({ article, index }: { article: Article; index: number }) {
  // Convert spectrum score (-1 to 1) to percentage (0% to 100%)
  const leftPercent = ((article.spectrum_score + 1) / 2) * 100
  
  // Group articles by bias ranges to better distribute them
  const biasRange = Math.abs(article.spectrum_score) < 0.3 ? 'center' : 
                   article.spectrum_score < 0 ? 'left' : 'right'
  
  // Better vertical distribution based on bias range and index
  let rowIndex, topPercent, jitterX
  
  if (biasRange === 'center') {
    // Center articles: use more vertical space and larger jitter
    rowIndex = index % 6  // 6 rows for center articles
    topPercent = 10 + rowIndex * 13  // Tighter vertical spacing
    jitterX = (index % 7 - 3) * 25  // Larger horizontal spread
  } else {
    // Left/Right articles: standard distribution
    rowIndex = index % 5  // 5 rows for partisan articles  
    topPercent = 12 + rowIndex * 15 + (index % 3) * 3  // Varied spacing
    jitterX = (index % 4 - 1.5) * 15  // Moderate horizontal jitter
  }
  
  // Additional offset based on total index to prevent systematic overlaps
  const globalOffset = (index * 7) % 20 - 10  // -10 to +10 variation
  
  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noreferrer"
      className="absolute"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 16, delay: index * 0.1 }}
      style={{ 
        left: `calc(${leftPercent}% - 140px + ${jitterX + globalOffset}px)`, 
        top: `${topPercent}%`,
        maxWidth: '280px'
      }}
    >
      <div
        className="w-[280px] bg-white/95 border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
        style={{ borderColor: 'rgba(0,0,0,0.08)' }}
      >
        <div className="text-xs text-gray-500 mb-2 flex justify-between">
          <span>{article.source}</span>
          <span className="text-xs bg-gray-100 px-1 rounded">
            {article.spectrum_score > 0 ? '+' : ''}{article.spectrum_score.toFixed(2)}
          </span>
        </div>
        <div className="text-sm font-medium mb-2 leading-snug">{article.title}</div>
        <div className="text-xs text-gray-600 line-clamp-3">{article.snippet}</div>
        <div className="mt-2 text-xs text-gray-400">
          {article.method} • {Math.round(article.confidence * 100)}% confidence
        </div>
      </div>
    </motion.a>
  )
} 