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
    return `${scheme}:${domain[0]}${domain.length}:${hostLevel}:${hosthash}:${pathLevel}:${pathhash}`.toLowerCase();
  } else {
    return `${scheme}::`;
  }
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
