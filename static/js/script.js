// Library Management System (Libraria) Client-Side Storage & Logic

// =========================================================================
// 1. DATABASE ENGINE (LOCAL STORAGE LAYER)
// =========================================================================

const DB = {
    // Initial Seed Data
    seeds: {
        admins: [
            { id: 1, username: 'admin', password: 'admin123', full_name: 'System Administrator' }
        ],
        students: [
            { id: 1, student_id: 'STU001', name: 'Alice Johnson', email: 'alice@university.edu', phone: '9876543210', department: 'Computer Science' },
            { id: 2, student_id: 'STU002', name: 'Bob Smith', email: 'bob@university.edu', phone: '8765432109', department: 'Mechanical Engineering' },
            { id: 3, student_id: 'STU003', name: 'Charlie Brown', email: 'charlie@university.edu', phone: '7654321098', department: 'Electronics & Communication' }
        ],
        books: [
            { id: 1, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262033848', category: 'Computer Science', quantity: 5, available_qty: 4 },
            { id: 2, title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', category: 'Software Engineering', quantity: 3, available_qty: 3 },
            { id: 3, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '978-0135957059', category: 'Software Engineering', quantity: 4, available_qty: 3 },
            { id: 4, title: 'Database System Concepts', author: 'Abraham Silberschatz', isbn: '978-9332901384', category: 'Database Management', quantity: 2, available_qty: 2 },
            { id: 5, title: 'The 48 Laws of Power', author: 'Robert Greene', isbn: '978-0140280197', category: 'General Science', quantity: 4, available_qty: 4 },
            { id: 6, title: 'Discipline Is Destiny', author: 'Ryan Holiday', isbn: '978-0593191620', category: 'General Science', quantity: 3, available_qty: 3 },
            { id: 7, title: 'Life is Love', author: 'Swami Rama', isbn: '978-0893891367', category: 'Fiction', quantity: 2, available_qty: 2 },
            { id: 8, title: 'Love Means What', author: 'Leo Buscaglia', isbn: '978-0140060911', category: 'Fiction', quantity: 5, available_qty: 5 }
        ],
        issued_books: [
            { 
                id: 1, 
                book_id: 1, 
                student_id: 1, 
                issue_date: getOffsetDateString(-5), 
                return_date: getOffsetDateString(9), 
                actual_return_date: null, 
                fine_amount: 0.00, 
                status: 'Issued' 
            },
            { 
                id: 2, 
                book_id: 3, 
                student_id: 2, 
                issue_date: getOffsetDateString(-15), 
                return_date: getOffsetDateString(-1), 
                actual_return_date: null, 
                fine_amount: 10.00, 
                status: 'Issued' 
            }
        ]
    },

    // Initialize LocalStorage structures
    init() {
        if (!localStorage.getItem('lms_admins')) {
            localStorage.setItem('lms_admins', JSON.stringify(this.seeds.admins));
        }
        if (!localStorage.getItem('lms_students')) {
            localStorage.setItem('lms_students', JSON.stringify(this.seeds.students));
        }
        if (!localStorage.getItem('lms_books')) {
            localStorage.setItem('lms_books', JSON.stringify(this.seeds.books));
        }
        if (!localStorage.getItem('lms_issued_books')) {
            localStorage.setItem('lms_issued_books', JSON.stringify(this.seeds.issued_books));
        }
    },

    // Generic accessors
    get(key) {
        this.init();
        return JSON.parse(localStorage.getItem('lms_' + key)) || [];
    },

    save(key, data) {
        localStorage.setItem('lms_' + key, JSON.stringify(data));
    },

    // Auto-increment ID generator
    nextId(key) {
        const items = this.get(key);
        if (items.length === 0) return 1;
        return Math.max(...items.map(item => item.id)) + 1;
    }
};

// Helper for offset date strings
function getOffsetDateString(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Format date for displays (e.g. 10-Jul-2026)
function formatDateString(isoString) {
    if (!isoString) return '';
    const parts = isoString.split('-');
    if (parts.length !== 3) return isoString;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const yr = parts[0];
    const mIdx = parseInt(parts[1]) - 1;
    const d = parseInt(parts[2]);
    return `${d}-${months[mIdx]}-${yr}`;
}

// Calculate days between two dates
function calculateDaysDiff(startStr, endStr) {
    const s = new Date(startStr);
    const e = new Date(endStr);
    const timeDiff = e - s;
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// =========================================================================
// 2. AUTHENTICATION & ROUTING GUARD
// =========================================================================

const Auth = {
    // Attempt Admin login
    login(username, password) {
        const admins = DB.get('admins');
        const admin = admins.find(a => a.username.toLowerCase() === username.toLowerCase() && a.password === password);
        if (admin) {
            sessionStorage.setItem('lms_session', JSON.stringify({
                logged_in: true,
                username: admin.username,
                full_name: admin.full_name,
                admin_id: admin.id
            }));
            return true;
        }
        return false;
    },

    // Log out admin
    logout() {
        sessionStorage.removeItem('lms_session');
        window.location.href = 'login.html';
    },

    // Retrieve active session
    getSession() {
        return JSON.parse(sessionStorage.getItem('lms_session'));
    },

    // Route protector for admin screens
    guard() {
        const session = this.getSession();
        if (!session || !session.logged_in) {
            // Redirect unauthorized to login screen
            localStorage.setItem('lms_flash_msg', JSON.stringify({
                type: 'error',
                message: 'Unauthorized access. Please login first.'
            }));
            window.location.href = 'login.html';
        }
    }
};

// =========================================================================
// 3. EXPORT TO CSV IMPLEMENTATION
// =========================================================================

function exportCSV(dataType) {
    let csvContent = "";
    let fileName = "";
    
    if (dataType === 'books') {
        const books = DB.get('books');
        fileName = "books_catalog.csv";
        csvContent += "ID,Book Title,Author,ISBN,Category,Total Copies,Available Copies\n";
        books.forEach(b => {
            csvContent += `"${b.id}","${escapeCsv(b.title)}","${escapeCsv(b.author)}","${escapeCsv(b.isbn)}","${escapeCsv(b.category)}","${b.quantity}","${b.available_qty}"\n`;
        });
    } 
    else if (dataType === 'students') {
        const students = DB.get('students');
        fileName = "students_directory.csv";
        csvContent += "ID,Student ID,Full Name,Email,Phone,Department\n";
        students.forEach(s => {
            csvContent += `"${s.id}","${escapeCsv(s.student_id)}","${escapeCsv(s.name)}","${escapeCsv(s.email)}","${escapeCsv(s.phone)}","${escapeCsv(s.department)}"\n`;
        });
    } 
    else if (dataType === 'transactions') {
        const transactions = DB.get('issued_books');
        const books = DB.get('books');
        const students = DB.get('students');
        fileName = "transactions_history.csv";
        csvContent += "Transaction ID,Student ID,Student Name,Book Title,ISBN,Issue Date,Due Date,Return Date,Fine Amount,Status\n";
        
        transactions.forEach(t => {
            const b = books.find(book => book.id === t.book_id) || {};
            const s = students.find(stud => stud.id === t.student_id) || {};
            csvContent += `"${t.id}","${escapeCsv(s.student_id || '')}","${escapeCsv(s.name || '')}","${escapeCsv(b.title || '')}","${escapeCsv(b.isbn || '')}","${t.issue_date}","${t.return_date}","${t.actual_return_date || ''}","${t.fine_amount.toFixed(2)}","${t.status}"\n`;
        });
    }
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function escapeCsv(text) {
    if (!text) return "";
    return text.toString().replace(/"/g, '""');
}

// Flash Message Utility
function flash(type, message) {
    const container = document.getElementById('flash-message-container');
    if (!container) return;
    
    const alertClass = type === 'error' ? 'danger' : (type === 'info' ? 'info' : 'success');
    const iconClass = type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check';
    
    container.innerHTML = `
        <div class="alert alert-${alertClass} alert-dismissible fade show" role="alert">
            <i class="fa-solid ${iconClass} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // Auto-dismiss alerts
    setTimeout(function() {
        const alerts = container.querySelectorAll('.alert');
        alerts.forEach(alert => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
}

// Load pending flash messages from localStorage
function checkFlashMessages() {
    const pending = localStorage.getItem('lms_flash_msg');
    if (pending) {
        const data = JSON.parse(pending);
        flash(data.type, data.message);
        localStorage.removeItem('lms_flash_msg');
    }
}

// =========================================================================
// 4. ROUTE ACTIONS & DYNAMIC DOM BINDINGS
// =========================================================================

document.addEventListener('DOMContentLoaded', function() {
    // 1. Always check for pending flash messages
    checkFlashMessages();

    // 2. Sidebar Toggle Button Action
    const sidebarToggle = document.getElementById('sidebarCollapse');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // 3. Inject Logged In Admin Details
    const session = Auth.getSession();
    const adminNameSpan = document.getElementById('admin-username-display');
    if (adminNameSpan && session) {
        adminNameSpan.innerText = session.username;
    }

    // 4. Determine Active Page and Execute View Controller
    const pathName = window.location.pathname;
    const pageName = pathName.substring(pathName.lastIndexOf('/') + 1);

    // Dynamic Route Handlers
    if (pageName === 'index.html' || pageName === '') {
        loadPublicCatalog();
    } else if (pageName === 'login.html') {
        loadLoginController();
    } else {
        // Guard all other routes
        Auth.guard();
        
        if (pageName === 'dashboard.html') {
            loadDashboard();
        } else if (pageName === 'manage_books.html') {
            loadManageBooks();
        } else if (pageName === 'add_book.html') {
            loadAddBook();
        } else if (pageName === 'students.html') {
            loadStudents();
        } else if (pageName === 'issue_book.html') {
            loadIssueBook();
        } else if (pageName === 'return_book.html') {
            loadReturnBook();
        }
    }
});

// --------------------------------------------------------
// CONTROLLER: public catalog (index.html)
// --------------------------------------------------------
function loadPublicCatalog() {
    const books = DB.get('books');
    const grid = document.getElementById('books-catalog-grid');
    const countBadge = document.getElementById('catalog-count');
    
    if (countBadge) {
        countBadge.innerText = `${books.length} Books Available`;
    }

    if (!grid) return;
    grid.innerHTML = '';

    if (books.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="text-muted">
                    <i class="fa-solid fa-book-open-reader fa-3x mb-3 text-indigo opacity-50"></i>
                    <h4>No Books Found</h4>
                    <p>We couldn't find any books in the database right now. Please check back later!</p>
                </div>
            </div>
        `;
        return;
    }

    books.forEach(book => {
        const isAvailable = book.available_qty > 0;
        const badgeClass = isAvailable ? 'bg-success' : 'bg-danger';
        const badgeText = isAvailable ? '<i class="fa-solid fa-check me-1"></i> Available' : '<i class="fa-solid fa-xmark me-1"></i> Out';
        
        const col = document.createElement('div');
        col.className = 'col book-catalog-card';
        col.innerHTML = `
            <div class="card h-100 store-card border-0 bg-transparent">
                <div class="card-img-wrapper position-relative overflow-hidden shadow-lg rounded-4 mb-3">
                    <img src="https://covers.openlibrary.org/b/isbn/${book.isbn}-L.jpg?default=false" 
                         onerror="this.onerror=null; this.src='https://placehold.co/400x600/4f46e5/ffffff?text=${encodeURIComponent(book.title.substring(0, 1))}';"
                         class="card-img-top book-cover w-100 object-fit-cover" alt="${book.title} Cover">
                    
                    <div class="card-img-overlay d-flex flex-column justify-content-between p-3 book-hover-overlay transition-all">
                        <div class="d-flex justify-content-end">
                            <span class="badge ${badgeClass} shadow-sm rounded-pill px-3 py-2">${badgeText}</span>
                        </div>
                        <div class="overlay-details text-white text-start">
                            <p class="small mb-1"><i class="fa-solid fa-barcode me-1"></i> <span class="card-isbn">${book.isbn}</span></p>
                            <p class="small mb-3"><i class="fa-solid fa-cubes me-1"></i> ${book.quantity} Total Copies</p>
                            <button class="btn btn-light rounded-pill fw-bold w-100 shadow-sm mt-auto text-indigo btn-hover-scale view-details-btn"
                                    data-title="${book.title}"
                                    data-author="${book.author}"
                                    data-isbn="${book.isbn}"
                                    data-category="${book.category}"
                                    data-quantity="${book.quantity}"
                                    data-available="${book.available_qty}"
                                    data-bs-toggle="modal"
                                    data-bs-target="#bookDetailsModal">View Details</button>
                        </div>
                    </div>
                </div>
                
                <div class="card-body p-0 text-center">
                    <span class="text-uppercase category-label text-indigo fw-bold small mb-2 d-inline-block px-2 py-1 bg-indigo-soft rounded-pill card-category">${book.category}</span>
                    <h5 class="card-title fw-bolder text-dark mb-1 text-truncate px-2" title="${book.title}">${book.title}</h5>
                    <p class="card-author text-muted small mb-0">${book.author}</p>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });

    // Client-Side Card Search
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
}

// --------------------------------------------------------
// CONTROLLER: admin login (login.html)
// --------------------------------------------------------
function loadLoginController() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (Auth.login(username, password)) {
            const session = Auth.getSession();
            localStorage.setItem('lms_flash_msg', JSON.stringify({
                type: 'success',
                message: `Welcome back, ${session.full_name}!`
            }));
            window.location.href = 'dashboard.html';
        } else {
            flash('error', 'Invalid username or password.');
        }
    });
}

// --------------------------------------------------------
// CONTROLLER: dashboard (dashboard.html)
// --------------------------------------------------------
function loadDashboard() {
    const books = DB.get('books');
    const students = DB.get('students');
    const transactions = DB.get('issued_books');
    const todayStr = getOffsetDateString(0);

    // Calculate dynamic stats
    const totalBooks = books.reduce((acc, b) => acc + parseInt(b.quantity), 0);
    const availBooks = books.reduce((acc, b) => acc + parseInt(b.available_qty), 0);
    const totalStudents = students.length;
    const activeIssues = transactions.filter(t => t.status === 'Issued').length;

    // Overdue counts & Total fines accumulated
    let overdueCount = 0;
    let totalFines = 0.00;

    transactions.forEach(t => {
        totalFines += parseFloat(t.fine_amount);
        if (t.status === 'Issued' && t.return_date < todayStr) {
            overdueCount++;
        }
    });

    // Populate UI elements
    document.getElementById('stat-total-books').innerText = totalBooks;
    document.getElementById('stat-available-books').innerText = availBooks;
    document.getElementById('stat-students').innerText = totalStudents;
    document.getElementById('stat-active-issues').innerText = activeIssues;
    document.getElementById('stat-overdue-fines').innerText = `Rs. ${totalFines.toFixed(2)}`;
    document.getElementById('stat-pending-returns').innerText = `${overdueCount} Books`;
    document.getElementById('today-date-val').innerText = formatDateString(todayStr);

    // Populate Recent Transactions Table (Limit 5)
    const recentTableBody = document.getElementById('recent-transactions-tbody');
    if (recentTableBody) {
        recentTableBody.innerHTML = '';
        const sortedTrans = [...transactions].sort((a, b) => b.id - a.id).slice(0, 5);

        if (sortedTrans.length === 0) {
            recentTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No recent transactions found.</td></tr>`;
            return;
        }

        sortedTrans.forEach(trans => {
            const book = books.find(b => b.id === trans.book_id) || { title: 'Unknown Book', isbn: '' };
            const student = students.find(s => s.id === trans.student_id) || { name: 'Unknown Student', student_id: '' };
            
            const isOverdue = (trans.status === 'Issued' && trans.return_date < todayStr);
            let statusBadge = '';
            if (trans.status === 'Returned') {
                statusBadge = '<span class="badge badge-returned">Returned</span>';
            } else if (isOverdue) {
                statusBadge = '<span class="badge badge-overdue">Overdue</span>';
            } else {
                statusBadge = '<span class="badge badge-issued">Issued</span>';
            }

            let actionCol = '';
            if (trans.status === 'Issued') {
                actionCol = `<a href="return_book.html" class="btn btn-sm btn-indigo"><i class="fa-solid fa-rotate-left me-1"></i> Return</a>`;
            } else {
                actionCol = `<span class="text-success small"><i class="fa-solid fa-check-double me-1"></i> Completed</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="fw-bold">${student.name}</div>
                    <small class="text-muted">${student.student_id}</small>
                </td>
                <td>
                    <div class="fw-medium">${book.title}</div>
                    <small class="text-muted">ISBN: ${book.isbn}</small>
                </td>
                <td>${formatDateString(trans.issue_date)}</td>
                <td>${formatDateString(trans.return_date)}</td>
                <td>${statusBadge}</td>
                <td>${actionCol}</td>
            `;
            recentTableBody.appendChild(tr);
        });
    }
}

// --------------------------------------------------------
// CONTROLLER: manage books (manage_books.html)
// --------------------------------------------------------
function loadManageBooks() {
    const books = DB.get('books');
    const tableBody = document.getElementById('books-table-tbody');
    if (!tableBody) return;

    renderBooksTable(books);

    // Search action
    const searchInput = document.querySelector('.table-search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const q = this.value.toLowerCase();
            const filtered = books.filter(b => 
                b.title.toLowerCase().includes(q) || 
                b.author.toLowerCase().includes(q) || 
                b.isbn.toLowerCase().includes(q) || 
                b.category.toLowerCase().includes(q)
            );
            renderBooksTable(filtered);
        });
    }

    // Modal Edit Binding
    const editBookModal = document.getElementById('editBookModal');
    if (editBookModal) {
        editBookModal.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const id = button.getAttribute('data-id');
            const title = button.getAttribute('data-title');
            const author = button.getAttribute('data-author');
            const isbn = button.getAttribute('data-isbn');
            const category = button.getAttribute('data-category');
            const quantity = button.getAttribute('data-quantity');

            document.getElementById('edit_book_id').value = id;
            document.getElementById('edit_title').value = title;
            document.getElementById('edit_author').value = author;
            document.getElementById('edit_isbn').value = isbn;
            document.getElementById('edit_category').value = category;
            document.getElementById('edit_quantity').value = quantity;
        });
    }

    // Edit Form Submission
    const editForm = editBookModal ? editBookModal.querySelector('form') : null;
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = parseInt(document.getElementById('edit_book_id').value);
            const title = document.getElementById('edit_title').value;
            const author = document.getElementById('edit_author').value;
            const category = document.getElementById('edit_category').value;
            const quantity = parseInt(document.getElementById('edit_quantity').value);

            const allBooks = DB.get('books');
            const bookIdx = allBooks.findIndex(b => b.id === id);
            
            if (bookIdx !== -1) {
                const book = allBooks[bookIdx];
                const issuedCopies = book.quantity - book.available_qty;

                if (quantity < issuedCopies) {
                    flash('error', `Cannot reduce total quantity of '${book.title}' below the number of active issued copies (${issuedCopies}).`);
                    bootstrap.Modal.getInstance(editBookModal).hide();
                    return;
                }

                book.title = title;
                book.author = author;
                book.category = category;
                book.quantity = quantity;
                book.available_qty = quantity - issuedCopies;

                allBooks[bookIdx] = book;
                DB.save('books', allBooks);

                flash('success', `'${title}' updated successfully.`);
                bootstrap.Modal.getInstance(editBookModal).hide();
                loadManageBooks();
            }
        });
    }
}

