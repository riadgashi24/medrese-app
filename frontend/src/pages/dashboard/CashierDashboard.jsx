import { Wallet } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/context/AuthContext'

export function CashierDashboard() {
  const { user } = useAuth()
  return (
    <div>
      <PageHeader
        title="Paneli"
        description={`Mirë se u ktheve, ${user?.name || 'Arkatar'}`}
      />
      <Card className="max-w-xl">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base font-body font-medium"><Wallet className="h-5 w-5 text-surface-400" /> Moduli i financave</CardTitle></CardHeader>
        <CardContent className="text-sm text-surface-400">Ky modul është çaktivizuar për momentin dhe do të aktivizohet vetëm pas aprovimit nga drejtoria.</CardContent>
      </Card>
    </div>
  )
}
