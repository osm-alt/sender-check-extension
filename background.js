chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  // read changeInfo data and do something with it
  // like send the new url to contentscripts.js
  if (changeInfo.url) {
    chrome.storage.local.get(["sc_authenticated"]).then((result) => {
      if (result.sc_authenticated === true) {
        chrome.tabs.sendMessage(tabId, {
          message: "hello!",
          url: changeInfo.url,
        });
      }
    });
  }
});
