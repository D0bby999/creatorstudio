import { Outlet } from 'react-router'
import { CrawlerLayout } from '@creator-studio/crawler/components/dashboard/crawler-layout'

export default function Crawler() {
  return (
    <CrawlerLayout>
      <Outlet />
    </CrawlerLayout>
  )
}
