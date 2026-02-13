// Trigger: New Post Created
// Polls for recently created social media posts

const perform = async (z, bundle) => {
  const response = await z.request({
    url: 'https://api.creatorstudio.app/v1/zapier/posts/recent',
    params: {
      limit: bundle.inputData.limit || 10,
    },
  })

  return response.data
}

module.exports = {
  key: 'post_created',
  noun: 'Post',
  display: {
    label: 'New Post Created',
    description: 'Triggers when a new social media post is created or published.',
  },

  operation: {
    type: 'polling',
    perform: perform,

    inputFields: [
      {
        key: 'limit',
        label: 'Limit',
        type: 'integer',
        default: 10,
        helpText: 'Maximum number of posts to retrieve per poll (default: 10)',
      },
    ],

    outputFields: [
      { key: 'id', label: 'Post ID', type: 'string' },
      { key: 'content', label: 'Content', type: 'text' },
      { key: 'platform', label: 'Platform', type: 'string' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'publishedAt', label: 'Published At', type: 'datetime' },
      { key: 'platformPostId', label: 'Platform Post ID', type: 'string' },
      { key: 'mediaUrls', label: 'Media URLs', type: 'string', list: true },
    ],

    sample: {
      id: 'post_123',
      content: 'Sample post content',
      platform: 'instagram',
      status: 'published',
      publishedAt: '2026-02-14T10:00:00Z',
      platformPostId: '123456789',
      mediaUrls: ['https://example.com/image.jpg'],
    },
  },
}
