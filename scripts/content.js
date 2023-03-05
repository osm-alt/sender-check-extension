chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // listen for messages sent from background.js
  if (
    request.url.startsWith("https://outlook.live.com/mail/0/inbox/id/") ||
    request.url.startsWith("https://outlook.office365.com/mail/inbox/id/")
  ) {
    outlook();
  } else if (
    request.url.startsWith("https://mail.google.com/mail/u/0/#inbox/")
  ) {
    gmail();
  }
});

function outlook() {
  const observer = createObserver("OZZZK", handle_outlook); //OZZZK is the class of the sender box
  observer.observe(document, {
    childList: true,
    subtree: true,
  });
}

function gmail() {
  let sender_box = document.getElementsByClassName("qu")[0];
  var children = sender_box.childNodes;
  var sender_name = children[0].firstChild.textContent;
  var sender_email = children[2].childNodes;
  sender_email = sender_email[1].textContent;

  checkSender(sender_name, sender_email, "gmail");
}

function handle_outlook(sender_box) {
  var children = sender_box.childNodes;
  var sender_name = children[0].textContent;
  var sender_email = children[1].textContent.slice(2, -1);
  checkSender(sender_name, sender_email, "outlook");
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

function checkSender(sender_name, sender_email, platform) {
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
            requestNewToken(checkSender, sender_name, sender_email, platform);
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
              showBadge(result.message, platform);
            }
          }
        })
        .catch((error) => console.log("error", error));
    });
  });
}

//show badge as a result of response from backend concerning the sender
function showBadge(message, platform) {
  var status_badge = document.createElement("div");
  status_badge.className = "bootstrap-badge bootstrap-mt-2 ";
  if (message == "Trusted") {
    status_badge.innerText = "SenderCheck Status: Trusted";
    status_badge.className += "bootstrap-text-bg-success";
  } else if (message == "Untrusted") {
    status_badge.innerText = "SenderCheck Status: Untrusted";
    status_badge.className += "bootstrap-text-bg-danger";
  } else if (message == "Found sender with that name but not same email") {
    status_badge.innerText =
      "SenderCheck Status: Found sender with that name but not same email";
    status_badge.className += "bootstrap-text-bg-danger";
  } else if (message == "Unknown") {
    status_badge.innerText = "SenderCheck Status: Unknown";
    status_badge.className += "bootstrap-text-bg-secondary";
  }

  if (platform == "outlook") {
    add_badge = createObserver("AvaBt", (someElement) => {
      someElement.appendChild(status_badge);
    });
    add_badge.observe(document, {
      childList: true,
      subtree: true,
    });
  } else if (platform == "gmail") {
    let sender_box = document.getElementsByClassName("cf gJ")[0];
    let row = document.createElement("tr");
    let cell = document.createElement("td");
    cell.appendChild(status_badge);
    row.appendChild(cell);
    sender_box.firstChild.appendChild(row);
  }
}

const requestNewToken = async (
  callback,
  sender_name,
  sender_email,
  platform
) => {
  chrome.storage.local.get(["sc_ref_token"]).then(async (result) => {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    let refresh_token;

    refresh_token = result.sc_ref_token;
    var raw = JSON.stringify({
      refresh_token: refresh_token,
    });

    var requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    await fetch("http://localhost:4000/token", requestOptions)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          return null;
        }
      })
      .then((result) => {
        if (result) {
          chrome.storage.local.set({ sc_acc_token: result.access_token });
          callback(sender_name, sender_email, platform);
        }
      })
      .catch((error) => console.log("error", error));
  });
};
