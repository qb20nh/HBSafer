import { loadBlacklist, parseBlacklistString, hash } from './common.mjs'

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
  loadBlacklist().then((blacklist) => {
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
  const visitedUri = URI.parse(urlString)

  // Prevent extension's own url from getting logged into browser history
  // Note: `extension` scheme is for viewable pages, while `chrome-extension` is for background pages
  if (visitedUri.scheme === 'extension' && visitedUri.host === chrome.runtime.id) return true

  /**
   * Check if visited url's scheme matches the blacklist item's scheme
   * @param {{scheme: string}} blacklist
   * @param {{scheme: string}} visitedUri
   * @returns {boolean}
   */
  const schemeMatch = ({ scheme }, { scheme: visitedScheme }) => {
    return scheme === visitedScheme
    || (scheme === 'http' && visitedScheme === 'https')
    || (scheme === 'https' && visitedScheme === 'http')
  }

  /**
   * Check if visited url's host matches the blacklist item's host
   * @param {{hostHash: string, hostSalt: string}} hostInfo
   * @param {{host: string}} visitedUri
   * @returns {boolean}
   */
  const hostMatch = ({ hostHash, hostSalt }, { host }) => {
    const hostnameNormalized = host.replace(/^\.+|\.+$/g, '');
    const parts = hostnameNormalized.split('.')
    for (let i = parts.length - 1; i >= 0; i--) {
      const subpart = parts.slice(i).join('.')
      const [subpartHash] = hash(subpart, hostSalt)
      if (subpartHash === hostHash) return true
    }
    return false
  }

  /**
   * Check if visited url's path matches the blacklist item's path
   * @param {{pathHash: string, pathSalt: string}} pathInfo
   * @param {{path: string}} visitedUri
   * @returns {boolean}
   */
  const pathMatch = ({ pathHash, pathSalt }, { path }) => {
    const pathNormalized = path.replace(/^\/+|\/+$/g, '');
    const parts = pathNormalized.split('/')
    for (let i = 0; i < parts.length; i++) {
      const subpart = parts.slice(0, i).join('/')
      const [subpartHash] = hash(subpart, pathSalt)
      if (subpartHash === pathHash) return true
    }
    return false
  }

  return (await loadBlacklist()).some((line) => {
    const blacklist = parseBlacklistString(line)
    return schemeMatch(blacklist, visitedUri) && hostMatch(blacklist, visitedUri) && (!blacklist.pathHash && pathMatch(blacklist, visitedUri))
  })
}
