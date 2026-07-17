import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

export default function ModuleCard({

    title,

    icon: Icon,

    onClick,

}) {

    return (

        <Card
            onClick={onClick}
            className="cursor-pointer transition hover:border-brand-500 hover:-translate-y-1"
        >

            <CardContent className="flex items-center justify-between py-6">

                <div className="flex items-center gap-4">

                    <div className="rounded-lg bg-brand-500/10 p-3">

                        <Icon className="h-6 w-6 text-brand-500" />

                    </div>

                    <h3 className="font-semibold">

                        {title}

                    </h3>

                </div>

                <ChevronRight className="h-5 w-5 text-surface-500" />

            </CardContent>

        </Card>

    )

}