import { useState } from 'react'
import type { CrawlerEngineConfig, ExtractionConfig } from '../../types/crawler-types'
import { CrawlConfigStepUrl } from './crawl-config-step-url'
import { CrawlConfigStepExtract } from './crawl-config-step-extract'
import { CrawlConfigStepStealth } from './crawl-config-step-stealth'
import { CrawlConfigStepLimits } from './crawl-config-step-limits'

interface CrawlConfigWizardProps {
  onSubmit: (config: Partial<CrawlerEngineConfig> & { url: string; extractionConfig?: ExtractionConfig }) => void
  onCancel: () => void
}

export function CrawlConfigWizard({ onSubmit, onCancel }: CrawlConfigWizardProps) {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<{
    url: string
    type: 'url' | 'seo' | 'depth' | 'sitemap'
    maxDepth: number
    sameDomainOnly: boolean
    extractionConfig?: ExtractionConfig
    stealth?: boolean
    requestDelay?: { min: number; max: number }
    proxy?: string
    maxPages?: number
    maxDurationMinutes?: number
    maxMegabytes?: number
    priority: 'urgent' | 'high' | 'normal' | 'low'
  }>({
    url: '',
    type: 'url',
    maxDepth: 1,
    sameDomainOnly: true,
    priority: 'normal'
  })

  const steps = ['URL', 'Extractors', 'Stealth', 'Limits']

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = () => {
    const engineConfig: Partial<CrawlerEngineConfig> & { url: string; extractionConfig?: ExtractionConfig } = {
      url: config.url,
      maxDepth: config.maxDepth,
      sameDomainOnly: config.sameDomainOnly,
      extractionConfig: config.extractionConfig,
      stealth: config.stealth,
      maxConcurrency: 3,
      minConcurrency: 1,
      requestTimeoutMs: 30000,
      rateLimitPerDomain: config.requestDelay?.min || 1000,
      queueStrategy: 'bfs'
    }

    onSubmit(engineConfig)
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {steps.map((label, idx) => (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step === idx + 1
                    ? 'bg-blue-600 text-white'
                    : step > idx + 1
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-700'
                }`}
              >
                {idx + 1}
              </div>
              <div className="mt-1 text-xs font-medium text-gray-600">{label}</div>
            </div>
            {idx < steps.length - 1 && (
              <div className={`h-1 flex-1 ${step > idx + 1 ? 'bg-green-600' : 'bg-gray-300'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        {step === 1 && <CrawlConfigStepUrl config={config} onChange={setConfig} />}
        {step === 2 && <CrawlConfigStepExtract config={config} onChange={setConfig} />}
        {step === 3 && <CrawlConfigStepStealth config={config} onChange={setConfig} />}
        {step === 4 && <CrawlConfigStepLimits config={config} onChange={setConfig} />}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <div className="flex gap-2">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && !config.url}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
