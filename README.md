# Library Management System (Libraria)

A complete, responsive, full-stack Library Management System built with Python Flask, MySQL, Bootstrap 5, and JavaScript. This project is designed to be highly professional, modern, and beginner-friendly.

---

## 📂 Project Folder Structure

```text
Library-Management-System/
│
├── app.py                  # Main Flask application (routes, logic, auth, transaction controls)
├── requirements.txt        # Python dependency packages list
├── library.sql             # MySQL schema and pre-populated sample database tables
├── README.md               # Setup and user documentation guide
│
├── database/
│   └── db_config.py        # MySQL database connection helper using PyMySQL
│
├── static/
│   ├── css/
│   │   └── style.css       # Custom modern stylesheet (slate/indigo colors, dashboard elements)
│   ├── js/
│   │   └── script.js       # Client-side helpers (alerts timer, dynamic search, return fine calculator)
│   └── images/             # Folder for assets (e.g., logo, cover images)
│
└── templates/
    ├── index.html          # Public Landing Page (Book catalog directory with search)
    ├── login.html          # Admin Login Page (Secure credentials panel)
    ├── dashboard.html      # Administrative Dashboard (Metric cards, recent activity overview)
    ├── add_book.html       # Add Book Form (Metadata inputs & validation)
    ├── manage_books.html   # Manage Books Directory (Interactive table with edit/delete modals)
    ├── students.html       # Student Directory (Single-page add/edit/delete student operations)
    ├── issue_book.html     # Issue Book Page (Selection form with auto dates)
    └── return_book.html    # Return Book Directory (Pending transactions table with dynamic fine modal)
```

---

## ⚡ Tech Stack

* **Frontend**: HTML5, Vanilla CSS3 (custom styles), Bootstrap 5 (CSS & JS components), Font Awesome 6 (Icons).
* **Backend**: Python 3, Flask.
* **Database**: MySQL.
* **DB Connection Interface**: PyMySQL (Pure Python MySQL client).

---

## 🛠️ Step-by-Step Setup Guide

Follow these steps to set up and run the project locally on your Windows system:

### 1. Prerequisites
Ensure you have the following installed:
* **Python 3** (Verify by running `python --version` in terminal)
* **MySQL Server** (via XAMPP, WampServer, or stand-alone MySQL Community Server)

---

### 2. Database Setup

1. Open your MySQL client (e.g., **phpMyAdmin**, **MySQL Workbench**, or **MySQL Command Line Client**).
2. Run the following command to create the database:
   ```sql
   CREATE DATABASE library_db;
   ```
3. Import the database schema and sample data:
   * **Using phpMyAdmin**: Go to phpMyAdmin, select `library_db`, click on the **Import** tab, choose the `library.sql` file from this project folder, and click **Go**.
   * **Using MySQL Command Line**: Run:
     ```bash
     mysql -u root -p library_db < library.sql
     ```

*Note: If your MySQL password is not blank, edit the database configuration in `database/db_config.py`:*
```python
DB_PASSWORD = 'your_mysql_password_here'
```

---

### 3. Application Installation

1. Navigate to the project directory:
   ```powershell
   cd Library-Management-System
   ```
2. Create a virtual environment (recommended):
   ```powershell
   python -m venv venv
   ```
3. Activate the virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Windows (Command Prompt)**:
     ```cmd
     .\venv\Scripts\activate.bat
     ```
4. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

---

### 4. Running the Application

1. While in the virtual environment, start the Flask development server:
   ```powershell
   python app.py
   ```
2. Open your web browser and navigate to:
   * **Public Catalog**: `http://127.0.0.1:5000/`
   * **Admin Login**: `http://127.0.0.1:5000/login`

---

## 🔐 Default Admin Account
Use these credentials to log in to the administrator portal:
* **Username**: `admin`
* **Password**: `admin123`

---

## ✨ Features Implemented

1. **Public Book Catalog**: Guest view featuring real-time client-side listing, searching, filtering, and live "Available/Out of Stock" labels.
2. **Secure Admin Authentication**: Section-guarded backend routing via `@login_required` decorators and securely encrypted sessions.
3. **Responsive Slate Dashboard**: Clean metric cards showing total books, active issues, registered students, overdue books, and total fine amounts. Shows a feed of the 5 most recent activities.
4. **Interactive Manage Screens**: Modals for editing books and student records inline without page refreshes, reducing layout fatigue.
5. **Robust Quantity Management**: Intelligently blocks reducing book copies below the count of currently active student borrowings to prevent negative values.
6. **Due Date Tracking**: Highlights overdue list items clearly.
7. **Dynamic Fine Calculator**: Automatically calculates student fees at a rate of **Rs. 10.00/day** directly in the return modal when picking return dates.
8. **Responsive UI**: Fully mobile-responsive layouts adapting gracefully across tablets, laptops, and mobile screens.
