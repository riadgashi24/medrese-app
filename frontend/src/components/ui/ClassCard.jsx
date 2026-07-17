import { Users, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export function ClassCard({
    classItem,
    onClick,
}) {
    return (
        <Card
            onClick={onClick}
            className="
                cursor-pointer
                transition-all
                duration-200
                hover:border-brand-500
                hover:shadow-lg
                hover:-translate-y-1
            "
        >
            <CardContent className="space-y-5">

                <div className="flex items-start justify-between">

                    <div>

                        <h3 className="text-2xl font-bold">
                            {classItem.name}
                        </h3>

                        <p className="text-sm text-surface-400">
                            Kujdestar
                        </p>

                        <p className="font-medium">
                            {classItem.guardian}
                        </p>

                    </div>

                    <Badge variant="blue">
                        Klasa
                    </Badge>

                </div>

                <div className="flex items-center justify-between rounded-lg border border-surface-700 p-3">

                    <div className="flex items-center gap-2">

                        <Users className="h-5 w-5 text-brand-500" />

                        <span className="text-sm text-surface-400">
                            Nxënës
                        </span>

                    </div>

                    <span className="text-xl font-bold">
                        {classItem.students}
                    </span>

                </div>

                <div className="flex items-center justify-end border-t pt-4">

                    <div className="flex items-center gap-2 text-brand-500">

                        <span className="text-sm font-medium">
                            Hape klasën
                        </span>

                        <ChevronRight className="h-4 w-4" />

                    </div>

                </div>

            </CardContent>
        </Card>
    )
}