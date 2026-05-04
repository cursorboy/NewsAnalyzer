import NeuralLoader from './NeuralLoader'

export function LoadingSpectrum() {
  return (
    <div className="flex h-full min-h-[calc(100vh-80px)] w-full items-center justify-center bg-paper">
      <NeuralLoader label="Running comparison-bias inference" />
    </div>
  )
}

export default LoadingSpectrum
