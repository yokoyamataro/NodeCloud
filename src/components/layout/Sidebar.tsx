import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  Map,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  Building2,
  Users,
  Wheat,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const mainNavItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'ダッシュボード' },
  { to: '/projects', icon: FolderKanban, label: '工事一覧' },
  { to: '/fields', icon: Wheat, label: '圃場一覧' },
  { to: '/map', icon: Map, label: '地図' },
  { to: '/calendar', icon: Calendar, label: 'カレンダー' },
  { to: '/chat', icon: MessageSquare, label: 'チャット' },
  { to: '/reports', icon: FileText, label: '日報' },
]

const adminNavItems: NavItem[] = [
  { to: '/companies', icon: Building2, label: '業者管理' },
  { to: '/users', icon: Users, label: 'ユーザー管理' },
  { to: '/settings', icon: Settings, label: '設定' },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow pt-5 bg-white border-r overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">農土施工管理</h1>
              <p className="text-xs text-muted-foreground">北海道農業土木</p>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 mt-6 px-3">
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Separator className="my-4" />

          <div className="mb-2">
            <h2 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              管理
            </h2>
          </div>
          <nav className="space-y-1">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        <div className="flex-shrink-0 p-4 border-t">
          <div className="text-xs text-muted-foreground">
            Version 0.0.1
          </div>
        </div>
      </div>
    </aside>
  )
}
