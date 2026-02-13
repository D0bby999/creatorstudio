// Authentication configuration for Creator Studio Zapier integration
// Uses API key authentication with Bearer token

module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      required: true,
      type: 'string',
      helpText: 'Find your API key in Creator Studio settings at https://creatorstudio.app/settings/api',
    },
  ],
  test: {
    url: 'https://api.creatorstudio.app/v1/auth/verify',
    headers: {
      Authorization: 'Bearer {{bundle.authData.apiKey}}',
    },
  },
  connectionLabel: '{{bundle.authData.apiKey}}',
}
