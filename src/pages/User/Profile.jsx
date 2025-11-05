import React from 'react'
import { useTranslation } from 'react-i18next'
import Layout from '../../components/Layout/Layout.jsx'

const Profile = () => {
  const { t } = useTranslation()

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Profile page coming soon...</p>
        </div>
      </div>
    </Layout>
  )
}

export default Profile