import { useLoaderData } from 'react-router'
import type { CrawlDataset } from '@creator-studio/crawler/types/crawler-types'
import { DatasetListPanel } from '@creator-studio/crawler/components/dashboard/dataset-list-panel'
import type { Route } from './+types/crawler.datasets'

export async function loader({ request }: Route.LoaderArgs) {
  // TODO: Fetch datasets from DatasetManager
  const datasets: CrawlDataset[] = []

  return { datasets }
}

export default function CrawlerDatasets() {
  const { datasets } = useLoaderData<typeof loader>()

  const handleExport = (datasetId: string, format: 'json' | 'csv' | 'xml') => {
    // TODO: Trigger dataset export
    console.log(`Export dataset ${datasetId} as ${format}`)
  }

  return (
    <div>
      <DatasetListPanel datasets={datasets} onExport={handleExport} />
    </div>
  )
}
