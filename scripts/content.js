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
  checkSender(sender_name, sender_email);
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

function checkSender(sender_name, sender_email) {
  chrome.storage.local.get(["sc_list_owner"]).then((result1) => {
    chrome.storage.local.get(["sc_acc_token"]).then((result) => {
      var myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + result.sc_acc_token);

      var requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      fetch(
        "http://localhost:4000/check_sender?sender_name=" +
          sender_name +
          "&sender_email=" +
          sender_email +
          "&list_owner=" +
          result1.sc_list_owner,
        requestOptions
      )
        .then((response) => {
          if (response.status === 500) {
            console.clear();
            return null;
          } else if (response.status === 403) {
            requestNewToken(getPermittedUsers, [setPermittedUsers]);
          } else if (response.ok) {
            return response.json();
          } else if (response.status === 404) {
            return { message: "Unknown" };
          }
          return null;
        })
        .then((result) => {
          if (result) {
            if (result.message) {
              showBadge(result.message);
            }
          }
        })
        .catch((error) => console.log("error", error));
    });
  });
}

//show badge as a result of response from backend concerning the sender
function showBadge(message) {
  var status_badge = document.createElement("div");
  status_badge.className = "bootstrap-badge bootstrap-mt-2 ";
  if (message == "Trusted") {
    status_badge.innerText = "SenderCheck Status: Trusted";
    status_badge.className += "bootstrap-text-bg-success";
  } else if (message == "Untrusted") {
    status_badge.innerText = "SenderCheck Status: Untrusted";
    status_badge.className += "bootstrap-text-bg-danger";
  } else if (message == "Unknown") {
    status_badge.innerText = "SenderCheck Status: Unknown";
    status_badge.className += "bootstrap-text-bg-secondary";
  }

  add_badge = createObserver("AvaBt", (someElement) => {
    someElement.appendChild(status_badge);
  });
  add_badge.observe(document, {
    childList: true,
    subtree: true,
  });
}
