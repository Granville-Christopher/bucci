console.log("✅ DOM fully loaded!");

function showSection(sectionId, event) {
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });
  document.getElementById(sectionId).classList.add("active");

  document.querySelectorAll(".sidebar-menu li").forEach((item) => {
    item.classList.remove("active");
  });
  event.target.closest("li").classList.add("active");
}

function toggleSidebar() {
  const sidebar = document.getElementById("adminSidebar");
  const backdrop = document.getElementById("sidebarBackdrop");

  if (!sidebar || !backdrop) {
    console.warn("Sidebar or backdrop not found in DOM.");
    return;
  }

  sidebar.classList.toggle("show");
  backdrop.classList.toggle("show");
}

document.getElementById("sidebarBackdrop")?.addEventListener("click", () => {
  document.getElementById("adminSidebar").classList.remove("show");
  document.getElementById("sidebarBackdrop").classList.remove("show");
});

document.querySelectorAll(".sidebar-menu li").forEach((item) => {
  item.addEventListener("click", () => {
    document.getElementById("adminSidebar").classList.remove("show");
    document.getElementById("sidebarBackdrop").classList.remove("show");
  });
});
// Fetch total income data from the backend
function updateTotalIncome(incomeData) {
  let selectedMonth = document.getElementById("month-filter");
  if (selectedMonth) {
    selectedMonth = selectedMonth.value;

    // Ensure that the incomeData exists and has the expected properties
    if (!incomeData || typeof incomeData !== "object") {
      console.error("Invalid income data:", incomeData);
      return;
    }

    // Use the selected month or default to 0 if the month is not found
    let totalIncome =
      selectedMonth === "all"
        ? Object.values(incomeData).reduce((a, b) => a + b, 0)
        : incomeData[selectedMonth] || 0; // Default to 0 if no income for the month

    // Update the total income display
    document.getElementById(
      "total-income"
    ).innerText = `₦${totalIncome.toLocaleString()}`;
  }
}

function fetchTotalIncomeData() {
  fetch("/admin/total-income")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Fetched income data:", data);
      if (!data || typeof data !== "object") {
        console.error("Invalid income data:", data);
        return;
      }
      updateTotalIncome(data);
      updateIncomeChart(data);
    })
    .catch((error) => {
      console.error("Error fetching total income data:", error);
    });
}

let chartInstance = null; // Track the current chart instance

function updateIncomeChart(incomeData) {
  const canvas = document.getElementById("income-chart");

  if (canvas) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Destroy the previous chart if it exists
      if (chartInstance) {
        chartInstance.destroy();
      }

      // Create a new chart
      chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ], // Month labels
          datasets: [
            {
              label: "Total Income (₦)",
              data: [
                incomeData.jan || 0,
                incomeData.feb || 0,
                incomeData.mar || 0,
                incomeData.apr || 0,
                incomeData.may || 0,
                incomeData.jun || 0,
                incomeData.jul || 0,
                incomeData.aug || 0,
                incomeData.sep || 0,
                incomeData.oct || 0,
                incomeData.nov || 0,
                incomeData.dec || 0,
              ],
              borderColor: "#007bff",
              borderWidth: 2,
              fill: false,
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true },
          },
        },
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  fetchTotalIncomeData();

  const monthFilter = document.getElementById("month-filter");
  if (monthFilter) {
    monthFilter.addEventListener("change", () => {
      fetchTotalIncomeData();
    });
  } else {
    console.error("Element with id 'month-filter' not found.");
  }
});

// chat section
// chat

// function showChatList() {
//   document.querySelector(".chat-sidebar").style.display = "block";
//   document.querySelector(".chat-main").style.display = "none";
// }
function showChatList() {
  const chatSidebar = document.querySelector(".chat-sidebar");
  const chatMain = document.querySelector(".chat-main");

  // Only proceed if both elements exist to prevent errors
  if (chatSidebar && chatMain) {
    chatSidebar.style.display = "block"; // Make the chat sidebar visible
    chatMain.style.display = "none";    // Hide the main chat window
  } else {
    // Log a warning if elements aren't found, which can happen if HTML IDs/classes are wrong
    console.warn("Chat sidebar or main chat element not found for showChatList. Check your HTML.");
  }
}

