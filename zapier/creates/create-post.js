// Action: Create Social Post
// Creates a new social media post via Creator Studio API

const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'POST',
    url: 'https://api.creatorstudio.app/v1/posts',
    body: {
      content: bundle.inputData.content,
      mediaUrls: bundle.inputData.mediaUrls ? bundle.inputData.mediaUrls.split(',').map(u => u.trim()) : [],
      socialAccountId: bundle.inputData.socialAccountId,
      scheduledAt: bundle.inputData.scheduledAt || null,
    },
  })

  return response.data
}

module.exports = {
  key: 'create_post',
  noun: 'Post',
  display: {
    label: 'Create Social Post',
    description: 'Creates a new social media post in Creator Studio.',
  },

  operation: {
    perform: perform,

    inputFields: [
      {
        key: 'socialAccountId',
        label: 'Social Account',
        type: 'string',
        required: true,
        dynamic: 'social_accounts.id.username',
        helpText: 'Select the social media account to post to',
      },
      {
        key: 'content',
        label: 'Content',
        type: 'text',
        required: true,
        helpText: 'The text content of your post',
      },
      {
        key: 'mediaUrls',
        label: 'Media URLs',
        type: 'string',
        required: false,
        helpText: 'Comma-separated list of publicly accessible image/video URLs',
      },
      {
        key: 'scheduledAt',
        label: 'Schedule For',
        type: 'datetime',
        required: false,
        helpText: 'Leave empty to publish immediately',
      },
    ],

    outputFields: [
      { key: 'id', label: 'Post ID', type: 'string' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'content', label: 'Content', type: 'text' },
      { key: 'scheduledAt', label: 'Scheduled At', type: 'datetime' },
      { key: 'createdAt', label: 'Created At', type: 'datetime' },
    ],

    sample: {
      id: 'post_123',
      status: 'scheduled',
      content: 'Sample post content',
      scheduledAt: '2026-02-14T12:00:00Z',
      createdAt: '2026-02-14T10:00:00Z',
    },
  },
}
