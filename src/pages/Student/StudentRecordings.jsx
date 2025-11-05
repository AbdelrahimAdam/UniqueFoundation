import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { recordingService, sessionService } from '../../services'
import Button from '../../components/UI/Button.jsx'
import LoadingSpinner from '../../components/UI/LoadingSpinner.jsx'
import {
  Video, Search, Eye, Clock, Users,
  Download, Star, Calendar, Zap, Radio,
  AlertCircle, RefreshCw, ExternalLink, DownloadCloud,
  UserPlus, Check, PlayCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
// Helper functions
const formatDuration = (seconds) => {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`
}
const formatDateTime = (date) => {
  if (!date) return 'TBD'
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
const StudentRecordings = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [recordings, setRecordings] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [liveSessions, setLiveSessions] = useState([])
  const [loading, setLoading] = useState(true) // Fixed line
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [activeTab, setActiveTab] = useState('recordings')
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const studentId = user?.uid
  // Stats
  const stats = useMemo(() => {
    const totalRecordings = recordings.length
    const totalDuration = recordings.reduce((sum, rec) => sum + (rec.duration || 0), 0)
    const totalViews = recordings.reduce((sum, rec) => sum + (rec.views || 0), 0)
    const completedRecordings = recordings.filter(rec => rec.progress >= 95).length
    return {
      totalRecordings,
      totalDuration: formatDuration(totalDuration),
      totalViews,
      completedRecordings,
      completionRate: totalRecordings > 0 ? Math.round((completedRecordings / totalRecordings) * 100) : 0,
      upcomingCount: upcomingSessions.length,
      liveCount: liveSessions.length
    }
  }, [recordings, upcomingSessions, liveSessions])
  // Combined content
  const allContent = useMemo(() => {
    const content = []
    content.push(...recordings.map(rec => ({ ...rec, type: 'recording' })))
    content.push(...upcomingSessions.map(s => ({ ...s, type: 'upcoming', duration: s.duration || 60 })))
    content.push(...liveSessions.map(s => ({ ...s, type: 'live', duration: s.duration || 60 })))
    return content
  }, [recordings, upcomingSessions, liveSessions])
  // Filter & sort
  const filteredContent = useMemo(() => {
    let filtered = [...allContent]
    if (activeTab === 'recordings') filtered = filtered.filter(i => i.type === 'recording')
    if (activeTab === 'upcoming') filtered = filtered.filter(i => i.type === 'upcoming')
    if (activeTab === 'live') filtered = filtered.filter(i => i.type === 'live')
    if (searchTerm) {
      filtered = filtered.filter(i =>
        i.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.instructorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(i => i.category === categoryFilter)
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title': return a.title?.localeCompare(b.title)
        case 'duration': return (b.duration || 0) - (a.duration || 0)
        case 'views': return (b.views || 0) - (a.views || 0)
        case 'scheduledTime': return new Date(a.scheduledTime || 0) - new Date(b.scheduledTime || 0)
        default: return new Date(b.createdAt || b.scheduledTime || 0) - new Date(a.createdAt || a.scheduledTime || 0)
      }
    })
    return filtered
  }, [allContent, activeTab, searchTerm, categoryFilter, sortBy])
  // Extract Drive file ID
  const getDriveFileId = (url) => {
    if (!url) return null
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  }
  // Watch in Google Drive
  const watchInDrive = async (recording) => {
    const fileId = getDriveFileId(recording.recordingUrl)
    if (!fileId) {
      alert('Invalid Google Drive link')
      return
    }
    const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`
    window.open(previewUrl, '_blank', 'noopener,noreferrer')
    if (recording.id) {
      try {
        await recordingService.incrementRecordingViews(recording.id)
        await recordingService.updateStudentProgress(recording.id, studentId, {
          progress: 5,
          lastWatched: new Date()
        })
      } catch (err) {
        console.warn('Progress update failed:', err)
      }
    }
  }
  // Download
  const downloadVideo = async (recording) => {
    const fileId = getDriveFileId(recording.recordingUrl)
    if (!fileId) {
      alert('Cannot download: invalid URL')
      return
    }
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = `${recording.title}.mp4`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  // Join live
  const joinLiveSession = async (session) => {
    if (!session.meetLink) {
      alert('No meeting link')
      return
    }
    try {
      await sessionService.addParticipant(session.id, studentId, {
        email: user?.email,
        name: user?.displayName || 'Student',
        joinedAt: new Date()
      })
    } catch (err) {
      console.warn('Participant add failed:', err)
    }
    window.open(session.meetLink, '_blank', 'noopener,noreferrer')
  }
  // Load data
  useEffect(() => {
    if (studentId) loadAllData()
  }, [studentId])
  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)
      let recordingsData = []
      try {
        const res = await recordingService.getAvailableRecordings({ studentId, limit: 50 })
        recordingsData = Array.isArray(res.recordings) ? res.recordings : []
      } catch (err) { console.warn(err) }
      if (recordingsData.length === 0) {
        try {
          const all = await recordingService.getAllRecordings({ status: 'completed', isPublished: true, limit: 100 })
          recordingsData = all.filter(r => r.isPublished && r.status === 'completed')
        } catch (err) { console.error(err) }
      }
      if (recordingsData.length === 0) {
        try {
          const all = await recordingService.getAllRecordings({ limit: 100 })
          recordingsData = all.filter(r => r.isPublished && r.status === 'completed' && r.recordingUrl)
        } catch (err) { console.error(err) }
      }
      setRecordings(recordingsData)
      try {
        const upcoming = await sessionService.getTeacherSessionsForStudents({ limit: 20, daysAhead: 30 })
        setUpcomingSessions(upcoming)
      } catch (err) { setUpcomingSessions([]) }
      try {
        const live = await sessionService.getAllSessions({ status: 'live', limit: 20 })
        setLiveSessions(live)
      } catch (err) { setLiveSessions([]) }
      setDebugInfo({
        studentId,
        recordingsCount: recordingsData.length,
        upcomingCount: upcomingSessions.length,
        liveCount: liveSessions.length,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      setError('Failed to load content.')
    } finally {
      setLoading(false)
    }
  }
  const debugRecordings = async () => {
    try {
      const all = await recordingService.getAllRecordings({ limit: 50 })
      console.log('Debug recordings:', all)
      alert(`Found ${all.length} recordings. Check console.`)
    } catch (err) {
      alert('Debug error: ' + err.message)
    }
  }
  // Render cards
  const renderRecordingCard = (rec, i) => {
    const isDrive = !!getDriveFileId(rec.recordingUrl)
    return (
      <motion.div
        key={rec.id}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: i * 0.05 }}
        className="glass rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden card-3d hover-lift"
      >
        <div className="h-48 bg-gradient-to-br from-blue-500 to-cyan-500 relative overflow-hidden">
          {rec.thumbnailUrl ? (
            <img src={rec.thumbnailUrl} alt={rec.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Video className="h-16 w-16 text-white opacity-80" />
            </div>
          )}
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 bg-black bg-opacity-70 text-white rounded-full text-sm font-medium backdrop-blur-sm">
              {formatDuration(rec.duration)}
            </span>
          </div>
          {rec.watched && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                <Check className="h-3 w-3 inline" /> Watched
              </span>
            </div>
          )}
          {isDrive && (
            <div className="absolute top-4 left-4">
              <span className="px-2 py-1 bg-blue-500 text-white rounded-full text-xs font-medium flex items-center">
                <ExternalLink className="h-3 w-3 mr-1" />
                Drive
              </span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-40">
            <button
              onClick={() => watchInDrive(rec)}
              className="p-3 bg-white bg-opacity-20 rounded-full backdrop-blur-sm hover:bg-opacity-30 transition-all"
              title="Watch on Google Drive"
            >
              <PlayCircle className="h-8 w-8 text-white" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2 flex-1">
              {rec.title}
            </h3>
            {rec.isFeatured && <Star className="h-5 w-5 text-yellow-500 fill-current ml-2" />}
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
            {rec.description || 'No description'}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center"><Users className="h-4 w-4 mr-1" />{rec.instructorName}</span>
              <span className="flex items-center"><Eye className="h-4 w-4 mr-1" />{rec.views || 0}</span>
            </div>
            {rec.category && (
              <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-xs rounded-full">
                {rec.category}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(rec.createdAt).toLocaleDateString()}
            </span>
            <div className="flex gap-2">
              <Button onClick={() => watchInDrive(rec)} size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                <PlayCircle className="h-4 w-4 mr-1" /> Watch
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadVideo(rec)} title="Download">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }
  const renderUpcomingSessionCard = (s, i) => (
    <motion.div key={s.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden card-3d hover-lift border-l-4 border-l-orange-500">
      <div className="h-48 bg-gradient-to-br from-orange-400 to-yellow-500 relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-center"><Calendar className="h-16 w-16 text-white opacity-80" /></div>
        <div className="absolute bottom-4 left-4"><span className="px-3 py-1 bg-black bg-opacity-70 text-white rounded-full text-sm font-medium backdrop-blur-sm">{formatDuration(s.duration || 60)}</span></div>
        <div className="absolute top-4 right-4"><span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-medium">Upcoming</span></div>
      </div>
      <div className="p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2">{s.title || s.topic}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{s.description || 'Live session coming soon'}</p>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center"><Users className="h-4 w-4 mr-1" />{s.instructorName}</span>
            <span className="flex items-center"><Clock className="h-4 w-4 mr-1" />{formatDateTime(s.scheduledTime)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">{s.courseName || 'General'}</span>
          <Button size="sm" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600" onClick={() => joinLiveSession(s)}>
            <UserPlus className="h-4 w-4 mr-1" /> Join
          </Button>
        </div>
      </div>
    </motion.div>
  )
  const renderLiveSessionCard = (s, i) => (
    <motion.div key={s.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: i * 0.05 }} className="glass rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden card-3d hover-lift border-l-4 border-l-red-500 animate-pulse">
      <div className="h-48 bg-gradient-to-br from-red-500 to-pink-600 relative overflow-hidden">
        <div className="w-full h-full flex items-center justify-center"><Radio className="h-16 w-16 text-white opacity-80 animate-pulse" /></div>
        <div className="absolute bottom-4 left-4"><span className="px-3 py-1 bg-black bg-opacity-70 text-white rounded-full text-sm font-medium backdrop-blur-sm">Live Now</span></div>
        <div className="absolute top-4 right-4"><span className="px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium animate-pulse"><Zap className="h-3 w-3 inline mr-1" />LIVE</span></div>
      </div>
      <div className="p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-2">{s.title || s.topic}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{s.description || 'Live session in progress'}</p>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center"><Users className="h-4 w-4 mr-1" />{s.instructorName}</span>
            <span className="flex items-center"><Eye className="h-4 w-4 mr-1" />{s.participantCount || 0} joined</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Started {formatDateTime(s.actualStartTime || s.scheduledTime)}</span>
          <Button onClick={() => joinLiveSession(s)} size="sm" className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 animate-pulse">
            <Radio className="h-4 w-4 mr-1" /> Join Live
          </Button>
        </div>
      </div>
    </motion.div>
  )
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
        <span className="ml-3">Loading your recordings...</span>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Video className="h-8 w-8 text-gradient-primary" />
            Learning Content
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Watch recordings on Google Drive, join live sessions
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadAllData} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          <Button onClick={debugRecordings} variant="outline"><AlertCircle className="h-4 w-4 mr-2" />Debug</Button>
        </div>
      </motion.div>
      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Recordings', value: stats.totalRecordings, icon: Video, color: 'blue' },
          { label: 'Completed', value: stats.completedRecordings, percent: stats.completionRate, icon: Check, color: 'green' },
          { label: 'Total Watch Time', value: stats.totalDuration, icon: Clock, color: 'purple' }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="glass rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 card-hover">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                {stat.percent !== undefined && <p className="text-sm text-green-600 dark:text-green-400 mt-1">{stat.percent}% completed</p>}
              </div>
              <div className={`p-3 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: 'recordings', label: 'Recordings', icon: Video, count: recordings.length },
              { key: 'upcoming', label: 'Upcoming', icon: Calendar, count: upcomingSessions.length },
              { key: 'live', label: 'Live', icon: Radio, count: liveSessions.length }
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${activeTab === tab.key ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                <option value="all">All Categories</option>
                <option value="lecture">Lectures</option>
                <option value="tutorial">Tutorials</option>
                <option value="workshop">Workshops</option>
                <option value="qna">Q&A</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                <option value="createdAt">Newest First</option>
                <option value="views">Most Popular</option>
                <option value="duration">Longest</option>
                <option value="title">Title A-Z</option>
                <option value="scheduledTime">Soonest First</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Content Grid */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredContent.map((item, i) => {
              if (item.type === 'recording') return renderRecordingCard(item, i)
              if (item.type === 'upcoming') return renderUpcomingSessionCard(item, i)
              if (item.type === 'live') return renderLiveSessionCard(item, i)
              return null
            })}
          </AnimatePresence>
        </div>
        {filteredContent.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            {activeTab === 'recordings' && <Video className="mx-auto h-16 w-16 text-gray-400 mb-4" />}
            {activeTab === 'upcoming' && <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />}
            {activeTab === 'live' && <Radio className="mx-auto h-16 w-16 text-gray-400 mb-4" />}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No {activeTab} found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || categoryFilter !== 'all' ? 'Try adjusting filters' : `No ${activeTab} available`}
            </p>
            <Button onClick={loadAllData} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
export default StudentRecordings