function renderBooksTable(booksList) {
    const tableBody = document.getElementById('books-table-tbody');
    tableBody.innerHTML = '';

    if (booksList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="fa-solid fa-face-frown fa-2x mb-2 text-indigo opacity-50"></i>
                    <div>No books found in the system catalog.</div>
                </td>
            </tr>
        `;
        return;
    }

    booksList.forEach(book => {
        const availBadge = book.available_qty > 0 
            ? `<span class="badge bg-success-subtle text-success border border-success-subtle">${book.available_qty} Available</span>`
            : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Out of Stock</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="fw-bold text-dark">${book.title}</div></td>
            <td>${book.author}</td>
            <td><code class="text-indigo">${book.isbn}</code></td>
            <td><span class="badge bg-light text-indigo border border-indigo-subtle">${book.category}</span></td>
            <td>${book.quantity}</td>
            <td>${availBadge}</td>
            <td class="text-end">
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-sm btn-outline-indigo edit-book-btn"
                            data-id="${book.id}"
                            data-title="${book.title}"
                            data-author="${book.author}"
                            data-isbn="${book.isbn}"
                            data-category="${book.category}"
                            data-quantity="${book.quantity}"
                            data-bs-toggle="modal"
                            data-bs-target="#editBookModal">
                        <i class="fa-solid fa-pen-to-square"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger confirm-delete"
                       onclick="deleteBook(${book.id}, '${escapeQuote(book.title)}')">
                        <i class="fa-solid fa-trash-can"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function deleteBook(id, title) {
    const confirmMsg = `Are you sure you want to delete '${title}'? All active issues of this book will be cancelled.`;
    if (confirm(confirmMsg)) {
        let books = DB.get('books');
        books = books.filter(b => b.id !== id);
        DB.save('books', books);

        // Cascade delete active transactions
        let transactions = DB.get('issued_books');
        transactions = transactions.filter(t => t.book_id !== id);
        DB.save('issued_books', transactions);

        flash('success', `'${title}' deleted successfully.`);
        loadManageBooks();
    }
}

function escapeQuote(str) {
    return str.replace(/'/g, "\\'");
}

// --------------------------------------------------------
// CONTROLLER: add book (add_book.html)
// --------------------------------------------------------
function loadAddBook() {
    const addForm = document.querySelector('form');
    if (!addForm) return;

    // Set dynamic default dates on form load
    const today = getOffsetDateString(0);
    const defaultDue = getOffsetDateString(14);
    
    const formElement = document.querySelector('form');
    formElement.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const author = document.getElementById('author').value;
        const isbn = document.getElementById('isbn').value;
        const category = document.getElementById('category').value;
        const quantity = parseInt(document.getElementById('quantity').value || 1);

        const books = DB.get('books');
        const existing = books.find(b => b.isbn.trim() === isbn.trim());
        if (existing) {
            flash('error', `Book with ISBN '${isbn}' already exists.`);
            return;
        }

        const newBook = {
            id: DB.nextId('books'),
            title: title,
            author: author,
            isbn: isbn,
            category: category,
            quantity: quantity,
            available_qty: quantity
        };

        books.push(newBook);
        DB.save('books', books);

        localStorage.setItem('lms_flash_msg', JSON.stringify({
            type: 'success',
            message: `'${title}' added successfully!`
        }));
        window.location.href = 'manage_books.html';
    });
}

// --------------------------------------------------------
// CONTROLLER: manage students (students.html)
// --------------------------------------------------------
function loadStudents() {
    const students = DB.get('students');
    renderStudentsTable(students);

    // Search filter
    const searchInput = document.querySelector('.table-search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const q = this.value.toLowerCase();
            const filtered = students.filter(s => 
                s.name.toLowerCase().includes(q) || 
                s.student_id.toLowerCase().includes(q) || 
                s.email.toLowerCase().includes(q) || 
                s.department.toLowerCase().includes(q)
            );
            renderStudentsTable(filtered);
        });
    }

    // Modal Edit Binding
    const editStudentModal = document.getElementById('editStudentModal');
    if (editStudentModal) {
        editStudentModal.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const id = button.getAttribute('data-id');
            const sid = button.getAttribute('data-sid');
            const name = button.getAttribute('data-name');
            const email = button.getAttribute('data-email');
            const phone = button.getAttribute('data-phone');
            const dept = button.getAttribute('data-dept');

            document.getElementById('edit_id').value = id;
            document.getElementById('edit_student_id').value = sid;
            document.getElementById('edit_name').value = name;
            document.getElementById('edit_email').value = email;
            document.getElementById('edit_phone').value = phone;
            document.getElementById('edit_department').value = dept;
        });
    }

    // Registration Form Submission (Add Student Modal)
    const addStudentModal = document.getElementById('addStudentModal');
    const registerForm = addStudentModal ? addStudentModal.querySelector('form') : null;
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const sid = document.getElementById('student_id').value;
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const dept = document.getElementById('department').value;

            const allStudents = DB.get('students');
            
            // Check uniqueness of Student ID & Email
            if (allStudents.find(s => s.student_id.trim() === sid.trim())) {
                flash('error', `Student ID '${sid}' is already registered.`);
                bootstrap.Modal.getInstance(addStudentModal).hide();
                return;
            }
            if (allStudents.find(s => s.email.toLowerCase().trim() === email.toLowerCase().trim())) {
                flash('error', `Email '${email}' is already in use.`);
                bootstrap.Modal.getInstance(addStudentModal).hide();
                return;
            }

            const newStudent = {
                id: DB.nextId('students'),
                student_id: sid,
                name: name,
                email: email,
                phone: phone,
                department: dept
            };

            allStudents.push(newStudent);
            DB.save('students', allStudents);

            flash('success', `Student '${name}' registered successfully!`);
            bootstrap.Modal.getInstance(addStudentModal).hide();
            registerForm.reset();
            loadStudents();
        });
    }

    // Edit Form Submission
    const editForm = editStudentModal ? editStudentModal.querySelector('form') : null;
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const id = parseInt(document.getElementById('edit_id').value);
            const name = document.getElementById('edit_name').value;
            const email = document.getElementById('edit_email').value;
            const phone = document.getElementById('edit_phone').value;
            const dept = document.getElementById('edit_department').value;

            const allStudents = DB.get('students');
            const index = allStudents.findIndex(s => s.id === id);

            if (index !== -1) {
                // Unique email check (excluding current self)
                const emailConflict = allStudents.find(s => s.email.toLowerCase().trim() === email.toLowerCase().trim() && s.id !== id);
                if (emailConflict) {
                    flash('error', "This email address is already registered to another student.");
                    bootstrap.Modal.getInstance(editStudentModal).hide();
                    return;
                }

                allStudents[index].name = name;
                allStudents[index].email = email;
                allStudents[index].phone = phone;
                allStudents[index].department = dept;

                DB.save('students', allStudents);
                flash('success', `Student profile for '${name}' updated.`);
                bootstrap.Modal.getInstance(editStudentModal).hide();
                loadStudents();
            }
        });
    }
}

function renderStudentsTable(studentsList) {
    const tableBody = document.getElementById('students-table-tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (studentsList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="fa-solid fa-users-slash fa-2x mb-2 text-indigo opacity-50"></i>
                    <div>No registered students found.</div>
                </td>
            </tr>
        `;
        return;
    }

    studentsList.forEach(student => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge bg-indigo-subtle text-indigo p-2" style="background-color: #e0e7ff; color: #4f46e5;">${student.student_id}</span></td>
            <td><div class="fw-bold text-dark">${student.name}</div></td>
            <td>${student.email}</td>
            <td>${student.phone}</td>
            <td>${student.department}</td>
            <td class="text-end">
                <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-sm btn-outline-indigo edit-student-btn"
                            data-id="${student.id}"
                            data-sid="${student.student_id}"
                            data-name="${student.name}"
                            data-email="${student.email}"
                            data-phone="${student.phone}"
                            data-dept="${student.department}"
                            data-bs-toggle="modal"
                            data-bs-target="#editStudentModal">
                        <i class="fa-solid fa-user-pen"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" 
                       onclick="deleteStudent(${student.id}, '${escapeQuote(student.name)}')">
                        <i class="fa-solid fa-trash-can"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function deleteStudent(id, name) {
    const confirmMsg = `Are you sure you want to delete student '${name}'? All active issues under this student will be deleted.`;
    if (confirm(confirmMsg)) {
        let students = DB.get('students');
        students = students.filter(s => s.id !== id);
        DB.save('students', students);

        // Cascade delete issued records
        let transactions = DB.get('issued_books');
        transactions = transactions.filter(t => t.student_id !== id);
        DB.save('issued_books', transactions);

        flash('success', `Student record deleted successfully.`);
        loadStudents();
    }
}

// --------------------------------------------------------
// CONTROLLER: issue book (issue_book.html)
// --------------------------------------------------------
function loadIssueBook() {
    const books = DB.get('books');
    const students = DB.get('students');

    const bookSelect = document.getElementById('book_id');
    const studentSelect = document.getElementById('student_id');

    if (bookSelect) {
        bookSelect.innerHTML = '<option value="" disabled selected>Search & Select Book...</option>';
        const availableBooks = books.filter(b => b.available_qty > 0);
        
        availableBooks.forEach(b => {
            bookSelect.innerHTML += `<option value="${b.id}">${b.title} by ${b.author} (ISBN: ${b.isbn}) [Avail: ${b.available_qty}]</option>`;
        });
        if (availableBooks.length === 0) {
            bookSelect.innerHTML = '<option disabled>No books available to issue</option>';
        }
    }

    if (studentSelect) {
        studentSelect.innerHTML = '<option value="" disabled selected>Search & Select Student...</option>';
        students.forEach(s => {
            studentSelect.innerHTML += `<option value="${s.id}">[${s.student_id}] ${s.name} (${s.department})</option>`;
        });
        if (students.length === 0) {
            studentSelect.innerHTML = '<option disabled>No students registered in directory</option>';
        }
    }

    // Default dates
    document.getElementById('issue_date').value = getOffsetDateString(0);
    document.getElementById('return_date').value = getOffsetDateString(14);

    const issueForm = document.querySelector('form');
    if (issueForm) {
        issueForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const bookId = parseInt(document.getElementById('book_id').value);
            const studentId = parseInt(document.getElementById('student_id').value);
            const issueDate = document.getElementById('issue_date').value;
            const returnDate = document.getElementById('return_date').value;

            // Re-verify stocks
            const allBooks = DB.get('books');
            const bookIdx = allBooks.findIndex(b => b.id === bookId);
            if (bookIdx === -1 || allBooks[bookIdx].available_qty <= 0) {
                flash('error', 'Error: Selected book is currently out of stock.');
                return;
            }

            const allStudents = DB.get('students');
            const student = allStudents.find(s => s.id === studentId);
            if (!student) {
                flash('error', 'Error: Selected student record does not exist.');
                return;
            }

            // Record transaction
            const transactions = DB.get('issued_books');
            const newIssue = {
                id: DB.nextId('issued_books'),
                book_id: bookId,
                student_id: studentId,
                issue_date: issueDate,
                return_date: returnDate,
                actual_return_date: null,
                fine_amount: 0.00,
                status: 'Issued'
            };
            transactions.push(newIssue);
            DB.save('issued_books', transactions);

            // Decrement stock
            allBooks[bookIdx].available_qty -= 1;
            DB.save('books', allBooks);

            localStorage.setItem('lms_flash_msg', JSON.stringify({
                type: 'success',
                message: `Book '${allBooks[bookIdx].title}' successfully issued to ${student.name}!`
            }));
            window.location.href = 'dashboard.html';
        });
    }
}

