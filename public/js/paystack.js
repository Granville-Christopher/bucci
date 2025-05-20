checkoutBtn.addEventListener("click", async function () {
  console.log("Checkout button clicked");

  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = "Processing...";

  let subtotal =
    parseFloat(
      document.getElementById("subtotal").textContent.replace(/[^\d.]/g, "")
    ) || 0;
  let shipping = parseFloat(document.getElementById("shipping").value) || 0;
  let totalPrice = subtotal + shipping;

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  console.log("Cart Items:", cart);

  let items = cart.map((item) => ({
    itemId: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  }));

  // try {
  //   const addressRes = await fetch("/get-delivery-address", {
  //     method: "GET",
  //     credentials: "include",
  //   });

  //   if (!addressRes.ok) {
  //     console.error("Failed to fetch delivery address:", addressRes.statusText);
  //     alert("Failed to fetch delivery address. Please try again.");
  //     return;
  //   }

  //   const addressData = await addressRes.json();
  //   console.log("Shipping Address Data:", addressData);

  //   let shippingAddress = "No shipping address uploaded.";
  //   if (addressData && addressData.address) {
  //     const addr = addressData.address;
  //     shippingAddress = `${addr.houseNumber}, ${addr.street}, ${addr.town}, ${addr.city}, ${addr.state}, ${addr.postalCode}`;
  //   }

  //   const res = await fetch("/create-payment", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     credentials: "include",
  //     body: JSON.stringify({
  //       items: items,
  //       totalAmount: totalPrice,
  //       shippingAddress: shippingAddress,
  //     }),
  //   });
  //   if (!res.ok) throw new Error("Failed to create Payment");
  //   const createPaymentResponse = await res.json();
  //   console.log("Paymnt created:", createPaymentResponse);
  try {
    const addressRes = await fetch("/get-delivery-address", {
      method: "GET",
      credentials: "include",
    });

    if (!addressRes.ok) {
      console.error("Failed to fetch delivery address:", addressRes.statusText);
      alert("Failed to fetch delivery address. Please try again.");
      return;
    }

    const addressData = await addressRes.json();
    console.log("Shipping Address Data:", addressData);

    // --- MODIFICATION STARTS HERE ---
    let deliveryAddressObjectId = null; // Initialize to null
    if (addressData && addressData.address && addressData.address._id) {
      deliveryAddressObjectId = addressData.address._id; // Get the _id
    }

    // Add a check to ensure you have a valid ID
    if (!deliveryAddressObjectId) {
      alert(
        "No valid delivery address found. Please add one before proceeding."
      );
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = "Checkout";
      return; // Stop execution if no address ID
    }
    // --- MODIFICATION ENDS HERE ---

    const res = await fetch("/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        items: items,
        totalAmount: totalPrice,
        shippingAddress: deliveryAddressObjectId, // <<< NOW sending the ObjectId!
      }),
    });

    if (!res.ok) throw new Error("Failed to create Payment");
    const createPaymentResponse = await res.json();
    console.log("Payment created:", createPaymentResponse);
    if (
      !createPaymentResponse ||
      !createPaymentResponse.paymentId ||
      !createPaymentResponse.email
    ) {
      alert("Problem creating your payment. Please try again.");
      checkoutBtn.disabled = false;
      checkoutBtn.innerHTML = "Checkout";
      return;
    }

    let createdPaymentId = createPaymentResponse.paymentId;
    let userEmail = createPaymentResponse.email;

    // Initialize Paystack payment
    let handler = PaystackPop.setup({
      key: "pk_live_36cbcfd014a9e909f1b203eefaab7d05446ad166",
      email: userEmail,
      amount: totalPrice * 100,
      currency: "NGN",
      ref: "BUCCI_" + Math.floor(Math.random() * 1000000000 + 1),
      callback: function (response) {
        alert("Payment successful! Reference: " + response.reference);
        console.log("Created Payment ID:", createdPaymentId);
        fetch(`/update-payment-status/${createdPaymentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: "completed",
            paymentReference: response.reference,
          }),
        })
          .then((updateRes) => {
            console.log("Response status:", updateRes.status);

            if (!updateRes.ok) {
              throw new Error(
                `Failed to update payment: ${updateRes.status} ${updateRes.statusText}`
              );
            }
            return updateRes.json();
          })
          .then((updateData) => {
            console.log("Payment status updated successfully:", updateData);
            localStorage.removeItem("cart");
            window.location.href = "/shop";
          })
          .catch((err) => {
            console.error("Error updating payment status:", err);
            alert("Payment succeeded, but failed to update payment.");
          });
      },
      onClose: function () {
        alert("Payment window closed.");

        fetch(`/update-payment-status/${createdPaymentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: "failed",
          }),
        }).catch((err) => {
          console.error("Error updating payment status to failed:", err);
        });
      },
    });

    console.log("Paystack handler initialized:", handler);
    handler.openIframe();
  } catch (err) {
    console.error("Error creating payment:", err);
    alert(err.message || "Network error while creating payment.");
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = "Checkout";
  }
});
