import { useState, useEffect } from 'react'
import { getAPIStatus, type APIStatus } from '../lib/api'

export default function APIStatusDashboard() {
  const [status, setStatus] = useState<APIStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const apiStatus = await getAPIStatus()
      setStatus(apiStatus)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchStatus}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Status Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor Google Custom Search API usage and rate limits</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={fetchStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Refresh
            </button>
            <a 
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>

        {status && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Configuration Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">API Configured</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status.api_configured 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {status.api_configured ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Requests</span>
                  <span className="font-semibold text-gray-900">{status.total_requests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Failed Requests</span>
                  <span className="font-semibold text-gray-900">{status.failed_requests}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className={`font-semibold ${
                    status.success_rate >= 90 ? 'text-green-600' :
                    status.success_rate >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {status.success_rate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Rate Limit Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Limits</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rate Limited</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status.rate_limited 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {status.rate_limited ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Quota Exceeded</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status.quota_exceeded 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {status.quota_exceeded ? 'Yes' : 'No'}
                  </span>
                </div>
                {status.last_request_time && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Last Request</span>
                    <span className="text-xs text-gray-500">
                      {new Date(status.last_request_time).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Last Error */}
            {status.last_error && (
              <div className="bg-white rounded-lg shadow-sm border p-6 md:col-span-2 lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Error</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <div className="font-medium text-red-800">{status.last_error.type}</div>
                      <div className="text-red-700 text-sm mt-1">{status.last_error.message}</div>
                      <div className="text-red-600 text-xs mt-2">
                        {new Date(status.last_error.time).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={fetchStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Refresh Status
            </button>
            <a 
              href="https://console.cloud.google.com/apis/api/customsearch.googleapis.com/quotas"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              View Google Quotas
            </a>
            <a 
              href="https://console.cloud.google.com/apis/api/customsearch.googleapis.com/metrics"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              View API Metrics
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
