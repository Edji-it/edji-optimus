// library imports
import { google } from 'googleapis'

// local imports

export const getGoogleInfo = async function(access_token: string) {
  const people = google.people({
    version: 'v1',
  })
  const { data } = await people.people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses,names,photos,metadata',
    oauth_token: access_token,
  })
  const { names, photos, emailAddresses, metadata } = data
  // get user's id
  const { id } = metadata.sources.find(source => source.type === 'PROFILE')
  // find display name
  const { displayName: fullname } = names.find(name => name.metadata.primary)
  // find photo, if exists
  const { url: avatar } = photos.find(photo => photo.metadata.primary)
  // find email address
  const { value: email } = emailAddresses.find(email => email.metadata.primary)
  return { email, fullname, avatar, id }
}
