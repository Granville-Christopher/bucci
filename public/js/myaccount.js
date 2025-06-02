const sideLinks2 = document.getElementById("sidebar-menu");
const sideToggle = document.getElementById("sidebar-toggle");

if (sideToggle) {
  // Toggle sidebar when clicking the toggle button
  sideToggle.addEventListener("click", function (event) {
    sideLinks2.classList.toggle("active");
    event.stopPropagation();
  });

  // Close sidebar when clicking outside of it
  document.addEventListener("click", function (event) {
    if (
      !sideLinks2.contains(event.target) &&
      !sideToggle.contains(event.target)
    ) {
      sideLinks2.classList.remove("active");
    }
  });
}

// Close sidebar when clicking any menu item
document.querySelectorAll(".sidebar-menu li").forEach((item) => {
  item.addEventListener("click", function () {
    sideLinks2.classList.remove("active");
  });
});

// Show selected section
function showSection(sectionId, event) {
  // Remove active class from all sections
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  // Show the selected section
  document.getElementById(sectionId).classList.add("active");

  // Remove active class from all menu items
  document.querySelectorAll(".sidebar-menu li").forEach((item) => {
    item.classList.remove("active");
  });

  // Add active class to the clicked menu item
  event.currentTarget.classList.add("active");
}

// profile
document.addEventListener("DOMContentLoaded", function () {
  const editBtn = document.getElementById("edit-btn");
  const saveBtn = document.getElementById("save-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const editForm = document.getElementById("edit-form");

  const emailText = document.getElementById("email-text");
  const phoneText = document.getElementById("phone-text");

  const emailInput = document.getElementById("email-input");
  const phoneInput = document.getElementById("phone-input");

  if (editBtn) {
    // Toggle Edit Form
    editBtn.addEventListener("click", function () {
      editForm.style.display =
        editForm.style.display === "block" ? "none" : "block";
    });
  }

  if (saveBtn) {
    // Save Changes
    saveBtn.addEventListener("click", function () {
      emailText.innerText = emailInput.value;
      phoneText.innerText = phoneInput.value;
      editForm.style.display = "none"; // Hide form after saving
    });
  }

  if (cancelBtn) {
    // Cancel Editing
    cancelBtn.addEventListener("click", function () {
      editForm.style.display = "none"; // Hide form
    });
  }
});

// delivery address
function toggleEditForm(formId) {
  document.getElementById(formId).classList.toggle("active");
}

document.addEventListener("DOMContentLoaded", function () {
  const recentlyViewedContainer = document.getElementById(
    "recently-viewed-items"
  );

  if (recentlyViewedContainer) {
    function displayRecentlyViewed() {
      let viewedItems =
        JSON.parse(localStorage.getItem("recentlyViewed")) || [];
      recentlyViewedContainer.innerHTML = "";

      if (viewedItems.length === 0) {
        recentlyViewedContainer.innerHTML =
          "<p class='text-muted'>No recently viewed items.</p>";
        return;
      }

      viewedItems.forEach((item) => {
        const itemHTML = `
          <div class="col-6 col-md-3"> 
            <div class="product-item text-center">
              <a href="${item.link}">
                <img src="${item.image}" class="img-fluid" alt="${item.name}">
              </a>
              <a href="${item.link}" style="text-decoration:none; color: black;">
                <h6 class="mt-2">${item.name}</h6>
              </a>
              <p class="text-muted">${item.price}</p>
              <h4 class=""><a href="${item.link}">${item.view}</a></h4>
            </div>
          </div>
        `;
        recentlyViewedContainer.innerHTML += itemHTML;
      });
    }

    // Display on page load
    displayRecentlyViewed();
  }
});

// Auto-fetch messages every 1 second
setInterval(fetchUserMessages, 1000);

async function fetchUserMessages() {
  try {
    const res = await fetch("/user-send-messages", {
      method: "GET",
      credentials: "include",
    });

    const data = await res.json();
    const chatMessages = document.querySelector(".chat-messages");

    if (chatMessages) {
      const isAtBottom =
        chatMessages.scrollHeight - chatMessages.scrollTop <=
        chatMessages.clientHeight + 50;

      chatMessages.innerHTML = data.messages
        .map((msg) => {
          const isAdmin = msg.toUserId !== undefined;
          return `
            <div class="message ${
              isAdmin ? "admin-message" : "user-message"
            } mb-2">
              <div class="p-2 rounded ${
                isAdmin ? "bg-primary text-white" : "bg-light"
              }"
                style="max-width: 75%; float: ${isAdmin ? "left" : "right"};">
                ${msg.text}
              </div>
              <div style="clear: both;"></div>
            </div>
          `;
        })
        .join("");

      if (isAtBottom) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      const jumpBtn = document.getElementById("jump-to-latest-user");
      if (jumpBtn) {
        if (!isAtBottom) {
          jumpBtn.classList.remove("d-none");
        } else {
          jumpBtn.classList.add("d-none");
        }
      }
    }
  } catch (err) {
    console.error("Error fetching messages:", err);
  }
}

function scrollToLatestUser() {
  const chatMessages = document.querySelector(".chat-messages");
  chatMessages.scrollTop = chatMessages.scrollHeight;

  const jumpBtn = document.getElementById("jump-to-latest-user");
  if (jumpBtn) jumpBtn.classList.add("d-none");
}

let myaccountmessage = document.getElementById("myaccountmessage");
if (myaccountmessage) {
  myaccountmessage.addEventListener("submit", function (event) {
    event.preventDefault();
    submitUserMessage(event);
  });
}
async function submitUserMessage(event) {
  event.preventDefault();
  const message = document.getElementById("userMessageInput").value.trim();
  const user = document.getElementById("userId").value;
  if (!user) {
    showAlertMessage("please log in");
    return;
  }
  if (!message) {
    showAlertMessage("Please type a message before sending.", "warning");
    return;
  }

  try {
    const res = await fetch("/submit-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ text: message }),
    });

    if (res.ok) {
      document.getElementById("userMessageInput").value = "";
      showAlertMessage("Message sent successfully ✅", "success");
      event.preventDefault();
    } else {
      const errorMessage = await res.text();
      showAlertMessage(errorMessage || "Failed to send message", "danger");
    }
  } catch (err) {
    console.error("Error sending message:", err);
    showAlertMessage("Server error occurred", "danger");
  }
}

function showAlertMessage(message, type = "info") {
  const alertBox = document.querySelector(".alert-message-container");
  alertBox.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  // Clear the alert after 4 seconds
  setTimeout(() => {
    alertBox.innerHTML = "";
  }, 4000);
}

function showAlertMessage(message, type = "info") {
  const alertBox = document.querySelector(".alert-message-container");
  alertBox.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  setTimeout(() => {
    alertBox.innerHTML = "";
  }, 4000); // Clears the message after 4 seconds
}
