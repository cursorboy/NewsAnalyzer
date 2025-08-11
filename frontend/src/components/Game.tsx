import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import type { Article } from '../lib/api'
import { searchArticles } from '../lib/api'
import { useArticles } from '../context/ArticlesContext'

interface GameState {
  score: number
  streak: number
  highScore: number
  round: number
  gamePhase: 'menu' | 'playing' | 'revealed' | 'gameOver'
  currentArticle: Article | null
  userGuess: number | null
  roundScore: number
  accuracy: number
}

export default function Game() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { getCachedArticles, cacheArticles } = useArticles()
  const searchQuery = searchParams.get('q') || ''
  
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    streak: 0,
    highScore: parseInt(localStorage.getItem('biasDetectiveHighScore') || '0'),
    round: 0,
    gamePhase: 'menu',
    currentArticle: null,
    userGuess: null,
    roundScore: 0,
    accuracy: 0
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragPosition, setDragPosition] = useState(0)
  const [articles, setArticles] = useState<Article[]>([])
  const spectrumRef = useRef<HTMLDivElement>(null)

  // Game topics for variety (fallback if no search query)
  const gameTopics = [
    'climate change', 'immigration policy', 'healthcare reform', 
    'tax policy', 'education funding', 'gun control',
    'trade policy', 'social security', 'minimum wage'
  ]

  // Process articles for game use (filtering and organizing)
  const processArticlesForGame = (articles: Article[]) => {
    // Filter articles with known bias scores for accurate scoring
    const knownBiasArticles = articles.filter(article => 
      (article.method === 'outlet' || article.method === 'ai') && article.confidence > 0.5
    )
    
    console.log(`Found ${knownBiasArticles.length} articles with good confidence scores`)
    
    // If we have enough articles, try to get diversity across the spectrum
    if (knownBiasArticles.length >= 8) {
      const leftArticles = knownBiasArticles.filter(a => a.spectrum_score <= -0.3)
      const centerArticles = knownBiasArticles.filter(a => a.spectrum_score > -0.3 && a.spectrum_score < 0.3)
      const rightArticles = knownBiasArticles.filter(a => a.spectrum_score >= 0.3)
      
      // Mix articles from different parts of spectrum
      const mixedArticles = [
        ...leftArticles.slice(0, 3),
        ...centerArticles.slice(0, 4), 
        ...rightArticles.slice(0, 3)
      ]
      
      // Shuffle for random order in game
      const shuffled = mixedArticles.sort(() => Math.random() - 0.5)
      
      if (shuffled.length >= 5) {  // Need at least 5 articles for a good game
        console.log(`Using ${shuffled.length} diverse articles for game`)
        setArticles(shuffled)
        return shuffled
      }
    }
    
    // Fallback: use any articles we have with good confidence
    if (knownBiasArticles.length >= 3) {
      const shuffledAll = knownBiasArticles.sort(() => Math.random() - 0.5).slice(0, 10)
      console.log(`Using ${shuffledAll.length} articles (fallback mode)`)
      setArticles(shuffledAll)
      return shuffledAll
    }
    
    return []
  }

  // Fetch articles for the game
  const fetchGameArticles = async () => {
    try {
      // Use search query if provided, otherwise use random topic
      const topic = searchQuery || gameTopics[Math.floor(Math.random() * gameTopics.length)]
      
      // Check cache first if we have a specific search query
      if (searchQuery) {
        const cachedArticles = getCachedArticles(searchQuery)
        if (cachedArticles) {
          console.log(`Using ${cachedArticles.length} cached articles for "${searchQuery}" - no API call needed!`)
          return processArticlesForGame(cachedArticles)
        }
      }
      
      console.log(`No cached articles found for "${topic}", making API call...`)
      const data = await searchArticles(topic)
      
      // Cache the new results
      cacheArticles(topic, data.articles)
      
      return processArticlesForGame(data.articles)
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      return []
    }
  }

  const startGame = async () => {
    console.log('Starting game...')
    try {
      const gameArticles = await fetchGameArticles()
      console.log('Fetched articles:', gameArticles.length)
      
      if (gameArticles.length === 0) {
        console.log('No articles found, showing alert')
        alert('Unable to load articles. Please try again.')
        return
      }
      
      console.log('Setting game state to playing with first article:', gameArticles[0])
      setGameState(prev => ({
        ...prev,
        score: 0,
        streak: 0,
        round: 1,
        gamePhase: 'playing',
        currentArticle: gameArticles[0],
        userGuess: null,
        roundScore: 0
      }))
      setDragPosition(0)
      console.log('Game state updated successfully')
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Error starting game. Please try again.')
    }
  }

  const calculateScore = (userGuess: number, actualBias: number): number => {
    const distance = Math.abs(userGuess - actualBias)
    const accuracy = Math.max(0, 1 - distance / 2) // 0-1 scale
    const baseScore = Math.round(accuracy * 100)
    
    // Streak bonus
    const streakBonus = gameState.streak * 5
    return Math.min(150, baseScore + streakBonus)
  }

  const submitGuess = () => {
    if (!gameState.currentArticle || gameState.userGuess === null) return

    const actualBias = gameState.currentArticle.spectrum_score
    const distance = Math.abs(gameState.userGuess - actualBias)
    const accuracy = Math.max(0, 1 - distance / 2)
    const roundScore = calculateScore(gameState.userGuess, actualBias)
    const isAccurate = distance < 0.3

    const newScore = gameState.score + roundScore
    const newStreak = isAccurate ? gameState.streak + 1 : 0
    const newHighScore = Math.max(gameState.highScore, newScore)

    // Save high score
    if (newHighScore > gameState.highScore) {
      localStorage.setItem('biasDetectiveHighScore', newHighScore.toString())
    }

    setGameState(prev => ({
      ...prev,
      score: newScore,
      streak: newStreak,
      highScore: newHighScore,
      gamePhase: 'revealed',
      roundScore,
      accuracy: Math.round(accuracy * 100)
    }))
  }

  const nextRound = () => {
    if (gameState.round >= 10) {
      setGameState(prev => ({ ...prev, gamePhase: 'gameOver' }))
      return
    }

    const nextArticle = articles[gameState.round] || articles[Math.floor(Math.random() * articles.length)]
    setGameState(prev => ({
      ...prev,
      round: prev.round + 1,
      currentArticle: nextArticle,
      gamePhase: 'playing',
      userGuess: null,
      roundScore: 0
    }))
    setDragPosition(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (gameState.gamePhase !== 'playing') return
    setIsDragging(true)
    updatePosition(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && gameState.gamePhase === 'playing') {
      updatePosition(e.clientX)
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false)
      setGameState(prev => ({ ...prev, userGuess: dragPosition }))
    }
  }

  const updatePosition = (clientX: number) => {
    if (!spectrumRef.current) return
    
    const rect = spectrumRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const width = rect.width
    const position = Math.max(-1, Math.min(1, (x / width) * 2 - 1))
    setDragPosition(position)
  }

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState.gamePhase !== 'playing') return
    setIsDragging(true)
    updatePosition(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && gameState.gamePhase === 'playing') {
      updatePosition(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false)
      setGameState(prev => ({ ...prev, userGuess: dragPosition }))
    }
  }

  const getBiasLabel = (score: number) => {
    if (score <= -0.7) return 'Far Left'
    if (score <= -0.3) return 'Left'
    if (score <= 0.3) return 'Center'
    if (score <= 0.7) return 'Right'
    return 'Far Right'
  }

  const getBiasColor = (score: number) => {
    if (score <= -0.5) return 'text-blue-600'
    if (score <= 0) return 'text-blue-400'
    if (score <= 0.5) return 'text-red-400'
    return 'text-red-600'
  }

  if (gameState.gamePhase === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Bias Detective</h1>
          {searchQuery ? (
            <p className="text-xl text-gray-600 mb-8">
              Test your bias detection skills with articles about <span className="font-semibold text-purple-600">"{searchQuery}"</span>. 
              Drag each article to where you think it belongs on the political spectrum!
            </p>
          ) : (
            <p className="text-xl text-gray-600 mb-8">
              Test your ability to detect political bias in news articles. 
              Drag each article to where you think it belongs on the political spectrum!
            </p>
          )}
          
          <div className="bg-white rounded-lg p-6 shadow-lg mb-8">
            <h3 className="text-lg font-semibold mb-4">How to Play:</h3>
            <div className="space-y-2 text-left">
              <p>• Read the headline and snippet</p>
              <p>• Drag the article to its position on the spectrum</p>
              <p>• Score points based on accuracy</p>
              <p>• Build streaks for bonus points</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-lg font-semibold text-gray-700">
              High Score: <span className="text-purple-600">{gameState.highScore}</span>
            </p>
          </div>

          <div className="space-x-4">
            <button
              onClick={startGame}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-full text-xl font-semibold transition-colors"
            >
              {searchQuery ? `Start Game: "${searchQuery}"` : 'Start Game'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (gameState.gamePhase === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Game Over!</h1>
          
          <div className="bg-white rounded-lg p-8 shadow-lg mb-8">
            <div className="space-y-4">
              <p className="text-2xl font-semibold">Final Score: <span className="text-purple-600">{gameState.score}</span></p>
              <p className="text-lg">Best Streak: <span className="text-green-600">{gameState.streak}</span></p>
              <p className="text-lg">Rounds Completed: <span className="text-blue-600">{gameState.round - 1}</span></p>
              {gameState.score === gameState.highScore && (
                <p className="text-lg font-bold text-yellow-600">New High Score!</p>
              )}
            </div>
          </div>

          <div className="space-x-4">
            <button
              onClick={startGame}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Play Again
            </button>
            {searchQuery && (
              <button
                onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
              >
                Show Graph
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
              title="Back to Home"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Bias Detective</h1>
            <div className="text-sm text-gray-600">Round {gameState.round}/10</div>
            {searchQuery && (
              <div className="text-sm text-purple-600 font-medium">Topic: "{searchQuery}"</div>
            )}
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-lg font-semibold">Score: <span className="text-purple-600">{gameState.score}</span></div>
            <div className="text-lg font-semibold">Streak: <span className="text-green-600">{gameState.streak}</span></div>
            <div className="text-sm text-gray-600">High: {gameState.highScore}</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {gameState.gamePhase === 'playing' && gameState.currentArticle && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Instructions */}
              <div className="text-center">
                <p className="text-lg text-gray-700">
                  Drag this article to where you think it belongs on the political spectrum
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  💡 Click the article to read it in a new tab
                </p>
              </div>

              {/* Article Card */}
              <motion.div
                className={`bg-white rounded-lg shadow-lg p-6 cursor-grab ${isDragging ? 'cursor-grabbing' : ''} relative`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-sm text-gray-500 mb-2">{gameState.currentArticle.source}</div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">{gameState.currentArticle.title}</h2>
                <p className="text-gray-700 mb-3">{gameState.currentArticle.snippet}</p>
                
                {/* Clickable link overlay */}
                <button
                  onClick={() => gameState.currentArticle?.url && window.open(gameState.currentArticle.url, '_blank')}
                  className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors"
                  title="Read full article"
                >
                  📖 Read Article
                </button>
              </motion.div>

              {/* Political Spectrum */}
              <div className="space-y-4">
                <div
                  ref={spectrumRef}
                  className="relative h-24 bg-gradient-to-r from-blue-500 via-gray-200 to-red-500 rounded-lg cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Labels */}
                  <div className="absolute top-2 left-2 text-white text-sm font-semibold">Liberal</div>
                  <div className="absolute top-2 right-2 text-white text-sm font-semibold">Conservative</div>
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-gray-700 text-sm font-semibold">Center</div>

                  {/* User's guess indicator */}
                  {gameState.userGuess !== null && (
                    <motion.div
                      className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full"
                      style={{ left: `${((gameState.userGuess + 1) / 2) * 100}%`, marginLeft: '-8px' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  )}

                  {/* Dragging indicator */}
                  {isDragging && (
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full"
                      style={{ left: `${((dragPosition + 1) / 2) * 100}%`, marginLeft: '-8px' }}
                    />
                  )}
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>-1.0</span>
                  <span>0.0</span>
                  <span>+1.0</span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  onClick={submitGuess}
                  disabled={gameState.userGuess === null}
                  className={`px-8 py-3 rounded-full font-semibold transition-colors ${
                    gameState.userGuess !== null
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Submit Guess
                </button>
              </div>
            </motion.div>
          )}

          {gameState.gamePhase === 'revealed' && gameState.currentArticle && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Results */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900">Round {gameState.round} Results</h2>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Your Guess</p>
                      <p className={`text-lg font-bold ${getBiasColor(gameState.userGuess || 0)}`}>
                        {getBiasLabel(gameState.userGuess || 0)} ({(gameState.userGuess || 0).toFixed(2)})
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Actual Bias</p>
                      <p className={`text-lg font-bold ${getBiasColor(gameState.currentArticle.spectrum_score)}`}>
                        {getBiasLabel(gameState.currentArticle.spectrum_score)} ({gameState.currentArticle.spectrum_score.toFixed(2)})
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Round Score</p>
                      <p className="text-lg font-bold text-purple-600">+{gameState.roundScore}</p>
                    </div>
                  </div>

                  <div className="text-lg">
                    Accuracy: <span className="font-bold text-green-600">{gameState.accuracy}%</span>
                  </div>
                  
                  {gameState.currentArticle.reasoning && (
                    <div className="mt-6 bg-blue-50 border-l-4 border-blue-200 p-4 text-left">
                      <div className="font-semibold text-blue-800 mb-2">AI Analysis:</div>
                      <div className="text-sm text-blue-700">{gameState.currentArticle.reasoning}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Spectrum with both guesses */}
              <div className="space-y-4">
                <div className="relative h-24 bg-gradient-to-r from-blue-500 via-gray-200 to-red-500 rounded-lg">
                  {/* Labels */}
                  <div className="absolute top-2 left-2 text-white text-sm font-semibold">Liberal</div>
                  <div className="absolute top-2 right-2 text-white text-sm font-semibold">Conservative</div>
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-gray-700 text-sm font-semibold">Center</div>

                  {/* User's guess */}
                  <div
                    className="absolute top-1/4 transform -translate-y-1/2 w-4 h-4 bg-yellow-400 border-2 border-yellow-600 rounded-full"
                    style={{ left: `${((gameState.userGuess || 0) + 1) / 2 * 100}%`, marginLeft: '-8px' }}
                  />
                  <div
                    className="absolute top-1/4 transform translate-y-1 text-xs font-semibold text-yellow-700"
                    style={{ left: `${((gameState.userGuess || 0) + 1) / 2 * 100}%`, marginLeft: '-20px' }}
                  >
                    Your Guess
                  </div>

                  {/* Actual bias */}
                  <div
                    className="absolute top-3/4 transform -translate-y-1/2 w-4 h-4 bg-green-500 border-2 border-green-700 rounded-full"
                    style={{ left: `${(gameState.currentArticle.spectrum_score + 1) / 2 * 100}%`, marginLeft: '-8px' }}
                  />
                  <div
                    className="absolute top-3/4 transform translate-y-1 text-xs font-semibold text-green-700"
                    style={{ left: `${(gameState.currentArticle.spectrum_score + 1) / 2 * 100}%`, marginLeft: '-15px' }}
                  >
                    Actual
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="text-center">
                <button
                  onClick={nextRound}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold transition-colors"
                >
                  {gameState.round >= 10 ? 'Finish Game' : 'Next Round'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 