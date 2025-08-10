import { useState } from 'react'
import type { Article } from '../lib/api'
import { searchArticles } from '../lib/api'

export interface GameState {
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

export function useGame() {
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

  const [articles, setArticles] = useState<Article[]>([])

  const gameTopics = [
    'climate change', 'immigration policy', 'healthcare reform', 
    'tax policy', 'education funding', 'gun control',
    'trade policy', 'social security', 'minimum wage'
  ]

  const fetchGameArticles = async (): Promise<Article[]> => {
    try {
      const randomTopic = gameTopics[Math.floor(Math.random() * gameTopics.length)]
      const data = await searchArticles(randomTopic)
      
      // Filter articles with known bias scores for accurate scoring
      const knownBiasArticles = data.articles.filter(article => 
        article.method === 'outlet' && article.confidence > 0.6
      )
      
      if (knownBiasArticles.length > 0) {
        setArticles(knownBiasArticles)
        return knownBiasArticles
      }
      return []
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      return []
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

  const startGame = async () => {
    const gameArticles = await fetchGameArticles()
    if (gameArticles.length === 0) {
      throw new Error('Unable to load articles')
    }
    
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
  }

  const submitGuess = (userGuess: number) => {
    if (!gameState.currentArticle) return

    const actualBias = gameState.currentArticle.spectrum_score
    const distance = Math.abs(userGuess - actualBias)
    const accuracy = Math.max(0, 1 - distance / 2)
    const roundScore = calculateScore(userGuess, actualBias)
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
      userGuess,
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
  }

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      streak: 0,
      round: 0,
      gamePhase: 'menu',
      currentArticle: null,
      userGuess: null,
      roundScore: 0,
      accuracy: 0
    }))
  }

  return {
    gameState,
    startGame,
    submitGuess,
    nextRound,
    resetGame
  }
} 