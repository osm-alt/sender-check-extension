chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // listen for messages sent from background.js
  if (request.url.startsWith("https://outlook.live.com/mail/0/inbox/id/")) {
    outlook();
  }
});

function outlook() {
  const observer = createObserver("OZZZK", handle_outlook); //OZZZK is the class of the sender box
  observer.observe(document, {
    childList: true,
    subtree: true,
  });
}

function handle_outlook(sender_box) {
  var children = sender_box.childNodes;
  var sender_name = children[0].textContent;
  var sender_email = children[1].textContent.slice(2, -1);
  var status_badge = document.createElement("div");
  status_badge.className = "bootstrap-badge bootstrap-text-bg-primary";
  status_badge.style.width = "1em";
  status_badge.innerText = "Trusted";
  add_badge = createObserver("AvaBt", (someElement) => {
    someElement.appendChild(status_badge);
  });
  add_badge.observe(document, {
    childList: true,
    subtree: true,
  });
}

//this is done to automatically run code when a specific element appears in the DOM
function createObserver(class_name, func) {
  return new MutationObserver(function (mutations, mutationInstance) {
    const someElement = document.getElementsByClassName(class_name)[0];
    if (someElement) {
      func(someElement);
      mutationInstance.disconnect();
    }
  });
}
