document.addEventListener("DOMContentLoaded", function () {
    var filterBtn = document.getElementById("filter-btn");
    var filterSection = document.getElementById("filter-section");

    // Toggle filter section on button click
    filterBtn.onclick = function (event) {
        event.stopPropagation(); 
        if (filterSection.style.display === "none" || filterSection.style.display === "") {
            filterSection.style.display = "block";
        } else {
            filterSection.style.display = "none";
        }
    };

    // Close filter section when clicking outside
    document.addEventListener("click", function (event) {
        if (!filterBtn.contains(event.target) && !filterSection.contains(event.target)) {
            filterSection.style.display = "none";
        }
    });
});
