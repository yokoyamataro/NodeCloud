import { useEffect, useState } from 'react'
import { Plus, Search, Building2, Phone, Mail, MapPin, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import { useCompanyStore } from '@/stores/companyStore'
import type { Company, CompanyType } from '@/types/database'

const SPECIALTY_OPTIONS = [
  '総合建設',
  '測量',
  '掘削',
  '運搬',
  '整地',
  '暗渠',
  '土改',
  'その他',
]

interface CompanyFormData {
  name: string
  company_type: CompanyType
  specialty: string
  phone: string
  email: string
  address: string
}

const initialFormData: CompanyFormData = {
  name: '',
  company_type: 'subcontractor',
  specialty: '',
  phone: '',
  email: '',
  address: '',
}

export function CompaniesPage() {
  const { companies, isLoading, fetchCompanies, createCompany, updateCompany, deleteCompany } = useCompanyStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<CompanyType | 'all'>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData)

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.address?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filterType === 'all' || company.company_type === filterType

    return matchesSearch && matchesType
  })

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company)
      setFormData({
        name: company.name,
        company_type: company.company_type,
        specialty: company.specialty || '',
        phone: company.phone || '',
        email: company.email || '',
        address: company.address || '',
      })
    } else {
      setEditingCompany(null)
      setFormData(initialFormData)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCompany(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async () => {
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, formData)
      } else {
        await createCompany(formData)
      }
      handleCloseDialog()
    } catch (error) {
      console.error('Error saving company:', error)
    }
  }

  const handleDeleteClick = (company: Company) => {
    setDeletingCompany(company)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (deletingCompany) {
      try {
        await deleteCompany(deletingCompany.id)
        setIsDeleteDialogOpen(false)
        setDeletingCompany(null)
      } catch (error) {
        console.error('Error deleting company:', error)
      }
    }
  }

  const primeContractors = filteredCompanies.filter((c) => c.company_type === 'prime_contractor')
  const subcontractors = filteredCompanies.filter((c) => c.company_type === 'subcontractor')

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">業者管理</h1>
          <p className="text-muted-foreground">
            元請・下請業者の情報を管理します
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          業者を追加
        </Button>
      </div>

      {/* フィルター・検索 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="業者名、専門分野、住所で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as CompanyType | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="種別で絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="prime_contractor">元請</SelectItem>
            <SelectItem value="subcontractor">下請</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">総業者数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">元請</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {companies.filter((c) => c.company_type === 'prime_contractor').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">下請</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {companies.filter((c) => c.company_type === 'subcontractor').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 業者一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 元請業者 */}
          {(filterType === 'all' || filterType === 'prime_contractor') && primeContractors.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Badge variant="default">元請</Badge>
                <span>{primeContractors.length}社</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {primeContractors.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    onEdit={() => handleOpenDialog(company)}
                    onDelete={() => handleDeleteClick(company)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 下請業者 */}
          {(filterType === 'all' || filterType === 'subcontractor') && subcontractors.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary">下請</Badge>
                <span>{subcontractors.length}社</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subcontractors.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    onEdit={() => handleOpenDialog(company)}
                    onDelete={() => handleDeleteClick(company)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredCompanies.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">業者が見つかりません</p>
              <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                業者を追加
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 業者追加・編集ダイアログ */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? '業者を編集' : '業者を追加'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">会社名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: 北海道建設株式会社"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_type">種別 *</Label>
                <Select
                  value={formData.company_type}
                  onValueChange={(v) => setFormData({ ...formData, company_type: v as CompanyType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prime_contractor">元請</SelectItem>
                    <SelectItem value="subcontractor">下請</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">専門分野</Label>
                <Select
                  value={formData.specialty}
                  onValueChange={(v) => setFormData({ ...formData, specialty: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTY_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="011-123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@example.co.jp"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">住所</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="北海道札幌市中央区..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              {editingCompany ? '更新' : '追加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>業者を削除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              「{deletingCompany?.name}」を削除してもよろしいですか？
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              この操作は取り消せません。関連するユーザーやプロジェクトの割り当てにも影響する可能性があります。
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

// 業者カードコンポーネント
function CompanyCard({
  company,
  onEdit,
  onDelete,
}: {
  company: Company
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{company.name}</CardTitle>
              {company.specialty && (
                <Badge variant="outline" className="mt-1">
                  {company.specialty}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {company.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>{company.phone}</span>
          </div>
        )}
        {company.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="truncate">{company.email}</span>
          </div>
        )}
        {company.address && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{company.address}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
