import('./lib/spark-md5.min.js')
import('./lib/uri.all.min.js')

import { load, parse } from './common.mjs'

chrome.runtime.onInstalled.addListener(handleRuntimeInstalled)
chrome.history.onVisited.addListener(handleHistoryVisited)

function handleRuntimeInstalled (details) {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      blacklist: []
    })
  }
}

function handleHistoryVisited (historyItem) {
  load().then((blacklist) => {
    if (isBlacklisted(blacklist, historyItem.url)) {
      purgeUrl(historyItem.url)
    }
  })
}

function purgeUrl (url) {
  chrome.history.deleteUrl({ url })
}

/**
 *
 * @param {*} blacklist facebook.com reddit.com/r/funny www.youtube.com
 * @param {*} url https://www.facebook.com http://reddit.com/
 * 1. Separate blacklist item into domain and path parts
 * 2. parse current url for domain and path
 * 3. compare both url and path and exclude only if both match
 */
function isBlacklisted (blacklist, url) {
  return [
    'r8:2:1fd7de7da0fce4963f775a5fdb894db5:2:7ae7acb3afe3353f4e61b4746e02ddf6',
    'f9:3:660328a7f9004d462085aa67a82065db:1:d41d8cd98f00b204e9800998ecf8427e'
  ].some((line) => {
    console.log('Hash of BL url:', SparkMD5.hash(line))
    console.log('Hash of visited:', SparkMD5.hash(url))
    return url.toLowerCase().includes(line.toLowerCase())
  })
}