function scrollToLatest() {
  const chatMessages = document.querySelector(".chat-messages");
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Hide the button after scrolling down
  const jumpBtn = document.getElementById("jump-to-latest");
  if (jumpBtn) jumpBtn.classList.add("d-none");
}
let lastMessageId = null;
let currentUserId = null;
// Initialize interval to null. It will be set later when a chat is opened.
let interval = null;

function handleChatClick(element) {
  const userId = element.getAttribute("data-userid");
  const fullname = element.getAttribute("data-fullname");
  const messages = JSON.parse(element.getAttribute("data-messages") || "[]");

  currentUserId = userId; // Needed for sendAdminMessage to work

  // --- CONDITIONAL MOBILE VIEW TOGGLE LOGIC ---
  // Check if the screen is considered "small" (e.g., less than 768px wide)
  // This matches the typical breakpoint for Bootstrap's 'md' (medium) size.
  if (window.innerWidth < 768) {
    const chatSidebar = document.querySelector(".chat-sidebar");
    const chatMain = document.querySelector(".chat-main");

    if (chatSidebar && chatMain) {
      chatSidebar.style.display = "none";      // Hide the chat sidebar (list)
      chatMain.style.display = "flex";        // Show the main chat window
    } else {
      console.warn("Chat sidebar or main chat element not found. Cannot toggle view on small screen.");
      return; // Exit if essential elements aren't found for mobile toggle
    }
  }
  // --- END CONDITIONAL MOBILE VIEW TOGGLE LOGIC ---


  // Mark messages as read on server
  fetch("/admin/mark-messages-read", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  })
    .catch(err => console.error("Error marking messages read:", err));

  // Set up chat window
  const chatWindow = document.getElementById("chat-window");
  if (!chatWindow) {
    console.error("Chat window (chat-content) not found.");
    return;
  }

  // Use your original `chat-messages` class and style for the inner div
  chatWindow.innerHTML = `
        <h6>${fullname}</h6>
        <button onclick="fetchNewMessages()" class="btn btn-sm btn-outline-primary mb-2">Refresh</button>
        <div class="chat-messages" style="max-height: 400px; overflow-y: auto;"></div>
        <button id="jump-to-latest" class="btn btn-sm btn-secondary mt-2" onclick="scrollToLatest()">
            Jump to Latest
        </button>
        
        <div class="mt-3">
            <textarea id="admin-reply" class="form-control" rows="2" placeholder="Type your message..."></textarea>
            <button onclick="sendAdminMessage()" class="btn btn-primary mt-2">Send</button>
        </div>
    `;

  // Load existing messages into chat
  // Select the div with class "chat-messages" as per your preference
  const chatMessages = chatWindow.querySelector(".chat-messages");
  if (chatMessages) {
    chatMessages.innerHTML = messages
      .map((msg) => {
        const isAdmin = msg.fullname === "Admin" || msg.fromAdmin; // Added `|| msg.fromAdmin` for robustness
        return `
                    <div class="message ${isAdmin ? "admin-message" : "user-message"} mb-2">
                        <div class="p-2 rounded ${isAdmin ? "bg-primary text-white" : "bg-light"
          }" style="max-width: 75%; float: ${isAdmin ? "right" : "left"};">
                            ${msg.text}
                        </div>
                        <div style="clear: both;"></div>
                    </div>
                `;
      })
      .join("");

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Store last message ID for incremental fetch
  lastMessageId = messages.length ? messages[messages.length - 1]._id : null;

  // Reset and start fetch interval
  if (interval) { // Clear existing interval if any
    clearInterval(interval);
  }
  interval = setInterval(() => {
    fetchNewMessages();
  }, 1000);
}
function sendAdminMessage() {
  const message = document.getElementById("admin-reply").value.trim();
  if (!message || !currentUserId) return;

  const chatMessages = document.querySelector(".chat-messages");
  const messageElement = document.createElement("div");
  messageElement.className = "message admin-message mb-2";
  messageElement.innerHTML = `
    <div class="p-2 rounded bg-primary text-white" style="max-width: 75%; float: right;">
      ${message}
    </div>
    <div style="clear: both;"></div>
  `;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  document.getElementById("admin-reply").value = "";

  fetch("/admin/admin-reply-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId: currentUserId, text: message }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      return response.json();
    })
    .then(() => {
      fetchNewMessages();
    })
    .catch((err) => {
      console.error("Error sending message:", err);
    });
}

