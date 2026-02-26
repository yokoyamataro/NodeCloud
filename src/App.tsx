import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { PrivateRoute } from '@/features/auth/PrivateRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ProjectListPage } from '@/features/projects/ProjectListPage'
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage'
import { MapPage } from '@/features/map/MapPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { ChatPage } from '@/features/chat/ChatPage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { CompaniesPage } from '@/features/companies/CompaniesPage'
import { UsersPage } from '@/features/users/UsersPage'
import { FieldListPage } from '@/features/fields/FieldListPage'
import { FieldDetailPage } from '@/features/fields/FieldDetailPage'
import { ContractorsPage } from '@/features/contractors/ContractorsPage'
import { useAuthStore } from '@/stores/authStore'

function App() {
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* 認証ページ */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* 保護されたルート */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="fields" element={<FieldListPage />} />
        <Route path="fields/:fieldId" element={<FieldDetailPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="contractors" element={<ContractorsPage />} />

        {/* 管理ページ */}
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<PlaceholderPage title="設定" />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// プレースホルダーページ
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-muted-foreground">この機能は開発中です</p>
      </div>
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Coming Soon...</p>
      </div>
    </div>
  )
}

export default App
