import { Sparkles, Image, Video, Share2, Globe } from 'lucide-react'

const features = [
  { icon: Image, label: 'Canvas Editor' },
  { icon: Video, label: 'Video Editor' },
  { icon: Share2, label: 'Social Management' },
  { icon: Globe, label: 'Web Crawler' },
  { icon: Sparkles, label: 'AI Creative Tools' },
]

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div>
          <h1 className="text-3xl font-bold">Creator Studio</h1>
          <p className="mt-2 text-primary-foreground/80">
            All-in-one creative toolkit for content creators
          </p>
        </div>

        <div className="space-y-4">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-lg font-medium">{label}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-primary-foreground/60">
          Design, edit, publish, and analyze — all in one place.
        </p>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        {children}
      </div>
    </div>
  )
}