// --------------------------------------------------------
// CONTROLLER: return book (return_book.html)
// --------------------------------------------------------
function loadReturnBook() {
    const transactions = DB.get('issued_books');
    const books = DB.get('books');
    const students = DB.get('students');
    const todayStr = getOffsetDateString(0);

    const activeIssues = transactions.filter(t => t.status === 'Issued');
    renderActiveIssues(activeIssues, books, students, todayStr);

    // Search filter
    const searchInput = document.querySelector('.table-search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const q = this.value.toLowerCase();
            const filtered = activeIssues.filter(t => {
                const b = books.find(book => book.id === t.book_id) || {};
                const s = students.find(stud => stud.id === t.student_id) || {};
                return (
                    (s.name && s.name.toLowerCase().includes(q)) || 
                    (s.student_id && s.student_id.toLowerCase().includes(q)) ||
                    (b.title && b.title.toLowerCase().includes(q)) ||
                    (b.isbn && b.isbn.toLowerCase().includes(q))
                );
            });
            renderActiveIssues(filtered, books, students, todayStr);
        });
    }

    // Modal Process Return Bindings
    const returnBookModal = document.getElementById('returnBookModal');
    if (returnBookModal) {
        returnBookModal.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const issueId = button.getAttribute('data-issue-id');
            const student = button.getAttribute('data-student');
            const book = button.getAttribute('data-book');
            const dueDateStr = button.getAttribute('data-due-date');

            document.getElementById('return_issue_id').value = issueId;
            document.getElementById('return_student_name').innerText = student;
            document.getElementById('return_book_title').innerText = book;
            document.getElementById('due_date_val').innerText = dueDateStr;

            // Set today's date in actual_return_date picker
            const returnDatePicker = document.getElementById('actual_return_date');
            returnDatePicker.value = todayStr;

            // Trigger change calculation
            calculateFine(returnDatePicker, dueDateStr);
        });

        // Add return date listener for real-time fine adjustments
        const returnDatePicker = document.getElementById('actual_return_date');
        if (returnDatePicker) {
            returnDatePicker.addEventListener('change', function() {
                const dueDateStr = document.getElementById('due_date_val').innerText;
                calculateFine(this, dueDateStr);
            });
        }
    }

    // Return Form Submission
    const returnForm = returnBookModal ? returnBookModal.querySelector('form') : null;
    if (returnForm) {
        returnForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const issueId = parseInt(document.getElementById('return_issue_id').value);
            const actualReturnDate = document.getElementById('actual_return_date').value;
            const fineAmount = parseFloat(document.getElementById('fine_amount_hidden').value || 0.00);

            const allTransactions = DB.get('issued_books');
            const transIdx = allTransactions.findIndex(t => t.id === issueId);

            if (transIdx !== -1) {
                const trans = allTransactions[transIdx];
                if (trans.status === 'Returned') {
                    flash('info', 'This transaction has already been completed.');
                    bootstrap.Modal.getInstance(returnBookModal).hide();
                    return;
                }

                // Update transaction status
                trans.actual_return_date = actualReturnDate;
                trans.fine_amount = fineAmount;
                trans.status = 'Returned';
                allTransactions[transIdx] = trans;
                DB.save('issued_books', allTransactions);

                // Increment Book Stock back
                const allBooks = DB.get('books');
                const bookIdx = allBooks.findIndex(b => b.id === trans.book_id);
                if (bookIdx !== -1) {
                    allBooks[bookIdx].available_qty += 1;
                    DB.save('books', allBooks);
                }

                flash('success', 'Book successfully returned and catalog stock updated.');
                bootstrap.Modal.getInstance(returnBookModal).hide();
                loadReturnBook();
            }
        });
    }
}

