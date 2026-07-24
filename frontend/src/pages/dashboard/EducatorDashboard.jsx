import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bed, Sun, Gavel, Sparkles, Loader2, ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export function EducatorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dormOverview, setDormOverview] = useState(null)
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [dormRes, inspRes] = await Promise.all([
          api.dormitory.overview().catch(() => null),
          api.dormitory.inspections({ per_page: 5 }).catch(() => null),
        ])
        setDormOverview(dormRes?.data ?? null)
        setInspections(inspRes?.data ?? [])
      } catch (err) {
        console.error('Failed to load educator dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const totalBoarding = dormOverview?.total_occupied ?? 0
  const totalCapacity = dormOverview?.total_capacity ?? 0
  const occupancyRate = dormOverview?.occupancy_rate ?? 0
  const totalRooms = dormOverview?.rooms?.length ?? 0

  const roomsByFloor = dormOverview?.by_floor ?? []
  const blockA = roomsByFloor.find(f => f.floor === 2)
  const blockB = roomsByFloor.find(f => f.floor === 3)

  return (
    <div>
      <PageHeader
        title="Paneli i Edukatorit"
        description={`${user?.name || 'Edukator'} — Mbikëqyrës i Konviktit`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Nxënës Konviktorë"
          value={loading ? '...' : totalBoarding}
          hint={blockA && blockB ? `Kati 2: ${blockA.rooms.reduce((s, r) => s + r.occupied, 0)} / Kati 3: ${blockB.rooms.reduce((s, r) => s + r.occupied, 0)}` : `Kapaciteti: ${totalCapacity}`}
          icon={Bed}
        />
        <StatCard
          label="Dhomat"
          value={loading ? '...' : totalRooms}
          hint={`Zënia: ${occupancyRate}%`}
          icon={Sun}
          trend={occupancyRate > 80 ? 'up' : 'down'}
        />
        <StatCard
          label="Inspektime"
          value={loading ? '...' : inspections.length}
          hint="Kontrollet e fundit"
          icon={Gavel}
        />
        <StatCard
          label="Kati 2 — Dhomat"
          value={blockA ? blockA.rooms.length : '...'}
          hint="201-220"
          icon={Sparkles}
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-body font-medium">Kontrollet e Fundit të Dhomave</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dormitory/inspections')}>
              Shiko të gjitha
            </Button>
          </CardHeader>
          <CardContent className="space-y-0">
            {loading ? (
              <div className="py-8 flex items-center justify-center text-surface-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Duke ngarkuar...
              </div>
            ) : inspections.length > 0 ? (
              inspections.slice(0, 5).map((room) => (
                <div key={room.id} className="flex justify-between py-2.5 border-b border-white/5 text-sm">
                  <div>
                    <span className="text-surface-300">
                      {room.dorm_room?.dorm_block || 'Blloku'} — {room.dorm_room?.code || room.dorm_room?.name || 'Dhoma'}
                    </span>
                    <p className="text-[10px] text-surface-500">{room.inspection_date || ''}</p>
                  </div>
                  <Badge variant={(room.score ?? 0) >= 8 ? 'success' : (room.score ?? 0) >= 6 ? 'warning' : 'danger'}>
                    {room.score ?? '-'}/10
                  </Badge>
                </div>
              ))
            ) : (
              <div className="py-8 flex items-center justify-center text-surface-500 text-sm">
                Nuk ka kontrolle të regjistruara.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-body font-medium">Veprime të Shpejta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="secondary" className="w-full justify-between" onClick={() => navigate('/dormitory/inspections')}>
              <span>Kryej Kontroll të Ri</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => navigate('/dormitory/rooms')}>
              <span>Menaxho Dhomat</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => navigate('/discipline/record')}>
              <span>Regjistro Vërejtje</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => navigate('/dormitory/leaderboard')}>
              <span>Rënditja e Dhomave</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
