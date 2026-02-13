// Trigger: Export Completed
// Polls for recently completed canvas or video exports

const perform = async (z, bundle) => {
  const response = await z.request({
    url: 'https://api.creatorstudio.app/v1/zapier/exports/recent',
    params: {
      limit: bundle.inputData.limit || 10,
      type: bundle.inputData.exportType,
    },
  })

  return response.data
}

module.exports = {
  key: 'export_completed',
  noun: 'Export',
  display: {
    label: 'Export Completed',
    description: 'Triggers when a canvas or video export is completed.',
  },

  operation: {
    type: 'polling',
    perform: perform,

    inputFields: [
      {
        key: 'exportType',
        label: 'Export Type',
        type: 'string',
        choices: ['canvas', 'video', 'all'],
        default: 'all',
        helpText: 'Filter by export type',
      },
      {
        key: 'limit',
        label: 'Limit',
        type: 'integer',
        default: 10,
        helpText: 'Maximum number of exports to retrieve per poll (default: 10)',
      },
    ],

    outputFields: [
      { key: 'id', label: 'Export ID', type: 'string' },
      { key: 'type', label: 'Type', type: 'string' },
      { key: 'format', label: 'Format', type: 'string' },
      { key: 'url', label: 'Download URL', type: 'string' },
      { key: 'completedAt', label: 'Completed At', type: 'datetime' },
      { key: 'metadata', label: 'Metadata', type: 'string' },
    ],

    sample: {
      id: 'export_123',
      type: 'canvas',
      format: 'png',
      url: 'https://storage.creatorstudio.app/exports/123.png',
      completedAt: '2026-02-14T10:00:00Z',
      metadata: '{"width":1920,"height":1080}',
    },
  },
}