async function fetchNewMessages() {
  if (!currentUserId) return;

  try {
    const response = await fetch(`/admin/get-messages?userId=${currentUserId}`);
    const data = await response.json();

    const messages = [...data.userMessages, ...data.adminMessages];

    // Sort by time
    messages.sort(
      (a, b) =>
        new Date(a.sentAt || a.createdAt) - new Date(b.sentAt || b.createdAt)
    );

    const chatMessages = document.querySelector(".chat-messages");

    // Check if user is near bottom BEFORE rendering new messages
    const isAtBottom =
      chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 50;

    // Render messages
    chatMessages.innerHTML = messages
      .map((msg) => {
        const isAdmin = msg.toUserId !== undefined;
        return `
          <div class="message ${isAdmin ? "admin-message" : "user-message"} mb-2">
            <div class="p-2 rounded ${isAdmin ? "bg-primary text-white" : "bg-light"
          }" style="max-width: 75%; float: ${isAdmin ? "right" : "left"};">
              ${msg.text}
            </div>
            <div style="clear: both;"></div>
          </div>
        `;
      })
      .join("");

    // Auto-scroll only if user was already at the bottom
    if (isAtBottom) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show/hide the "Jump to Latest" button
    const jumpBtn = document.getElementById("jump-to-latest");
    if (jumpBtn) {
      if (!isAtBottom) {
        jumpBtn.classList.remove("d-none");
      } else {
        jumpBtn.classList.add("d-none");
      }
    }

  } catch (err) {
    console.error("❌ Error fetching messages:", err);
  }
}


document.addEventListener("DOMContentLoaded", function () {
  let lastSeenMessages = {};

  function fetchMessages() {
    fetch("/admin/get-sidebar-messages")
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const text = await response.text();
        if (!text) throw new Error("Empty response from server");
        return JSON.parse(text);
      })
      .then((data) => {
        const chatList = document.getElementById("chat-list");
        if (chatList) {
          const uniqueUsers = {};
          const newNotifications = [];

          data.forEach((msg) => {
            const userId = msg.userId;

            // Save latest message for each user
            if (
              !uniqueUsers[userId] ||
              new Date(msg.createdAt) > new Date(uniqueUsers[userId].createdAt)
            ) {
              uniqueUsers[userId] = msg;
            }

            // NEW MESSAGE detection: Only notify if unread and timestamp is newer
            const lastSeen = lastSeenMessages[userId];
            if (
              msg.unread &&
              (!lastSeen || new Date(msg.createdAt) > new Date(lastSeen))
            ) {
              lastSeenMessages[userId] = msg.createdAt;
              newNotifications.push(msg.fullname);
            }
          });

          const messages = Object.values(uniqueUsers).sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          chatList.innerHTML =
            messages.length === 0
              ? '<li class="list-group-item">No messages yet.</li>'
              : "";

          messages.forEach((msg) => {
            const li = document.createElement("li");
            li.className = `list-group-item chat-item ${msg.unread ? "fw-bold" : "text-muted"
              }`;
            li.dataset.userid = msg.userId;
            li.dataset.fullname = msg.fullname;
            li.dataset.messages = JSON.stringify(msg.allMessages || []);
            li.setAttribute("onclick", "handleChatClick(this)");
            li.innerHTML = `<strong>${msg.fullname}</strong><br>
                          <span>${msg.text.length > 30
                ? msg.text.slice(0, 30) + "..."
                : msg.text
              }</span>`;
            chatList.appendChild(li);
          });

          if (newNotifications.length > 0) {
            showNotification(newNotifications.join(", "));
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching messages:", error);
      });
  }

  function showNotification(names) {
    const alertBox = document.createElement("div");
    alertBox.className =
      "alert alert-info position-fixed top-0 end-0 m-3 shadow";
    alertBox.style.zIndex = "9999";
    alertBox.textContent = `New message from: ${names}`;
    document.body.appendChild(alertBox);

    const audio = document.getElementById("notification-sound");
    if (audio) {
      audio.play().catch((err) => {
        console.warn("Unable to play sound:", err);
      });
    }

    setTimeout(() => {
      alertBox.remove();
    }, 4000);
  }

  setInterval(fetchMessages, 1000);

  fetchMessages();
});

