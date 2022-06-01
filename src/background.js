import { load, parse } from './common.mjs'

import('./lib/spark-md5.min.js')
import('./lib/uri.all.min.js')

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
 * @param {*} blacklist Blacklist items ex. facebook.com reddit.com/r/funny www.youtube.com
 * @param {*} url  ex. https://www.facebook.com http://reddit.com/
 * 1. Separate blacklist item into domain and path parts
 * 2. parse current url for domain and path
 * 3. compare both url and path and exclude only if both match
 */
function isBlacklisted (blacklist, url) {
  return [ // TODO: replace this with correct data, use load function from common.mjs
    'r8:2:1fd7de7da0fce4963f775a5fdb894db5:2:7ae7acb3afe3353f4e61b4746e02ddf6',
    'f9:3:660328a7f9004d462085aa67a82065db:1:d41d8cd98f00b204e9800998ecf8427e'
  ].some((line) => {
    console.log('Hash of BL url:', SparkMD5.hash(line))
    console.log('Hash of visited:', SparkMD5.hash(url))
    return url.toLowerCase().includes(line.toLowerCase())
  })
}
