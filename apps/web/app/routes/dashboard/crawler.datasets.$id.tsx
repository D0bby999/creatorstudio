import { useLoaderData } from 'react-router'
import type { CrawlDataset, DatasetItem } from '@creator-studio/crawler/types/crawler-types'
import { DatasetDetailPanel } from '@creator-studio/crawler/components/dashboard/dataset-detail-panel'
import type { Route } from './+types/crawler.datasets.$id'

export async function loader({ params }: Route.LoaderArgs) {
  const datasetId = params.id

  // TODO: Fetch dataset and items from DatasetManager
  const dataset: CrawlDataset = {
    id: datasetId,
    name: 'Dataset ' + datasetId,
    itemCount: 0,
    totalBytes: 0,
    userId: 'user-1',
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const items: DatasetItem[] = []

  return {
    dataset,
    items,
    currentPage: 1,
    totalPages: 1
  }
}

export default function CrawlerDatasetDetail() {
  const { dataset, items, currentPage, totalPages } = useLoaderData<typeof loader>()

  const handleExport = (format: 'json' | 'csv' | 'xml') => {
    // TODO: Trigger dataset export
    console.log(`Export dataset as ${format}`)
  }

  const handleCompare = (otherDatasetId: string) => {
    // TODO: Compare datasets
    console.log(`Compare with dataset ${otherDatasetId}`)
  }

  return (
    <div>
      <DatasetDetailPanel
        dataset={dataset}
        items={items}
        currentPage={currentPage}
        totalPages={totalPages}
        onExport={handleExport}
        onCompare={handleCompare}
      />
    </div>
  )
}
