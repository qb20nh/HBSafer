import { load } from './common.mjs'

import('./lib/spark-md5.min.js')
import('./lib/uri.all.min.js')

/**
 * Builds blacklist string from parsable url
 * @param {string} url
 * @returns {string} blacklist string
 */
function build (url) {
  if (typeof url === 'undefined' || url.length < 1) {
    throw new Error('Must be a valid URL or domain')
  }
  let uri = URI.parse(url)
  if (typeof uri.scheme === 'undefined' || uri.scheme.length < 1) {
    uri = URI.parse('http://' + url)
  }
  const scheme = uri.scheme
  const hostname = uri.host
  let returnValue = `${scheme}`
  if (hostname.length > 0) {
    let pathname = uri.path
    if (pathname.startsWith('/')) pathname = pathname.slice(1)
    if (pathname.endsWith('/')) { pathname = pathname.slice(0, pathname.length - 1) }
    const hostSalt = getRandomString()
    const hostHash = SparkMD5.hash(hostname + hostSalt)
    const pathSalt = getRandomString()
    const pathHash = SparkMD5.hash(pathname + pathSalt)
    console.log(scheme, hostname, pathname)
    returnValue += `:${hostHash}:${hostSalt}`
    if (pathname.length > 0) {
      returnValue += `:${pathHash}:${pathSalt}`
    }
  }
  return returnValue
}

/**
 * Get 128 bits of randomness
 * @returns {string} hex string of random values
 */
const getRandomString = () => [...crypto.getRandomValues(new Uint8Array(16))].map(n => ('0' + n.toString(16)).substring(-2)).join('')

/**
 * Saves list of blacklist items to browser storage
 * @param {Array<string>} blacklist list of blacklist items
 * @returns Future which completes when browser finishes save operation
 */
const save = (blacklist) => new Promise((resolve, reject) => {
  try {
    resolve(chrome.storage.sync.set({ blacklist }))
  } catch (e) {
    reject(e)
  }
})

/**
 * Adds a url to the list of blacklist items and saves it to browser storage
 * @param {string} rawUrlInput url to add
 */
const add = async (rawUrlInput) => {
  const blacklist = await load()
  blacklist.push(build(rawUrlInput))
  await save(blacklist)
}

// Display for blacklist items
const blacklistEl = document.getElementById('blacklist')
// Load from browser storage into display element when page loads
load().then((blacklist) => {
  console.log('blacklist get', blacklist)
  blacklist.forEach((item, index) => {
    const blackListItem = document.createElement('option')
    blackListItem.setAttribute('value', index)
    blackListItem.innerText = item
    blacklistEl.append(blackListItem)
  })
})

// A url input field
const saveEl = document.getElementById('url')
// Handle submit event for the form encompassing the input field
saveEl.closest('form').addEventListener('submit', function (e) {
  e.preventDefault()
  add(saveEl.value)
  const savedNotificationEl = document.getElementById('saved-notification')
  savedNotificationEl.className = 'flash'
  savedNotificationEl.className = ''
})
