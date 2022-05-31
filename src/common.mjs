export const load = () => new Promise((res, rej) => {
  chrome.storage.sync.get('blacklist', (data) => {
    if (!data.blacklist) {
      rej('expected blacklist in storage')
    }
    res(data.blacklist)
  })
})

export function parse (blacklistString) {
  let scheme,
    hostLevel,
    hostHash,
    hostSalt,
    pathLevel,
    pathHash,
    pathSalt
  const values = blacklistString.split(':')
  scheme = values[0]
  if (values.length > 1) {
    hostLevel = values[1]
    hostHash = values[2]
    hostSalt = values[3]
    if (values.length > 4) {
      pathLevel = values[4]
      pathHash = values[5]
      pathSalt = values[6]
    }
  }
  return {
    scheme,
    hostLevel,
    hostHash,
    hostSalt,
    pathLevel,
    pathHash,
    pathSalt
  }
}
