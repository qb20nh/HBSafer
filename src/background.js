import { load, parse, hash } from './common.mjs'

import './lib/spark-md5.min.js'
import './lib/uri.all.min.js'

chrome.runtime.onInstalled.addListener(handleRuntimeInstalled)
chrome.history.onVisited.addListener(handleHistoryVisited)

/**
 * Handler for extension installed event. Save initial data structure for future use.
 * @param {*} details Installation details
 */
function handleRuntimeInstalled (details) {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      blacklist: []
    })
  }
}

/**
 * Handler for browser page visit event. Compare and remove the history entry.
 * @param {*} historyItem History entry of just visited page
 */
function handleHistoryVisited (historyItem) {
  load().then((blacklist) => {
    if (isBlacklisted(blacklist, historyItem.url)) {
      purgeUrl(historyItem.url)
    }
  })
}

/**
 * Removes specific history entry/entries from browser by url string
 * @param {string} url
 */
function purgeUrl (url) {
  chrome.history.deleteUrl({ url })
}

/**
 * Compare currently visited page's url to the list of preset blacklist items and check if at least one matches
 * @param {string} blacklistString Blacklist items ex. facebook.com reddit.com/r/funny www.youtube.com
 * @param {string} urlString  ex. https://www.facebook.com http://reddit.com/
 * 1. Separate blacklist item into domain and path parts
 * 2. parse current url for domain and path
 * 3. compare both url and path and exclude only if both match
 */
async function isBlacklisted (blacklistString, urlString) {
  /**
   *
   * @param {{hostHash: string, hostSalt: string}} hostInfo
   * @param {string} urlString
   * @returns {boolean}
   */
  const hostMatch = ({ hostHash, hostSalt }, urlString) => {
    const { hostname } = URI.parse(urlString)
    const hostnameSanitized = hostname.replaceAll('.', ' ').trim().replaceAll(' ', '.') // cheese
    const parts = hostnameSanitized.split('.')
    for (let i = parts.length - 1; i >= 0; i--) {
      const subpart = parts.slice(i).join('.')
      const [subpartHash] = hash(subpart, hostSalt)
      if (subpartHash === hostHash) return true
    }
    return false
  }
  const pathMatch = ({ hostHash, hostSalt }, urlString) => {

  }

  return (await load()).some((line) => {
    const blacklist = parse(line)
    return hostMatch(blacklist, urlString) && (!blacklist.pathHash && pathMatch(blacklist, urlString))
  })
}
