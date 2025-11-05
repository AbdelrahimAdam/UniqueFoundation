import React from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Layout from '../../components/Layout/Layout.jsx'

const RecordingDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams()

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Recording Details</h1>
        <p className="mt-2 text-gray-600">Recording ID: {id}</p>
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Recording detail page coming soon...</p>
        </div>
      </div>
    </Layout>
  )
}

export default RecordingDetail