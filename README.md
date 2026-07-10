# Library Management System (Libraria)

A complete, responsive, client-side Library Management System built with HTML5, Vanilla CSS3 (custom styles), Bootstrap 5, and JavaScript. This project is configured to run entirely in the browser using `localStorage` for database persistence, making it 100% compatible with static hosting platforms like **Netlify** or **GitHub Pages**.

---

## 📂 Project Folder Structure

```text
Library-Management-System/
│
├── index.html              # Public Landing Page (Book catalog directory with live search)
├── login.html              # Admin Login Page (Secure credentials panel)
├── dashboard.html          # Administrative Dashboard (Metric cards, recent transaction history)
├── add_book.html           # Add Book Form (Metadata inputs & validation)
├── manage_books.html       # Manage Books Directory (Interactive table, Edit modal, CSV Export)
├── students.html           # Student Directory (Single-page add/edit/delete, CSV Export)
├── issue_book.html         # Issue Book Page (Selection form with stock checks)
├── return_book.html        # Return Book Directory (Pending transactions table, dynamic fine modal, CSV Export)
├── rprosite.html           # GitHub Profile Report page (Dynamic contribution calendar timeline)
├── README.md               # Setup and user documentation guide
│
└── static/
    ├── css/
    │   ├── style.css       # Custom modern stylesheet (slate/indigo colors, dashboard elements)
    │   └── rprosite.css    # Custom styles for the GitHub Profile Report page
    └── js/
        └── script.js       # Client-side core engine (localStorage DB, CRUD operations, CSV Export)
```

---

## ⚡ Tech Stack

* **Frontend**: HTML5, Vanilla CSS3 (custom styles), Bootstrap 5 (CSS & JS components), Font Awesome 6 (Icons).
* **Database & Auth**: HTML5 `localStorage` & `sessionStorage`.
* **Data Portability**: JavaScript CSV Export.

---

## 🛠️ Step-by-Step Setup & Netlify Deployment Guide

### Running Locally

Since this is a client-side application, you can run it immediately without setting up databases or starting local backend servers:

1. Double-click `index.html` to open the public book catalog directly in your browser.
2. Alternatively, you can serve the directory using a simple local web server (like Live Server in VS Code, or python's `http.server`):
   ```powershell
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000/`.

### Deploying to Netlify

To deploy your Library Management System to Netlify:

1. Log in to your [Netlify Dashboard](https://app.netlify.com/).
2. Choose **Add new site** > **Deploy manually** (or connect your GitHub repository).
3. Drag and drop the entire project folder (excluding `venv` or `.git`) into the Netlify drop zone.
4. Your site will build instantly and will be ready to visit at a custom `.netlify.app` URL!

---

## 🔐 Default Admin Account

Use these credentials to log in to the administrator portal:
* **Username**: `admin`
* **Password**: `admin123`

---

## ✨ Features Implemented

1. **Public Book Catalog**: Guest view featuring real-time client-side listing, searching, filtering, and live "Available/Out of Stock" labels.
2. **Secure Admin Authentication**: Simulated browser sessions guard administrative routing. Direct page access redirects users back to `login.html`.
3. **Database Seeding**: The system auto-seeds standard books (including custom requested titles: *The 48 Laws of Power*, *Discipline Is Destiny*, *Life is Love*, *Love Means What*), default student listings, and transaction history on first load.
4. **Interactive Manage Screens**: Modals for editing books and student records inline without page refreshes, reducing layout fatigue.
5. **Data Portability (CSV Export)**: Allows downloading system logs as spreadsheets:
   - **Books Catalog**: Export list of books from `manage_books.html`.
   - **Student Directory**: Export registered students from `students.html`.
   - **Transactions log**: Export transaction records from `return_book.html`.
6. **Due Date Tracking**: Highlights overdue list items clearly.
7. **Dynamic Fine Calculator**: Automatically calculates student fees at a rate of **Rs. 10.00/day** directly in the return modal when picking return dates.
8. **Responsive UI**: Fully mobile-responsive layouts adapting gracefully across tablets, laptops, and mobile screens.