document.addEventListener(
  "click",
  () => {
    const audio = document.getElementById("notification-sound");
    if (audio) {
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
        })
        .catch(() => { });
    }
  },
  { once: true }
);

// admin update section
// admin
function toggleEditProfile() {
  let editForm = document.getElementById("edit-profile-form");
  let securityForm = document.getElementById("update-security-form");

  securityForm.style.display = "none";

  editForm.style.display =
    editForm.style.display === "block" ? "none" : "block";
}

function toggleUpdateSecurity() {
  let securityForm = document.getElementById("update-security-form");
  let editForm = document.getElementById("edit-profile-form");

  editForm.style.display = "none";

  securityForm.style.display =
    securityForm.style.display === "block" ? "none" : "block";
}

document.addEventListener("DOMContentLoaded", function () {
  // Mark Order as Completed
  document.querySelectorAll(".mark-completed").forEach((button) => {
    button.addEventListener("click", async function () {
      const order_Id = this.getAttribute("data-id");

      try {
        const response = await fetch(`/admin/update-order-status/${order_Id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "delivered" }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to update order status: ${response.status} ${response.statusText}`
          );
        }

        this.textContent = "Delivered";
        this.classList.remove("btn-success");
        this.classList.add("btn-secondary");
      } catch (error) {
        console.error("Error updating order status:", error);
        alert("Failed to update order status.");
      }
    });
  });

  // View Order Details in Modal
  document.querySelectorAll(".view-order").forEach((button) => {
    button.addEventListener("click", async function () {
      const order_Id = this.getAttribute("data-id");

      console.log("Fetching order details for:", order_Id);

      try {
        const response = await fetch(`/admin/get-order/${order_Id}`);
        console.log("API Response Status:", response.status);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch order details: ${response.status} ${response.statusText}`
          );
        }

        const order = await response.json();
        console.log("Order details received:", order);

        document.getElementById("modal-order-id").textContent =
          order.paymentReference;
        document.getElementById("modal-user-name").textContent = order.fullname;
        document.getElementById("modal-total-amount").textContent =
          order.totalAmount.toLocaleString();
        document.getElementById("modal-order-date").textContent = new Date(
          order.orderDate
        ).toDateString();
        document.getElementById("modal-status").textContent = order.status;
        document.getElementById("modal-item").textContent = order.items
          .map((item) => `${item.name} (${item.quantity})`)
          .join(", ");
        document.getElementById("modal-delivery-address").textContent =
          order.shippingAddress;
        const imagesContainer = document.getElementById("modal-images");
        imagesContainer.innerHTML = "";

        order.items.forEach((item) => {
          if (item.image) {
            const img = document.createElement("img");
            img.src = item.image;
            img.alt = `Image of ${item.name}`;
            img.classList.add("img-fluid", "m-2");
            img.style.width = "100px";

            imagesContainer.appendChild(img);
          } else {
            console.warn(`No image found for item: ${item.name}`);
          }
        });

        const modalElement = document.getElementById("orderModal");
        const modal = new bootstrap.Modal(modalElement, {
          backdrop: "static",
          keyboard: false,
        });
        modal.show();
        console.log("Modal should now be visible.");
      } catch (error) {
        console.error("Error fetching order details:", error);
        alert("Failed to retrieve order details.");
      }
    });
  });

  document.querySelectorAll(".close-modal").forEach((button) => {
    button.addEventListener("click", function () {
      const modalInstance = bootstrap.Modal.getInstance(
        document.getElementById("orderModal")
      );
      modalInstance.hide();
    });
  });
});

// Function to fetch and display the dashboard stats
function fetchDashboardStats() {
  fetch("/admin/dashboard-stats")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("total-orders").textContent = data.totalPayments;
      document.getElementById(
        "total-sales"
      ).textContent = `₦${data.totalSales.toLocaleString()}`;
      document.getElementById("successful-payments").textContent =
        data.successfulPayments;
      document.getElementById("failed-payments").textContent =
        data.failedPayments;
    })
    .catch((error) => {
      console.error("Error fetching dashboard stats:", error);
    });
}

// Global variable to hold the chart instance
let averageRatingChartInstance = null;

function fetchAverageRating() {
  fetch("/admin/average-rating")
    .then((response) => {
      if (!response.ok) {
        // If the server responded with an error status (e.g., 404, 500)
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const averageRating =
        typeof data.averageRating === "number"
          ? data.averageRating
          : parseFloat(data.averageRating) || 0;

      document.getElementById("avg-rating").textContent =
        averageRating.toFixed(1);
      createAverageRatingChart(averageRating);
    })
    .catch((error) => {
      console.error("Error fetching average rating:", error);
      const avgRatingEl = document.getElementById("avg-rating");
      if (avgRatingEl) {
        avgRatingEl.textContent = averageRating.toFixed(1);
      }
      createAverageRatingChart(averageRating);
    });
}

// Function to fetch and render orders by state chart
function fetchOrdersByState() {
  fetch("/admin/dashboard-orders-by-state") // New API endpoint
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const ordersChartContainer =
        document.getElementById("ordersByStateChart");
      const noOrdersMsg = document.getElementById("no-orders-msg");

      if (
        data.data &&
        data.data.length > 0 &&
        data.data.some((count) => count > 0)
      ) {
        // If there's data, hide the message and show the chart
        noOrdersMsg.style.display = "none";
        ordersChartContainer.style.display = "block";
        createOrdersByStateChart(data.labels, data.data);
      } else {
        // If no data, show the message and hide the chart
        ordersChartContainer.style.display = "none";
        noOrdersMsg.style.display = "block";
      }
    })
    .catch((error) => {
      console.error("Error fetching orders by state data:", error);
      document.getElementById("ordersByStateChart").style.display = "none";
      document.getElementById("no-orders-msg").style.display = "block";
      document.getElementById("no-orders-msg").innerHTML =
        "<p>Error loading order data.</p>";
    });
}

// Global variable to hold the chart instance for orders by state
let ordersByStateChartInstance = null;

function createOrdersByStateChart(labels, data) {
  const ctx = document.getElementById("ordersByStateChart").getContext("2d");

  // Destroy existing chart instance if it exists
  if (ordersByStateChartInstance) {
    ordersByStateChartInstance.destroy();
  }

  // --- Dynamic Height Calculation ---
  const heightPerBar = 30;
  const calculatedMinHeight = labels.length * heightPerBar;
  ctx.canvas.style.height = `${calculatedMinHeight}px`;
  // --- End Dynamic Height Calculation ---

  ordersByStateChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Number of Orders",
          data: data,
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Orders",
          },
          ticks: {
            precision: 0,
          },
        },
        y: {
          title: {
            display: true,
            text: "State",
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              label += context.parsed.x;
              return label;
            },
          },
        },
        // --- MODIFICATION HERE: Disable datalabels ---
        datalabels: {
          display: false, // Set this to false to hide the labels on the bars
        },
        // --- END MODIFICATION ---
      },
    },
    plugins: [ChartDataLabels], // Keep this if you use ChartDataLabels for other charts,
    // but for this specific chart, 'display: false' in options
    // will override its rendering.
  });
}
// Call fetchOrdersByState when the DOM is loaded
document.addEventListener("DOMContentLoaded", fetchOrdersByState);

function createAverageRatingChart(averageRating) {
  const ctx = document.getElementById("averageRatingChart").getContext("2d");

  // Destroy existing chart instance if it exists
  if (averageRatingChartInstance) {
    averageRatingChartInstance.destroy();
  }

  const maxRating = 5;
  const filledPortion = averageRating;
  const remainingPortion = maxRating - averageRating;

  averageRatingChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Rated", "Remaining"], // Labels are for internal Chart.js use
      datasets: [
        {
          data: [filledPortion, remainingPortion],
          backgroundColor: ["#FFD700", "#ccc"], // Yellow for filled, gray for background
          borderWidth: 0, // No borders between segments
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // Allow custom size
      plugins: {
        tooltip: {
          enabled: false, // Disable tooltips
        },
        legend: {
          display: false, // Hide the legend
        },
        datalabels: {
          display: false, // Hide data labels on the chart itself
        },
      },
      cutout: "80%", // Makes it a donut chart for better visual
    },
    plugins: [ChartDataLabels], // Ensure this plugin is registered if you're using it elsewhere
  });
}

// Call fetchAverageRating when the DOM is loaded
document.addEventListener("DOMContentLoaded", fetchAverageRating);

window.onload = function () {
  fetchDashboardStats();
  fetchAverageRating();
};

document.addEventListener("DOMContentLoaded", () => {
  function setupSearch(sectionId, apiStatus) {
    const input = document.getElementById(`${sectionId}-search-input`);
    const btn = document.getElementById(`${sectionId}-search-btn`);
    const resultDiv = document.getElementById(`${sectionId}-search-result`);
    const tableContainer =
      document.getElementById(`${sectionId}-table-container`) ||
      document.getElementById(`${sectionId}-table-responsive`);

    if (!btn || !input || !resultDiv || !tableContainer) {
      console.error("One or more search elements not found.");
      return;
    }

    btn.addEventListener("click", async () => {
      const paymentReference = input.value.trim();
      if (!paymentReference) {
        alert("Please enter a payment reference to search.");
        return;
      }

      try {
        resultDiv.innerHTML = "Searching...";
        resultDiv.style.display = "block";
        tableContainer.style.display = "none";

        // Update the fetch URL to include the /admin prefix
        const response = await fetch(
          `/admin/orders/search?paymentReference=${encodeURIComponent(
            paymentReference
          )}&status=${apiStatus}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            resultDiv.innerHTML =
              "<p>No order found with that payment reference.</p>";
          } else {
            resultDiv.innerHTML = "<p>Error searching for order.</p>";
          }
          tableContainer.style.display = "block";
          return;
        }

        const data = await response.json();
        if (!data.order) {
          resultDiv.innerHTML = "<p>No order found.</p>";
          tableContainer.style.display = "block";
          return;
        }

        // Render order details
        const order = data.order;
        let itemsHtml = "";
        order.items.forEach((item) => {
          itemsHtml += `
            <li>
              ${item.productName || item.name || "Item"} - Quantity: ${item.quantity
            } - Price: ${item.price}
            </li>
          `;
        });

        resultDiv.innerHTML = `
          <h4>Order Details</h4>
          <p><strong>Name:</strong> ${order.fullname}</p>
          <p><strong>Payment Reference:</strong> ${order.paymentReference}</p>
          <p><strong>Order Status:</strong> ${order.status || order.orderStatus
          }</p>
          <p><strong>Payment Status:</strong> ${order.paymentStatus || "N/A"
          }</p>
          <p><strong>Order Date:</strong> ${new Date(
            order.orderDate || order.paymentDate
          ).toDateString()}</p>
          <p><strong>Items:</strong></p>
          <ul>${itemsHtml}</ul>
          <button id="${sectionId}-back-btn" class="btn btn-secondary">Back to list</button>
        `;

        // Back button handler
        document
          .getElementById(`${sectionId}-back-btn`)
          .addEventListener("click", () => {
            resultDiv.style.display = "none";
            tableContainer.style.display = "block";
            input.value = "";
          });
      } catch (err) {
        resultDiv.innerHTML = "<p>Error fetching order details.</p>";
        tableContainer.style.display = "block";
      }
    });
  }

  setupSearch("pending", "pending");
  setupSearch("completed", "completed");
  setupSearch("failed", "failed");
});

