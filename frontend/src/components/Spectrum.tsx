import type { Article } from '../lib/api'
import { motion } from 'framer-motion'

export function Spectrum({ articles }: { articles: Article[] }) {
  return (
    <div className="relative w-full h-[70vh] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-gray-100 to-red-500" />
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute left-2 top-2 bg-white/90 text-xs px-2 py-1 rounded">left leaning</div>
        <div className="absolute right-2 top-2 bg-white/90 text-xs px-2 py-1 rounded">right leaning</div>
        <div className="absolute left-2 bottom-2 bg-white/90 text-xs px-2 py-1 rounded">Far Left</div>
        <div className="absolute right-2 bottom-2 bg-white/90 text-xs px-2 py-1 rounded">Far Right</div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 bg-white/90 text-xs px-2 py-1 rounded">Center</div>
      </div>
      
      {articles.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 rounded-lg p-6 text-center">
            <p className="text-gray-600">No articles found. Try a different search term.</p>
            <p className="text-sm text-gray-500 mt-2">Make sure to configure Google API keys in the backend.</p>
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
  // Stagger vertically to avoid overlap
  const topPercent = 20 + (index % 3) * 25
  
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
        left: `calc(${leftPercent}% - 110px)`, 
        top: `${topPercent}%`,
        maxWidth: '220px'
      }}
    >
      <div
        className="w-[220px] bg-white/95 border rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow cursor-pointer"
        style={{ borderColor: 'rgba(0,0,0,0.08)' }}
      >
        <div className="text-xs text-gray-500 mb-1 flex justify-between">
          <span>{article.source}</span>
          <span className="text-xs bg-gray-100 px-1 rounded">
            {article.spectrum_score > 0 ? '+' : ''}{article.spectrum_score.toFixed(2)}
          </span>
        </div>
        <div className="text-sm font-medium line-clamp-2 mb-1">{article.title}</div>
        <div className="text-xs text-gray-600 line-clamp-2">{article.snippet}</div>
        <div className="mt-2 text-xs text-gray-400">
          {article.method} • {Math.round(article.confidence * 100)}% confidence
        </div>
      </div>
    </motion.a>
  )
} 