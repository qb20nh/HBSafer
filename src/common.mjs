/**
 * Load a blacklist items from the browser storage.
 * @returns {Promise<List<String>>} Future which resolves into a desired data
 */
export const load = () => new Promise((resolve, reject) => {
  chrome.storage.sync.get('blacklist', (data) => {
    if (!data.blacklist) {
      reject(Error('expected blacklist in storage'))
    }
    resolve(data.blacklist)
  })
})

/**
 * Parses a blacklist string into an object for ease of use
 * @param {string} blacklistString A blacklist string to parse
 * @returns Object of named parts
 */
export const parse = (blacklistString) => {
  const [scheme,
    hostHash,
    hostSalt,
    pathHash,
    pathSalt] = blacklistString.split(':')

  return {
    scheme,
    hostHash,
    hostSalt,
    pathHash,
    pathSalt
  }
}

/**
 * Get 128 bits of randomness
 * @returns {string} hex string of random values
 */
const getRandomString = () => [...crypto.getRandomValues(new Uint8Array(16))].map(n => ('0' + n.toString(16)).substring(-2)).join('')

/**
 * generate random salt and then compute hash from given value and salt
 * @param {string} value
 * @returns {[string, string]} array of hash and salt
 */
export const hash = (value, salt = getRandomString()) => {
  const hashValue = SparkMD5.hash(value + salt)
  return [hashValue, salt]
}
