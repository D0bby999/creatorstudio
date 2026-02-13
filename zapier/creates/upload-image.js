// Action: Upload Image
// Uploads an image to Creator Studio (stub implementation)

const perform = async (z, bundle) => {
  // Stub implementation - returns placeholder URL
  // In production, this would upload to cloud storage
  const response = await z.request({
    method: 'POST',
    url: 'https://api.creatorstudio.app/v1/images',
    body: {
      url: bundle.inputData.imageUrl,
      name: bundle.inputData.name || 'zapier-upload',
    },
  })

  return response.data
}

module.exports = {
  key: 'upload_image',
  noun: 'Image',
  display: {
    label: 'Upload Image',
    description: 'Uploads an image to Creator Studio storage.',
  },

  operation: {
    perform: perform,

    inputFields: [
      {
        key: 'imageUrl',
        label: 'Image URL',
        type: 'string',
        required: true,
        helpText: 'URL of the image to upload',
      },
      {
        key: 'name',
        label: 'File Name',
        type: 'string',
        required: false,
        helpText: 'Optional name for the uploaded file',
      },
    ],

    outputFields: [
      { key: 'id', label: 'Image ID', type: 'string' },
      { key: 'url', label: 'Public URL', type: 'string' },
      { key: 'name', label: 'File Name', type: 'string' },
      { key: 'uploadedAt', label: 'Uploaded At', type: 'datetime' },
    ],

    sample: {
      id: 'img_123',
      url: 'https://storage.creatorstudio.app/images/123.jpg',
      name: 'zapier-upload',
      uploadedAt: '2026-02-14T10:00:00Z',
    },
  },
}