function calculateFine(pickerElement, dueDateStr) {
    const actualReturnDate = new Date(pickerElement.value);
    const dueDate = new Date(dueDateStr);
    const fineOutput = document.getElementById('calculated_fine_val');
    const fineInputHidden = document.getElementById('fine_amount_hidden');

    if (actualReturnDate > dueDate) {
        const diffTime = Math.abs(actualReturnDate - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const finePerDay = 10.00; // Rs. 10 per day fine
        const totalFine = diffDays * finePerDay;
        
        if (fineOutput) fineOutput.innerText = `Rs. ${totalFine.toFixed(2)}`;
        if (fineInputHidden) fineInputHidden.value = totalFine.toFixed(2);
    } else {
        if (fineOutput) fineOutput.innerText = 'Rs. 0.00';
        if (fineInputHidden) fineInputHidden.value = '0.00';
    }
}

function renderActiveIssues(activeList, books, students, todayStr) {
    const tableBody = document.getElementById('issued-books-tbody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (activeList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4 text-muted">
                    <i class="fa-solid fa-check-double fa-2x mb-2 text-indigo opacity-50"></i>
                    <div>All issued books are returned! No pending records.</div>
                </td>
            </tr>
        `;
        return;
    }

    activeList.forEach(issue => {
        const book = books.find(b => b.id === issue.book_id) || { title: 'Unknown Book', isbn: '' };
        const student = students.find(s => s.id === issue.student_id) || { name: 'Unknown Student', student_id: '' };
        
        const isOverdue = issue.return_date < todayStr;
        let fineStatus = '';
        if (isOverdue) {
            const daysOverdue = calculateDaysDiff(issue.return_date, todayStr);
            const accumulatedFine = daysOverdue * 10.00;
            fineStatus = `<span class="badge badge-overdue"><i class="fa-solid fa-circle-exclamation me-1"></i> Overdue (Rs. ${accumulatedFine.toFixed(2)})</span>`;
        } else {
            fineStatus = `<span class="badge badge-issued"><i class="fa-solid fa-clock me-1"></i> Normal</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="fw-bold text-dark">${student.name}</div>
                <span class="badge bg-light text-muted border">${student.student_id}</span>
            </td>
            <td>
                <div class="fw-medium text-dark">${book.title}</div>
                <small class="text-muted">ISBN: ${book.isbn}</small>
            </td>
            <td>${formatDateString(issue.issue_date)}</td>
            <td>${formatDateString(issue.return_date)}</td>
            <td>${fineStatus}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-indigo return-btn"
                        data-issue-id="${issue.id}"
                        data-student="${student.name} (${student.student_id})"
                        data-book="${book.title} (ISBN: ${book.isbn})"
                        data-due-date="${issue.return_date}"
                        data-bs-toggle="modal"
                        data-bs-target="#returnBookModal">
                    <i class="fa-solid fa-arrow-turn-down-left me-1"></i> Process Return
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}
