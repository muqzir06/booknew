// Library Management System Client-side Logic

document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Sidebar Toggle Button Action
    const sidebarToggle = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // 2. Auto-Dismiss Alert Messages
    const flashAlerts = document.querySelectorAll('.alert-dismissible');
    flashAlerts.forEach(function(alert) {
        setTimeout(function() {
            // Bootstrap 5 transition collapse
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000); // 5 seconds
    });

    // 3. Client-Side Table Search (Instant Filter)
    const searchInputs = document.querySelectorAll('.table-search-input');
    searchInputs.forEach(function(input) {
        input.addEventListener('keyup', function() {
            const filterValue = this.value.toLowerCase();
            const targetTableId = this.getAttribute('data-target-table');
            const table = document.getElementById(targetTableId);
            
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(function(row) {
                    const text = row.textContent.toLowerCase();
                    if (text.includes(filterValue)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            }
        });
    });

    // 4. Client-Side Card Search (For Public Catalog index.html)
    const cardSearch = document.getElementById('card-search-input');
    if (cardSearch) {
        cardSearch.addEventListener('keyup', function() {
            const filterValue = this.value.toLowerCase();
            const cards = document.querySelectorAll('.book-catalog-card');
            
            cards.forEach(function(card) {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                const author = card.querySelector('.card-author').textContent.toLowerCase();
                const category = card.querySelector('.card-category').textContent.toLowerCase();
                const isbn = card.querySelector('.card-isbn').textContent.toLowerCase();
                
                if (title.includes(filterValue) || author.includes(filterValue) || category.includes(filterValue) || isbn.includes(filterValue)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // 5. Delete Confirmations
    const deleteButtons = document.querySelectorAll('.confirm-delete');
    deleteButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            const message = this.getAttribute('data-message') || 'Are you sure you want to delete this record?';
            if (!confirm(message)) {
                e.preventDefault();
            }
        });
    });

    // 6. Dynamic Fine Helper (Return Book Screen)
    // Displays calculated fine instantly when actual return date is picked
    const returnDatePicker = document.getElementById('actual_return_date');
    const dueDateText = document.getElementById('due_date_val');
    const fineOutput = document.getElementById('calculated_fine_val');
    const fineInputHidden = document.getElementById('fine_amount_hidden');

    if (returnDatePicker && dueDateText && fineOutput) {
        returnDatePicker.addEventListener('change', function() {
            const actualReturnDate = new Date(this.value);
            const dueDate = new Date(dueDateText.innerText);
            
            if (actualReturnDate > dueDate) {
                // Calculate difference in days
                const diffTime = Math.abs(actualReturnDate - dueDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const finePerDay = 10.00; // Rs. 10 per day fine
                const totalFine = diffDays * finePerDay;
                
                fineOutput.innerText = `Rs. ${totalFine.toFixed(2)}`;
                if (fineInputHidden) {
                    fineInputHidden.value = totalFine.toFixed(2);
                }
            } else {
                fineOutput.innerText = 'Rs. 0.00';
                if (fineInputHidden) {
                    fineInputHidden.value = '0.00';
                }
            }
        });
    }
});
