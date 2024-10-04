import { loadBlacklist, hash, cache } from './common.mjs'

import './lib/spark-md5.min.js'
import './lib/uri.all.min.js'
import './lib/psl.min.js'

/**
 * Builds blacklist string from parsable url
 * @param {string} url
 * @returns {string} blacklist string
 */
function buildBlacklistString (url) {
  if ((url?.length ?? 0) === 0) {
    throw new Error('Must be a valid URL or domain')
  }
  let uri = URI.parse(url)
  if ((uri.scheme?.length ?? 0) === 0) {
    uri = URI.parse('https://' + url)
  }
  const scheme = uri.scheme
  const hostname = uri.host
  let parts = [scheme]
  if (hostname.length > 0) {
    let pathname = uri.path
    if (pathname.startsWith('/')) pathname = pathname.slice(1)
    if (pathname.endsWith('/')) { pathname = pathname.slice(0, pathname.length - 1) }

    const [hostHash, hostSalt] = hash(hostname)
    const [pathHash, pathSalt] = hash(pathname)

    parts.push(hostHash, hostSalt)
    if (pathname.length > 0) {
      parts.push(pathHash, pathSalt)
    }
  }
  return parts.join(':')
}

/**
 * Saves list of blacklist items to browser storage
 * @param {Array<string>} blacklist list of blacklist items
 * @returns Future which completes when browser finishes save operation
 */
const saveBlacklist = (blacklist) => new Promise((resolve, reject) => {
  try {
    const result = chrome.storage.sync.set({ blacklist })
    cache.expire()
    resolve(result)
  } catch (e) {
    reject(e)
  }
})

/**
 * Adds a url to the list of blacklist items and saves it to browser storage
 * @param {string} rawUrlInput url to add
 */
const addUrlToBlackList = async (rawUrlInput) => {
  const blacklist = await loadBlacklist()
  blacklist.push(buildBlacklistString(rawUrlInput))
  await saveBlacklist(blacklist)
}

const renderBlacklistItems = async (blacklistElement) => {
  const blacklist = await loadBlacklist()
  blacklistElement.replaceChildren()
  blacklist.forEach((item, index) => {
    const blackListItem = document.createElement('option')
    blackListItem.value = item
    const [scheme, hostHash, hostSalt, pathHash, pathSalt] = item.split(':')
    const parts = [scheme]
    if (hostHash) {
      parts.push(hostHash.slice(0, 7), hostSalt.slice(0, 7))
    }
    if (pathHash) {
      parts.push(pathHash.slice(0, 7), pathSalt.slice(0, 7))
    }
    if (parts.length === 1) {
      parts.push('')
    }
    const textValue = parts.join(':')
    blackListItem.append(document.createTextNode(textValue))
    blacklistElement.append(blackListItem)
  })
}

const waitForNextFrame = async () => new Promise((resolve) => requestAnimationFrame(resolve))

document.addEventListener('DOMContentLoaded', (_) => {
  // Display for blacklist items
  const blacklistElement = document.getElementById('blacklist')
  // Deselect all items when unfocused
  blacklistElement.addEventListener('blur', (_) => {
    blacklistElement.selectedIndex = -1
  })
  // Load from browser storage into display element when page loads
  renderBlacklistItems(blacklistElement)

  // A url input field
  const saveEl = document.getElementById('url')
  const savedNotificationEl = document.getElementById('saved-notification')
  // Handle submit event for the form encompassing the input field
  const form = saveEl.closest('form')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    await addUrlToBlackList(saveEl.value)
    form.reset()
    renderBlacklistItems(blacklistElement)
    savedNotificationEl.className = 'flash'
    await waitForNextFrame()
    savedNotificationEl.className = ''
  })

  // Remove button
  const removeEl = document.getElementById('remove')
  // Remove selected items
  removeEl.addEventListener('click', async (_) => {
    const itemsToRemove = [...blacklistElement.selectedOptions].map((option) => option.value)
    const items = await loadBlacklist()
    await saveBlacklist(items.filter((item) => !itemsToRemove.includes(item)))
    renderBlacklistItems(blacklistElement)
  })
})
