/**
 * Load a blacklist items from the browser storage.
 * @returns {Promise<List<String>>} Future which resolves into a desired data
 */
export const load = () => new Promise((res, rej) => {
  chrome.storage.sync.get('blacklist', (data) => {
    if (!data.blacklist) {
      rej('expected blacklist in storage')
    }
    res(data.blacklist)
  })
})

/**
 * Parses a blacklist string into an object for ease of use
 * @param {*} blacklistString A blacklist string to parse
 * @returns Object of named parts
 */
export const parse = (blacklistString) => {
  let scheme,
    hostHash,
    hostSalt,
    pathHash,
    pathSalt
  const values = blacklistString.split(':')
  scheme = values[0]
  if (values.length > 1) {
    hostHash = values[1]
    hostSalt = values[2]
    if (values.length > 3) {
      pathHash = values[3]
      pathSalt = values[4]
    }
  }
  return {
    scheme,
    hostHash,
    hostSalt,
    pathHash,
    pathSalt
  }
}