// producttable scroll function
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("scroll-container");
  const tableBody = document.getElementById("product-list");
  let isLoading = false;

  container.addEventListener("scroll", async () => {
    const scrollBottom = container.scrollTop + container.clientHeight;
    const nearBottom = scrollBottom >= container.scrollHeight - 10;

    if (nearBottom && !isLoading) {
      isLoading = true;

      let currentPage = parseInt(tableBody.getAttribute("data-page") || "1");
      const nextPage = currentPage + 1;

      try {
        const res = await fetch(`/admin/products?page=${nextPage}`);
        const data = await res.json();

        if (data.products.length === 0) {
          return;
        }

        data.products.forEach((product) => {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td><img src="${product.product_images[0]}" alt="${product.product_name}" class="img-thumbnail" style="width: 50px; height: 50px;"></td>
            <td class="text-center">${product.product_name}</td>
            <td class="text-center">${product.brand}</td>
            <td class="text-center">${product.quantity}</td>
            <td class="text-center">
              <a href="/admin/product/${product._id}" class="btn btn-sm btn-primary">View</a>
              <form action="/admin/delete-product/${product._id}" method="POST" style="display:inline;" onsubmit="return confirm('Are you sure?')">
                <button type="submit" class="btn btn-sm btn-danger">Delete</button>
              </form>
            </td>
          `;
          tableBody.appendChild(row);
        });

        tableBody.setAttribute("data-page", nextPage);
      } catch (error) {
        console.error("Scroll loading error:", error);
      } finally {
        isLoading = false;
      }
    }
  });

  const custContainer = document.getElementById("scroll-cont-2");
  const tableBodyCust = document.getElementById("customer-list");
  let isLoadingCust = false;

  const scrollHandler = async () => {
    const scrollBottom = custContainer.scrollTop + custContainer.clientHeight;
    const nearBottom = scrollBottom >= custContainer.scrollHeight - 10;

    if (nearBottom && !isLoadingCust) {
      isLoadingCust = true;

      let currentPage = parseInt(
        tableBodyCust.getAttribute("data-page") || "1"
      );
      const nextPage = currentPage + 1;

      try {
        const res = await fetch(`/admin/customers?page=${nextPage}`);
        const data = await res.json();

        if (data.users.length === 0 || data.hasMore === false) {
          custContainer.removeEventListener("scroll", scrollHandler);
          return;
        }

        data.users.forEach((user) => {
          const row = document.createElement("tr");
          row.innerHTML = `
          <td>${user.fullname}</td>
          <td>${user.email}</td>
          <td>${user.phone}</td>
          <td>${user.totalOrders}</td>
          <td>${user.completedOrders}</td>
          <td>${user.pendingOrders}</td>
          <td class="text-center">
            <div class="btn-group">
              <a href="/admin/viewcustomer/${user._id}" class="btn btn-info btn-sm">
                <i class="fa fa-eye"></i> View
              </a>
              <button class="btn btn-danger btn-sm"><i class="fa fa-trash"></i> Delete</button>
            </div>
          </td>
        `;
          tableBodyCust.appendChild(row);
        });

        tableBodyCust.setAttribute("data-page", nextPage);
      } catch (error) {
        console.error("Scroll loading error:", error);
      } finally {
        isLoadingCust = false;
      }
    }
  };

  custContainer.addEventListener("scroll", scrollHandler);


  const loadInitialCustomers = async () => {
    try {
      const res = await fetch(`/admin/customers?page=1`);
      const data = await res.json();

      if (!data.users || data.users.length === 0) return;

      data.users.forEach((user) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.fullname}</td>
          <td>${user.email}</td>
          <td>${user.phone}</td>
          <td>${user.totalOrders}</td>
          <td>${user.completedOrders}</td>
          <td>${user.pendingOrders}</td>
          <td class="text-center">
            <div class="btn-group">
              <a href="/admin/viewcustomer/${user._id}" class="btn btn-info btn-sm">
                <i class="fa fa-eye"></i> View
              </a>
              <button class="btn btn-danger btn-sm"><i class="fa fa-trash"></i> Delete</button>
            </div>
          </td>
        `;
        tableBodyCust.appendChild(row);
      });

      tableBodyCust.setAttribute("data-page", "1");
    } catch (error) {
      console.error("Initial load error:", error);
    }
  };

  const loadInitialProducts = async () => {
    try {
      const res = await fetch(`/admin/products?page=1`);
      const data = await res.json();

      if (!data.products || data.products.length === 0) return;

      data.products.forEach((product) => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td><img src="${product.product_images[0]}" alt="${product.product_name}" class="img-thumbnail" style="width: 50px; height: 50px;"></td>
        <td class="text-center">${product.product_name}</td>
        <td class="text-center">${product.brand}</td>
        <td class="text-center">${product.quantity}</td>
        <td class="text-center">
          <a href="/admin/product/${product._id}" class="btn btn-sm btn-primary">View</a>
          <form action="/admin/delete-product/${product._id}" method="POST" style="display:inline;" onsubmit="return confirm('Are you sure?')">
            <button type="submit" class="btn btn-sm btn-danger">Delete</button>
          </form>
        </td>
      `;
        tableBody.appendChild(row);
      });

      tableBody.setAttribute("data-page", "1");
    } catch (error) {
      console.error("Initial load error:", error);
    }
  };

  loadInitialProducts();
  loadInitialCustomers();

});