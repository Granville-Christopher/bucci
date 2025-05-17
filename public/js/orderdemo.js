document.addEventListener('DOMContentLoaded', function() {
    // Function to fetch orders and update UI
    function loadOrders() {
        fetch('/get-orders')
            .then(response => response.json())
            .then(data => {
                const completedOrdersList = document.getElementById('completed-orders');
                const pendingOrdersList = document.getElementById('pending-orders');
                const failedOrdersList = document.getElementById('cancelled-orders');

                // Clear current lists
                completedOrdersList.innerHTML = '';
                pendingOrdersList.innerHTML = '';
                failedOrdersList.innerHTML = '';

                // If no completed orders
                if (data.completed.length === 0) {
                    completedOrdersList.innerHTML = '<li class="list-group-item">No completed orders yet.</li>';
                } else {
                    data.completed.forEach(order => {
                        const listItem = document.createElement('li');
                        listItem.classList.add('list-group-item');
                        listItem.innerHTML = `Order ID: ${order.orderId} - ${order.itemName}`;
                        completedOrdersList.appendChild(listItem);
                    });
                }

                // If no pending orders
                if (data.pending.length === 0) {
                    pendingOrdersList.innerHTML = '<li class="list-group-item">No pending orders yet.</li>';
                } else {
                    data.pending.forEach(order => {
                        const listItem = document.createElement('li');
                        listItem.classList.add('list-group-item');
                        listItem.innerHTML = `Order ID: ${order.orderId} - ${order.itemName}`;
                        pendingOrdersList.appendChild(listItem);
                    });
                }

                // If no failed orders
                if (data.failed.length === 0) {
                    failedOrdersList.innerHTML = '<li class="list-group-item">No failed orders yet.</li>';
                } else {
                    data.failed.forEach(order => {
                        const listItem = document.createElement('li');
                        listItem.classList.add('list-group-item');
                        listItem.innerHTML = `Order ID: ${order.orderId} - ${order.itemName}`;
                        failedOrdersList.appendChild(listItem);
                    });
                }
            })
            .catch(error => {
                console.error('Error loading orders:', error);
            });
    }

    // Load orders on page load
    loadOrders();
});
