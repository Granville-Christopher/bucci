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

document.addEventListener('DOMContentLoaded', () => {
    const brandFiltersContainer = document.querySelector('.brand-filters');

    if (brandFiltersContainer) {
        brandFiltersContainer.addEventListener('click', (event) => {
            
            const clickedButton = event.target.closest('.brand-filter-btn');

            if (clickedButton) {
              
                const allFilterButtons = brandFiltersContainer.querySelectorAll('.brand-filter-btn');
                allFilterButtons.forEach(button => {
                    button.classList.remove('current-brand');
                });

                clickedButton.classList.add('current-brand');

                const selectedCategory = clickedButton.dataset.category;
                console.log('Selected Category:', selectedCategory);
             
            }
        });
    }
});