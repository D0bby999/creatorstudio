// Main Zapier app definition for Creator Studio
// Exports triggers and actions for the integration

const authentication = require('./authentication')
const postCreatedTrigger = require('./triggers/post-created')
const exportCompletedTrigger = require('./triggers/export-completed')
const createPostAction = require('./creates/create-post')
const uploadImageAction = require('./creates/upload-image')

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication: authentication,

  beforeRequest: [
    (request, z, bundle) => {
      // Add auth header to all requests
      if (bundle.authData.apiKey) {
        request.headers.Authorization = `Bearer ${bundle.authData.apiKey}`
      }
      return request
    },
  ],

  triggers: {
    [postCreatedTrigger.key]: postCreatedTrigger,
    [exportCompletedTrigger.key]: exportCompletedTrigger,
  },

  creates: {
    [createPostAction.key]: createPostAction,
    [uploadImageAction.key]: uploadImageAction,
  },
}
