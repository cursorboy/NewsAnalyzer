import NeuralLoader from './NeuralLoader'

export function LoadingSpectrum() {
  return (
    <div className="flex h-full min-h-[calc(100vh-80px)] w-full items-center justify-center bg-paper">
      <NeuralLoader label="Cross-referencing 10,000hr corpus" />
    </div>
  )
}

export default LoadingSpectrum
