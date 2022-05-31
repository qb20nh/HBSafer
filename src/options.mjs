import * as SparkMD5 from './lib/spark-md5.min.js'
import * as URI from './lib/uri.all.min.js'

import { load } from './common.mjs'

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
    const hostLevel = hostname.split('.').length
    let pathname = uri.path
    if (pathname.startsWith('/')) pathname = pathname.slice(1)
    if (pathname.endsWith('/')) { pathname = pathname.slice(0, pathname.length - 1) }
    const pathLevel = pathname.split('/').length
    const hostSalt = getRandomString()
    const hostHash = SparkMD5.hash(hostname + hostSalt)
    const pathSalt = getRandomString()
    const pathHash = SparkMD5.hash(pathname + pathSalt)
    console.log(scheme, hostname, pathname)
    returnValue += `:${hostLevel}:${hostHash}:${hostSalt}`
    if (pathname.length > 0) {
      returnValue += `:${pathLevel}:${pathHash}:${pathSalt}`
    }
  }
  return returnValue
}

const getRandomString = () => [...crypto.getRandomValues(new Uint8Array(16))].map(n => ('0' + n.toString(16)).substr(-2)).join('')

const save = (blacklist) => new Promise((res, rej) => {
  try {
    res(chrome.storage.sync.set({ blacklist }))
  } catch (e) {
    rej(e)
  }
})

const add = async (rawUrlInput) => {
  const blacklist = await load()
  blacklist.push(build(rawUrlInput))
  await save(blacklist)
}

const blacklistEl = document.getElementById('blacklist')
load().then((blacklist) => {
  console.log('blacklist get', blacklist)
  blacklist.forEach((item, index) => {
    const blackListItem = document.createElement('option')
    blackListItem.setAttribute('value', index)
    blackListItem.innerText = item
    blacklistEl.append(blackListItem)
  })
})

const saveEl = document.getElementById('url')
saveEl.closest('form').addEventListener('submit', function (e) {
  e.preventDefault()
  add(saveEl.value)
  const savedNotificationEl = document.getElementById('saved-notification')
  savedNotificationEl.className = 'flash'
  savedNotificationEl.offsetWidth
  savedNotificationEl.className = ''
})
