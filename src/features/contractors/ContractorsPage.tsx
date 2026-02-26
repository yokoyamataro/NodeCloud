import { useEffect, useState } from 'react'
import { Plus, Building2, Phone, Mail, MapPin, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { useCompanyStore } from '@/stores/companyStore'
import { useProjectStore, useSelectedProjectStore } from '@/stores/projectStore'
import type { CompanyRole, ProjectCompanyWithDetails } from '@/types/database'

// 役割の日本語名
const ROLE_LABELS: Record<CompanyRole, string> = {
  prime_contractor: '元請',
  sub_surveying: '測量',
  sub_excavation: '掘削',
  sub_transport: '運搬',
  sub_grading: '整地',
}

export function ContractorsPage() {
  const { projects, fetchProjects } = useProjectStore()
  const { selectedProjectId, _hasHydrated } = useSelectedProjectStore()
  const {
    companies,
    projectCompanies,
    isLoading,
    fetchCompanies,
    fetchProjectCompanies,
    addProjectCompany,
    removeProjectCompany,
    updateProjectCompanyRole,
  } = useCompanyStore()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<CompanyRole>('sub_excavation')
  const [deletingContractor, setDeletingContractor] = useState<ProjectCompanyWithDetails | null>(null)

  useEffect(() => {
    fetchProjects()
    fetchCompanies()
  }, [fetchProjects, fetchCompanies])

  useEffect(() => {
    if (_hasHydrated && selectedProjectId) {
      fetchProjectCompanies(selectedProjectId)
    }
  }, [_hasHydrated, selectedProjectId, fetchProjectCompanies])

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  // 既に追加されていない業者のみ選択可能
  const availableCompanies = companies.filter(
    (c) =>
      c.company_type === 'subcontractor' &&
      !projectCompanies.some((pc) => pc.company_id === c.id)
  )

  const handleAddContractor = async () => {
    if (!selectedProjectId || !selectedCompanyId) return
    try {
      await addProjectCompany(selectedProjectId, selectedCompanyId, selectedRole)
      setIsAddDialogOpen(false)
      setSelectedCompanyId('')
      setSelectedRole('sub_excavation')
    } catch (error) {
      console.error('Failed to add contractor:', error)
    }
  }

  const handleRemoveContractor = async () => {
    if (!deletingContractor) return
    try {
      await removeProjectCompany(deletingContractor.id)
      setDeletingContractor(null)
    } catch (error) {
      console.error('Failed to remove contractor:', error)
    }
  }

  const handleRoleChange = async (projectCompanyId: string, newRole: CompanyRole) => {
    try {
      await updateProjectCompanyRole(projectCompanyId, newRole)
    } catch (error) {
      console.error('Failed to update role:', error)
    }
  }

  // 工事が選択されていない場合
  if (!selectedProjectId || !selectedProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">協力業者</h1>
          <p className="text-muted-foreground">工事に参加する協力業者を管理します</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">工事を選択してください</p>
          <p className="text-sm text-muted-foreground mt-2">
            ヘッダーから工事を選択すると、その工事の協力業者が表示されます
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">協力業者</h1>
          <p className="text-muted-foreground">
            {selectedProject.fiscal_year && `${selectedProject.fiscal_year}年度 `}
            {selectedProject.name} の協力業者
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} disabled={availableCompanies.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          協力業者を追加
        </Button>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">協力業者数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {projectCompanies.length}社
            </div>
          </CardContent>
        </Card>
        {(['sub_surveying', 'sub_excavation', 'sub_transport', 'sub_grading'] as CompanyRole[]).map((role) => {
          const count = projectCompanies.filter((pc) => pc.role === role).length
          if (count === 0) return null
          return (
            <Card key={role}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {ROLE_LABELS[role]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}社</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 協力業者一覧 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : projectCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed">
          <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">協力業者が登録されていません</p>
          <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            協力業者を追加
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectCompanies.map((pc) => (
            <Card key={pc.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{pc.company.name}</CardTitle>
                      {pc.company.specialty && (
                        <Badge variant="outline" className="mt-1">
                          {pc.company.specialty}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeletingContractor(pc)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* 役割選択 */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">担当</Label>
                  <Select
                    value={pc.role}
                    onValueChange={(v) => handleRoleChange(pc.id, v as CompanyRole)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS)
                        .filter(([key]) => key !== 'prime_contractor')
                        .map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 連絡先 */}
                <div className="space-y-1 text-sm text-muted-foreground">
                  {pc.company.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{pc.company.phone}</span>
                    </div>
                  )}
                  {pc.company.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{pc.company.email}</span>
                    </div>
                  )}
                  {pc.company.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{pc.company.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 協力業者追加ダイアログ */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>協力業者を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>業者</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="業者を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {availableCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                      {company.specialty && ` (${company.specialty})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableCompanies.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  追加可能な業者がありません。業者マスタから新しい業者を登録してください。
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>担当</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as CompanyRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS)
                    .filter(([key]) => key !== 'prime_contractor')
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddContractor} disabled={!selectedCompanyId}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deletingContractor} onOpenChange={() => setDeletingContractor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>協力業者を削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingContractor?.company.name}」をこの工事の協力業者から削除しますか？
              <br />
              業者マスタからは削除されません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveContractor}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
