import { useEffect, useState } from "react"
import { Search, Clock, FileText, Sparkles, ChevronRight, ExternalLink } from "lucide-react"

type SearchQuery = {
  id: number
  createdAt: string
  updatedAt: string
  queryText: string
  aiSummaryAnswer: string
  relevantArticles: string[]
}



function extractQueryText(text: string) {
  try {
    const obj = JSON.parse(text)
    if (obj.query) return obj.query
  } catch (_) {
    console.log("App.tsx :: extractQueryText : could not extract querytext.")
  }
  return text
}

export default function App() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [latest, setLatest] = useState<SearchQuery | null>(null)
  const [history, setHistory] = useState<SearchQuery[]>([])
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  // load history on mount
  useEffect(() => {
    fetch("/api/search-queries")
      .then((r) => r.json())
      .then((data) => setHistory(data.sort((a: SearchQuery, b: SearchQuery) => b.id - a.id)))
      .catch(() => setError("Failed to load history"))
  }, [])

  async function submit(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault()
    setError("")
    if (!query.trim()) return

    setLoading(true)
    setSelectedArticle(null)
    try {
      const res = await fetch("/api/search-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      if (!res.ok) throw new Error("Request failed")
      const data: SearchQuery = await res.json()
      setLatest(data)
      setHistory((h) => [data, ...h])
      setQuery("")
    } catch (err) {
      setError("Backend not reachable")
    } finally {
      setLoading(false)
    }
  }

  function openArticle(articleId: string) {
    setSelectedArticle(articleId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Knowledge Search
            </h1>
          </div>
          <p className="text-slate-400 text-lg">
            Get instant answers from our knowledge base powered by AI
          </p>
        </header>

        {/* Search Form */}
        <div className="mb-8">
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                className="w-full pl-12 pr-32 py-4 text-lg bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ask me anything..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                disabled={loading || !query.trim()}
                onClick={submit}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
            {error && (
              <div className="mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Result */}
            {latest && !selectedArticle && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  <h2 className="text-xl font-semibold text-white">AI Answer</h2>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm text-slate-400 mb-2">Your question:</div>
                  <div className="text-white bg-white/5 rounded-lg p-3 border border-white/10">
                    {extractQueryText(latest.queryText)}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-sm text-slate-400 mb-2">AI Summary:</div>
                  <div className="text-white leading-relaxed">
                    {latest.aiSummaryAnswer}
                  </div>
                </div>

                {latest.relevantArticles?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-300">Related Articles</span>
                    </div>
                    <div className="space-y-2">
                      {latest.relevantArticles.map((articleId, i) => (
                        <button
                          key={i}
                          onClick={() => openArticle(articleId)}
                          className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-blue-300 group-hover:text-blue-200">
                              {articleId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Article View */}
            {selectedArticle && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    ← Back to results
                  </button>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <ExternalLink className="h-4 w-4" />
                    <span>Article Details</span>
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-4">
                  {selectedArticle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h2>
                <div className="text-slate-200 leading-relaxed space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-200 text-sm font-medium mb-2">📖 Article Content</p>
                    <h3 className="text-white font-semibold mb-2">{selectedArticle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    <p className="text-slate-300 mb-3">
                      This comprehensive guide covers the essential aspects of {selectedArticle.replace(/-/g, ' ')}. 
                      Our knowledge base contains detailed information to help you understand and implement best practices.
                    </p>
                    <p className="text-slate-300 mb-3">
                      <strong className="text-white">Key Points:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 mb-4">
                      <li>Comprehensive overview of the topic and its importance</li>
                      <li>Step-by-step implementation guidelines</li>
                      <li>Common pitfalls and how to avoid them</li>
                      <li>Best practices recommended by industry experts</li>
                      <li>Troubleshooting tips and solutions</li>
                    </ul>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 mt-4">
                      <p className="text-slate-400 text-sm">
                        <strong className="text-slate-300">Note:</strong> This is demo content created by Dheeraj. 
                        In your actual implementation, this content would be fetched from your backend API 
                        using the article ID: <span className="text-blue-300 font-mono">{selectedArticle}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <h4 className="text-green-200 font-medium mb-2">💡 Quick Tips</h4>
                      <p className="text-slate-300 text-sm">
                        Start with the basics and gradually work your way up to more advanced concepts. 
                        Practice makes perfect!
                      </p>
                    </div>
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <h4 className="text-purple-200 font-medium mb-2">🔗 Related Topics</h4>
                      <p className="text-slate-300 text-sm">
                        Explore related articles in our knowledge base for a deeper understanding.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Welcome State */}
            {!latest && !selectedArticle && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
                <div className="mb-4">
                  <div className="inline-flex p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl">
                    <Search className="h-8 w-8 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Ready to help you find answers</h3>
                <p className="text-slate-400">
                  Search through our knowledge base and get AI-powered summaries with relevant articles.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white mb-4">Search Statistics</h3>
                              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Searches</span>
                  <span className="text-white font-medium">{history.length}</span>
                </div>
                {latest && latest.relevantArticles && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Related Articles</span>
                    <span className="text-white font-medium">{latest.relevantArticles.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Searches */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Searches
                </h3>
                {history.length > 3 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    {showHistory ? 'Show less' : 'View all'}
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {(showHistory ? history : history.slice(0, 3)).map((item) => (
                  <div key={item.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-sm text-white mb-1 line-clamp-2">
                      {extractQueryText(item.queryText)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-slate-400 text-sm text-center py-4">
                    No searches yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}