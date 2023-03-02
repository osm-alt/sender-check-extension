function sendCredentials(event) {
  event.preventDefault();

  let form = document.querySelector("form");
  let errorMessage = document.querySelector("#errorMessage");

  //make a JS object from the form inputs to send them as JSON later
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);

  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  const button = document.querySelector("button");

  button.disabled = true;

  var raw = JSON.stringify(data);

  var requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  fetch("http://localhost:4000/users/login", requestOptions)
    .then((response) => {
      button.disabled = false;

      return response.json();
    })
    .then((result) => {
      if (result.details) {
        errorMessage.textContent = result.details[0].message
          .replace(/"user_email"/, "Email address")
          .replace(/"password"/, "Password");
      } else if (result.message) {
        errorMessage.textContent = result.message;
      } else if (
        result.access_token &&
        result.refresh_token &&
        result.user_name
      ) {
        chrome.storage.local.set({ sc_user: result.user_name });
        chrome.storage.local.set({ sc_email: result.user_email });
        chrome.storage.local.set({ sc_list_owner: result.user_email }); //user requests their own lists by default
        chrome.storage.local.set({ sc_acc_token: result.access_token });
        chrome.storage.local.set({ sc_ref_token: result.refresh_token });
        chrome.storage.local.set({ sc_authenticated: true });

        chrome.storage.local.get(["sc_user"]).then((result) => {
          console.log("Value currently is " + result.sc_user);
        });
        chrome.storage.local.get(["sc_email"]).then((result) => {
          console.log("Value currently is " + result.sc_email);
        });
        chrome.storage.local.get(["sc_list_owner"]).then((result) => {
          console.log("Value currently is " + result.sc_list_owner);
        }); //user requests their own lists by default
        chrome.storage.local.get(["sc_acc_token"]).then((result) => {
          console.log("Value currently is " + result.sc_acc_token);
        });
        chrome.storage.local.get(["sc_ref_token"]).then((result) => {
          console.log("Value currently is " + result.sc_ref_token);
        });
        chrome.storage.local.get(["sc_authenticated"]).then((result) => {
          console.log("Value currently is " + result.sc_authenticated);
        });

        window.location.replace("./lists.html");
      }
    })
    .catch((error) => console.log("error", error));
}

document.addEventListener("DOMContentLoaded", function () {
  var form = document.querySelector("form");

  form.addEventListener("submit", (e) => {
    sendCredentials(e);
  });
});
