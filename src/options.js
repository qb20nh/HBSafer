import("./lib/spark-md5.min.js");
import("./lib/psl.min.js");
import("./lib/uri.all.min.js");

/**
 * Blacklist object data structure:
 * [
 *  {
 *    hostname: '<hostHash>',
 *    hostpart: <hostPartNum>,
 *    pathname: '<pathHash>',
 *    pathpart: <pathPartNum>
 *  },
 *  ...
 * ]
 * but to save storage space, we will save all values into ordered array:
 * [
 *  hostname, hostpart, pathname, pathpart,
 *  hostname, hostpart, pathname, pathpart,
 *  hostname, hostpart, pathname, pathpart,
 *  ...
 * ]
 */

function digestBlacklistURL(url) {
  if (typeof url === "undefined" || url.length < 1) {
    throw new Error("Must be a valid URL or domain");
  }
  var uri = URI.parse(url);
  if (typeof uri.scheme === "undefined" || uri.scheme.length < 1) {
    uri = URI.parse("http://" + url);
  }
  var scheme = uri.scheme;
  var hostname = uri.host;
  var returnValue;
  if (hostname.length > 0) {
    var hostLevel = hostname.split(".").length;
    var pathname = uri.path;
    if (pathname.startsWith("/")) pathname = pathname.slice(1);
    if (pathname.endsWith("/"))
      pathname = pathname.slice(0, pathname.length - 1);
    var pathLevel = pathname.split("/").length;
    var domain = psl.parse(hostname).domain || hostname;
    var hosthash = SparkMD5.hash(hostname);
    var pathhash = SparkMD5.hash(pathname);
    console.log(scheme, hostname, pathname);
    returnValue = `${scheme}:${domain[0]}${domain.length}:${hostLevel}:${hosthash}`;
    if (pathname.length < 1) {
      returnValue += "::";
    } else {
      returnValue += `:${pathLevel}:${pathhash}`;
    }
  } else {
    returnValue = `${scheme}::`;
  }
  return returnValue;
}

function parseBlacklistItem(string) {
  var scheme,
    domainChar,
    domainLength,
    hostLevel,
    hostHash,
    pathLevel,
    pathHash;
  var values = string.slice(0, -2).split(":");
  scheme = values[0];
  if (values.length > 1) {
    domainChar = values[1][0];
    domainLength = values[1].slice(1);
    hostLevel = values[2];
    hostHash = values[3];
    if (values.length > 4) {
      pathLevel = values[4];
      pathHash = values[5];
    }
  }
  return {
    scheme,
    domainChar,
    domainLength,
    hostLevel,
    hostHash,
    pathLevel,
    pathHash,
  };
}

chrome.storage.sync.get("blacklist", (data) => {
  if (!data.blacklist) {
    throw new Error("expected blacklist in storage");
  }
  console.log("blacklist get", data.blacklist);

  const blacklistEl = document.getElementById("blacklist");
  blacklistEl.value = data.blacklist.join("\n");
});

const saveEl = document.getElementById("url");
saveEl.addEventListener("submit", function () {
  const savedNotificationEl = document.getElementById("saved-notification");
  savedNotificationEl.className = "flash";
  savedNotificationEl.offsetWidth;
  savedNotificationEl.className = "";
});
