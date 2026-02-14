import { useEffect, useState } from 'react'
import { Plus, Search, User as UserIcon, Phone, Building2, MoreHorizontal, Pencil, Trash2, ShieldCheck, UserX, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUserStore, type UserWithCompany } from '@/stores/userStore'
import { useCompanyStore } from '@/stores/companyStore'
import type { UserRole } from '@/types/database'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理者',
  manager: '責任者',
  member: 'メンバー',
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800',
  manager: 'bg-blue-100 text-blue-800',
  member: 'bg-gray-100 text-gray-800',
}

interface UserFormData {
  company_id: string
  email: string
  name: string
  role: UserRole
  phone: string
  is_active: boolean
}

const initialFormData: UserFormData = {
  company_id: '',
  email: '',
  name: '',
  role: 'member',
  phone: '',
  is_active: true,
}

export function UsersPage() {
  const { users, isLoading, fetchUsers, createUser, updateUser, deleteUser, toggleUserActive } = useUserStore()
  const { companies, fetchCompanies } = useCompanyStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithCompany | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserWithCompany | null>(null)
  const [formData, setFormData] = useState<UserFormData>(initialFormData)

  useEffect(() => {
    fetchUsers()
    fetchCompanies()
  }, [fetchUsers, fetchCompanies])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company?.name?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  const handleOpenDialog = (user?: UserWithCompany) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        company_id: user.company_id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || '',
        is_active: user.is_active,
      })
    } else {
      setEditingUser(null)
      setFormData(initialFormData)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData)
      } else {
        await createUser({
          ...formData,
          avatar_url: null,
          auth_id: null,
        })
      }
      handleCloseDialog()
    } catch (error) {
      console.error('Error saving user:', error)
    }
  }

  const handleDeleteClick = (user: UserWithCompany) => {
    setDeletingUser(user)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deletingUser) {
      try {
        await deleteUser(deletingUser.id)
        setIsDeleteDialogOpen(false)
        setDeletingUser(null)
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
          <p className="text-muted-foreground">
            システムユーザーの情報と権限を管理します
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          ユーザーを追加
        </Button>
      </div>

      {/* フィルター・検索 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="名前、メール、会社名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterRole} onValueChange={(v) => setFilterRole(v as UserRole | 'all')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="権限" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="admin">管理者</SelectItem>
            <SelectItem value="manager">責任者</SelectItem>
            <SelectItem value="member">メンバー</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'active' | 'inactive')}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状態" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="active">有効</SelectItem>
            <SelectItem value="inactive">無効</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">総ユーザー数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">管理者</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {users.filter((u) => u.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">有効</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users.filter((u) => u.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">無効</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {users.filter((u) => !u.is_active).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ユーザー一覧テーブル */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
          <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">ユーザーが見つかりません</p>
          <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            ユーザーを追加
          </Button>
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ユーザー</TableHead>
                <TableHead>所属会社</TableHead>
                <TableHead>権限</TableHead>
                <TableHead>連絡先</TableHead>
                <TableHead>状態</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{user.company?.name || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={ROLE_COLORS[user.role]}>
                      {user.role === 'admin' && <ShieldCheck className="mr-1 h-3 w-3" />}
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.phone && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {user.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? '有効' : '無効'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          編集
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleUserActive(user.id)}>
                          {user.is_active ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              無効にする
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              有効にする
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ユーザー追加・編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'ユーザーを編集' : 'ユーザーを追加'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">氏名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: 田中 太郎"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="tanaka@example.co.jp"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_id">所属会社 *</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(v) => setFormData({ ...formData, company_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">権限 *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData({ ...formData, role: v as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理者</SelectItem>
                    <SelectItem value="manager">責任者</SelectItem>
                    <SelectItem value="member">メンバー</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="090-1234-5678"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.email || !formData.company_id}
            >
              {editingUser ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>ユーザーを削除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              「{deletingUser?.name}」を削除してもよろしいですか？
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              この操作は取り消せません。ユーザーの投稿したメッセージや日報は残りますが、削除されたユーザーとして表示されます。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
