import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import ClientList from './components/ClientList'
import AssessmentForm from './components/AssessmentForm'
import ReportView from './components/ReportView'
import { AlertTriangle } from 'lucide-react'
import type { Assessment } from './types'
import { supabase } from './lib/supabase'

function App() {
  const [activeView, setActiveView] = useState('clients')
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle direct share links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reportId = params.get('reportId')
    
    if (reportId) {
      const fetchPublicReport = async () => {
        setLoading(true)
        setError(null)
        try {
          const { data, error: dbError } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', reportId)
            .single()
          
          if (dbError) throw dbError;
          
          if (data) {
            setSelectedAssessment(data)
            setActiveView('public-report')
          } else {
            setError('The requested clinical record could not be located.')
          }
        } catch (err: any) {
          console.error('Fetch error:', err)
          setError(err.message || 'Unable to retrieve the clinical analysis.')
        } finally {
          setLoading(false)
        }
      }
      fetchPublicReport()
    }
  }, [])

  const handleAssessmentCreated = (data: Assessment) => {
    setSelectedAssessment(data)
    setActiveView('report')
  }

  const handleSelectClient = (assessment: Assessment) => {
    setSelectedAssessment(assessment)
    setActiveView('report')
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="w-10 h-10 border-4 border-sage border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-smoke font-medium animate-pulse">Retrieving Secure Clinical Console...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red- soft mb-4">
             <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl serif text-charcoal mb-2">Analysis Access Failed</h2>
          <p className="text-smoke text-sm max-w-md">{error}</p>
          <button 
            onClick={() => window.location.href = window.location.origin} 
            className="mt-6 text-sage font-bold text-sm hover:underline"
          >
            ← Return to Dashboard
          </button>
        </div>
      )
    }

    switch (activeView) {
      case 'clients':
        return <ClientList onSelect={handleSelectClient} />
      case 'new-intake':
        return <AssessmentForm onSuccess={handleAssessmentCreated} />
      case 'edit-assessment':
        return <AssessmentForm onSuccess={handleAssessmentCreated} initialData={selectedAssessment || undefined} />
      case 'public-report':
        return selectedAssessment ? (
          <div className="min-h-screen bg-white">
            <ReportView 
              assessment={selectedAssessment} 
              onBack={() => window.location.href = window.location.origin} 
              onEdit={() => setActiveView('edit-assessment')}
            />
          </div>
        ) : <ClientList onSelect={handleSelectClient} />
      case 'report':
        return selectedAssessment ? (
          <ReportView 
            assessment={selectedAssessment} 
            onBack={() => setActiveView('clients')} 
            onEdit={() => setActiveView('edit-assessment')}
          />
        ) : (
          <ClientList onSelect={handleSelectClient} />
        )
      case 'analytics':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 animate-fade border-sage-pale">
            <div className="w-16 h-16 rounded-full bg-sage-pale flex items-center justify-center text-sage">
               <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
               </svg>
            </div>
            <h2 className="text-xl serif text-charcoal">Population Health Analytics</h2>
            <p className="text-smoke text-sm">This module is currently generating data from active records.</p>
          </div>
        )
      default:
        return <ClientList onSelect={handleSelectClient} />
    }
  }

  // If in public view, don't show the dashboard layout
  if (activeView === 'public-report') {
    return renderContent()
  }

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      {renderContent()}
    </Layout>
  )
}

export default App
