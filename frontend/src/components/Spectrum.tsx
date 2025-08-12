import type { Article } from '../lib'
import { motion } from 'framer-motion'
import { useState } from 'react'

export function Spectrum({ articles }: { articles: Article[] }) {
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)
  const hasSelection = selectedArticle !== null
  return (
    <div className="relative w-full h-full min-h-[calc(100vh-80px)] overflow-hidden">
      {/* Blue (Liberal) on the left, Red (Conservative) on the right */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-gray-100 to-red-500" />
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute left-2 top-2 bg-white/90 text-xs px-2 py-1 rounded">Liberal</div>
        <div className="absolute right-2 top-2 bg-white/90 text-xs px-2 py-1 rounded">Conservative</div>
        <div className="absolute left-2 bottom-2 bg-white/90 text-xs px-2 py-1 rounded">Liberal</div>
        <div className="absolute right-2 bottom-2 bg-white/90 text-xs px-2 py-1 rounded">Conservative</div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 bg-white/90 text-xs px-2 py-1 rounded">Neutral</div>
        
        {/* Instructions */}
        {!hasSelection && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm text-center pointer-events-none">
            💡 Click on any article to focus and read its AI analysis
          </div>
        )}
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
                <PositionedCard 
                  key={a.url || index} 
                  article={a} 
                  index={index}
                  isSelected={selectedArticle === a.url}
                  hasSelection={hasSelection}
                  onSelect={() => setSelectedArticle(selectedArticle === a.url ? null : a.url)}
                />
              ))}
            </div>
            
            {/* Clear selection button */}
            {selectedArticle && (
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black/90 transition-colors z-10"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function PositionedCard({ 
  article, 
  index, 
  isSelected, 
  hasSelection,
  onSelect 
}: { 
  article: Article; 
  index: number;
  isSelected: boolean;
  hasSelection: boolean;
  onSelect: () => void;
}) {
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
    <motion.div
      className="absolute"
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: hasSelection ? (isSelected ? 1 : 0.3) : 1, 
        y: 0,
        scale: isSelected ? 1.05 : 1,
        zIndex: isSelected ? 50 : 1
      }}
      transition={{ type: 'spring', stiffness: 120, damping: 16, delay: index * 0.1 }}
      style={{ 
        left: `calc(${leftPercent}% - 140px + ${jitterX + globalOffset}px)`, 
        top: `${topPercent}%`,
        maxWidth: '280px'
      }}
    >
      <div
        onClick={(e) => {
          e.preventDefault()
          onSelect()
        }}
        className={`w-[280px] border rounded-lg shadow-sm p-4 transition-all cursor-pointer ${
          isSelected 
            ? 'bg-white border-blue-500 shadow-xl ring-4 ring-blue-200/50 min-h-[200px]' 
            : 'bg-white/95 hover:shadow-md hover:bg-white border-gray-200'
        }`}
        style={{ borderColor: isSelected ? '#3b82f6' : 'rgba(0,0,0,0.08)' }}
      >
        {/* Read article link - at the top when selected */}
        {isSelected && (
          <div className="mb-3">
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              📖 Read Article
            </a>
          </div>
        )}
        
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
        {article.reasoning && (
          <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border-l-2 border-blue-200">
            <div className="font-medium text-blue-700 mb-1">AI Analysis:</div>
            <div className={isSelected ? 'line-clamp-4' : 'line-clamp-2'}>
              {/* Limit to first paragraph or 200 characters */}
              {article.reasoning.split('\n')[0].substring(0, 200)}
              {article.reasoning.length > 200 ? '...' : ''}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
} 