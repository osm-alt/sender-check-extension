const choose_list_owner = (key) => {
  if (key) {
    chrome.storage.local.set({ sc_list_owner: key });
  } else {
    chrome.storage.local.get(["sc_email"]).then((result) => {
      chrome.storage.local.set({
        sc_list_owner: result.sc_email,
      });
    });
  }
};

document.addEventListener("DOMContentLoaded", function () {
  requestAccessibleLists();
  let sign_out_button = document.querySelector("#sign_out");

  sign_out_button.addEventListener("click", sign_out);

  let first_button = document.querySelector("#first-button");

  chrome.storage.local.get(["sc_email"]).then((result) => {
    let sc_email;
    sc_email = result.sc_email;
    chrome.storage.local.get(["sc_list_owner"]).then((result) => {
      let list_owner;
      list_owner = result.sc_list_owner;
      first_button.className =
        "list-group-item list-group-item-action " +
        (list_owner === sc_email ? "active" : "");
      first_button.addEventListener("click", () => {
        choose_list_owner(null);
      });
    });
  });
});

function requestAccessibleLists() {
  chrome.storage.local.get(["sc_acc_token"]).then((result) => {
    var myHeaders = new Headers();

    myHeaders.append("Authorization", "Bearer " + result.sc_acc_token);
    var requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };

    fetch("http://localhost:4000/accessible_lists", requestOptions)
      .then((response) => {
        if (response.status === 404) {
          console.clear();
          return null;
        } else if (response.status === 403) {
          requestNewToken(requestAccessibleLists);
        } else {
          return response.json();
        }
      })
      .then((result) => {
        if (result) {
          addToList(result);
        }
      })
      .catch((error) => console.log("error", error));
  });
}
const requestNewToken = async (callback) => {
  var myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  chrome.storage.local.get(["sc_ref_token"]).then(async (result) => {
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
          chrome.storage.local.set({ sc_acc_token: result.sc_acc_token });
          callback();
        }
      })
      .catch((error) => console.log("error", error));
  });
};

function addToList(listOwners) {
  chrome.storage.local.get(["sc_list_owner"]).then((result) => {
    let list_owner;

    list_owner = result.sc_list_owner;
    let list_elements = document.querySelector("#list-elements");

    if (listOwners) {
      listOwners.map((e) => {
        let button = document.createElement("button");
        button.className =
          "list-group-item list-group-item-action " +
          (list_owner === e ? "active" : "");
        button.type = "button";
        button.ariaCurrent = "true";
        button.setAttribute("data-bs-toggle", "list");
        button.key = e;
        button.id = e;
        button.addEventListener("click", (e) => {
          choose_list_owner(e.currentTarget.id);
        });

        let div = document.createElement("div");
        div.className = "ms-2 me-auto";
        div.addEventListener("click", (e) => {
          choose_list_owner(e.target.parentNode.id);
        });
        div.innerText = e + "'s list";

        button.appendChild(div);

        list_elements.appendChild(button);
      });
    }
  });
}

function sign_out() {
  chrome.storage.local.get(["sc_ref_token"]).then((result) => {
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      refresh_token: result.sc_ref_token,
    });

    var requestOptions = {
      method: "DELETE",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch("http://localhost:4000/logout", requestOptions)
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));

    chrome.storage.local.clear();

    window.location.replace("./login.html");
  });
}
