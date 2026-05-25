import os
from datetime import datetime, date, timedelta
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, flash

# Import DB config
from database.db_config import get_db_connection

app = Flask(__name__)
app.secret_key = os.urandom(24)  # Secure random key for session encryption

# --------------------------------------------------------
# SECURITY DECORATOR
# --------------------------------------------------------
def login_required(f):
    """
    Decorator to ensure that pages are only accessible to logged-in admins.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            flash("Unauthorized access. Please login first.", "error")
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

# --------------------------------------------------------
# PUBLIC ROUTES
# --------------------------------------------------------

@app.route('/')
def index():
    """
    Landing page: Displays the library catalog with book search capability.
    """
    conn = get_db_connection()
    if not conn:
        flash("Could not connect to the database. Please check configuration.", "error")
        return render_template('index.html', books=[])
    
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM books ORDER BY title ASC")
            books = cursor.fetchall()
        return render_template('index.html', books=books)
    except Exception as e:
        print(f"Error fetching catalog: {e}")
        flash("Failed to fetch books.", "error")
        return render_template('index.html', books=[])
    finally:
        conn.close()

@app.route('/login', methods=['GET', 'POST'])
def login():
    """
    Admin authentication route.
    """
    if session.get('logged_in'):
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        conn = get_db_connection()
        if not conn:
            flash("Database connection error.", "error")
            return render_template('login.html')

        try:
            from werkzeug.security import check_password_hash
            
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM admins WHERE username = %s", (username,))
                admin = cursor.fetchone()
                
                if admin and check_password_hash(admin['password'], password):
                    session['logged_in'] = True
                    session['admin_id'] = admin['id']
                    session['username'] = admin['username']
                    session['full_name'] = admin['full_name']
                    
                    flash(f"Welcome back, {admin['full_name']}!", "success")
                    return redirect(url_for('dashboard'))
                else:
                    flash("Invalid username or password.", "error")
        except Exception as e:
            print(f"Login error: {e}")
            flash("An error occurred during authentication.", "error")
        finally:
            conn.close()

    return render_template('login.html')

@app.route('/logout')
def logout():
    """
    Logs out the admin and clears the session.
    """
    session.clear()
    flash("You have been successfully logged out.", "success")
    return redirect(url_for('login'))

@app.route('/rprosite')
def rprosite():
    """
    GitHub Profile and Contributions Activity Page (rprosite)
    """
    from database.github_data import PROFILE_DATA, get_contribution_calendar, ACTIVITIES_2026
    calendar_days = get_contribution_calendar()
    
    # Calculate timeframe summary (May 1 to May 22, 2026)
    timeframe_contribs = 0
    for day in calendar_days:
        if day['date'].startswith("2026-05"):
            d = int(day['date'].split("-")[2])
            if 1 <= d <= 22:
                timeframe_contribs += day['count']
                
    # Calculate 2026 total contributions
    total_2026_contribs = sum(day['count'] for day in calendar_days)
    
    return render_template(
        'rprosite.html',
        profile=PROFILE_DATA,
        calendar_days=calendar_days,
        activities=ACTIVITIES_2026,
        timeframe_contribs=timeframe_contribs,
        total_2026_contribs=total_2026_contribs
    )

# --------------------------------------------------------
# ADMIN ROUTE: DASHBOARD
# --------------------------------------------------------

@app.route('/dashboard')
@login_required
def dashboard():
    """
    Main admin dashboard showing statistics and recent transaction activity.
    """
    conn = get_db_connection()
    if not conn:
        flash("Database connection offline.", "error")
        return redirect(url_for('login'))

    stats = {
        'total_books': 0,
        'available_books': 0,
        'total_students': 0,
        'issued_books': 0,
        'overdue_count': 0,
        'total_fines': 0.00
    }
    recent_transactions = []
    today = date.today()

    try:
        with conn.cursor() as cursor:
            # 1. Total books count
            cursor.execute("SELECT SUM(quantity) as total FROM books")
            res = cursor.fetchone()
            stats['total_books'] = res['total'] if res and res['total'] else 0

            # 2. Available books count
            cursor.execute("SELECT SUM(available_qty) as avail FROM books")
            res = cursor.fetchone()
            stats['available_books'] = res['avail'] if res and res['avail'] else 0

            # 3. Total students count
            cursor.execute("SELECT COUNT(*) as total FROM students")
            res = cursor.fetchone()
            stats['total_students'] = res['total'] if res else 0

            # 4. Active issues count (status = Issued)
            cursor.execute("SELECT COUNT(*) as total FROM issued_books WHERE status = 'Issued'")
            res = cursor.fetchone()
            stats['issued_books'] = res['total'] if res else 0

            # 5. Overdue issues count (due date in past and still issued)
            cursor.execute("SELECT COUNT(*) as total FROM issued_books WHERE status = 'Issued' AND return_date < %s", (today,))
            res = cursor.fetchone()
            stats['overdue_count'] = res['total'] if res else 0

            # 6. Total fines collected
            cursor.execute("SELECT SUM(fine_amount) as total FROM issued_books")
            res = cursor.fetchone()
            stats['total_fines'] = f"{res['total']:.2f}" if res and res['total'] is not None else "0.00"

            # 7. Recent transactions joined query (limit 5)
            query = """
                SELECT ib.id, ib.issue_date, ib.return_date, ib.status, ib.fine_amount,
                       b.title as book_title, b.isbn,
                       s.name as student_name, s.student_id as student_id_val
                FROM issued_books ib
                JOIN books b ON ib.book_id = b.id
                JOIN students s ON ib.student_id = s.id
                ORDER BY ib.id DESC LIMIT 5
            """
            cursor.execute(query)
            transactions = cursor.fetchall()
            
            # Map overdue check dynamically
            for t in transactions:
                # Dates from database might be date objects or string parsed
                due = t['return_date']
                if isinstance(due, str):
                    due = datetime.strptime(due, '%Y-%m-%d').date()
                
                t['is_overdue'] = (t['status'] == 'Issued' and due < today)
                recent_transactions.append(t)

        return render_template(
            'dashboard.html', 
            stats=stats, 
            recent_transactions=recent_transactions,
            today_date=today.strftime('%d-%b-%Y')
        )
    except Exception as e:
        print(f"Dashboard query error: {e}")
        flash("Failed to retrieve statistics.", "error")
        return redirect(url_for('login'))
    finally:
        conn.close()

# --------------------------------------------------------
# ADMIN ROUTE: BOOK MANAGEMENT
# --------------------------------------------------------

@app.route('/manage-books')
@login_required
def manage_books():
    """
    Renders books directory table.
    """
    conn = get_db_connection()
    if not conn:
        return "Database Connection Failed"
    
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM books ORDER BY id DESC")
            books = cursor.fetchall()
        return render_template('manage_books.html', books=books)
    except Exception as e:
        print(f"Error: {e}")
        flash("Failed to fetch books list.", "error")
        return render_template('manage_books.html', books=[])
    finally:
        conn.close()

@app.route('/add-book', methods=['GET', 'POST'])
@login_required
def add_book():
    """
    Form view & insertion handler for introducing new books.
    """
    if request.method == 'POST':
        title = request.form.get('title')
        author = request.form.get('author')
        isbn = request.form.get('isbn')
        category = request.form.get('category')
        quantity = int(request.form.get('quantity', 1))

        conn = get_db_connection()
        if not conn:
            flash("Database connection offline.", "error")
            return redirect(url_for('add_book'))

        try:
            with conn.cursor() as cursor:
                # Verify unique ISBN
                cursor.execute("SELECT id FROM books WHERE isbn = %s", (isbn,))
                existing = cursor.fetchone()
                if existing:
                    flash(f"Book with ISBN '{isbn}' already exists.", "error")
                    return redirect(url_for('add_book'))

                # Insert book
                cursor.execute(
                    "INSERT INTO books (title, author, isbn, category, quantity, available_qty) VALUES (%s, %s, %s, %s, %s, %s)",
                    (title, author, isbn, category, quantity, quantity)
                )
            flash(f"'{title}' added successfully!", "success")
            return redirect(url_for('manage_books'))
        except Exception as e:
            print(f"Database insertion error: {e}")
            flash("Failed to add book. Internal error.", "error")
        finally:
            conn.close()

    # Pre-populate helper dates
    today = date.today()
    due_default = today + timedelta(days=14)
    return render_template('add_book.html', today_date=today.isoformat(), due_date_default=due_default.isoformat())

@app.route('/edit-book', methods=['POST'])
@login_required
def edit_book():
    """
    Updates general metadata of a book. Handles quantity updates safely.
    """
    book_id = request.form.get('book_id')
    title = request.form.get('title')
    author = request.form.get('author')
    category = request.form.get('category')
    new_qty = int(request.form.get('quantity', 1))

    conn = get_db_connection()
    if not conn:
        flash("Database connection error.", "error")
        return redirect(url_for('manage_books'))

    try:
        with conn.cursor() as cursor:
            # Get current quantity details
            cursor.execute("SELECT quantity, available_qty, title FROM books WHERE id = %s", (book_id,))
            book = cursor.fetchone()
            if not book:
                flash("Book not found.", "error")
                return redirect(url_for('manage_books'))

            # Calculate active issued count (Total copies - Available copies)
            issued_copies = book['quantity'] - book['available_qty']

            # Make sure we don't reduce total quantity below what is currently in hand of students
            if new_qty < issued_copies:
                flash(f"Cannot reduce total quantity of '{book['title']}' below the number of currently active issued copies ({issued_copies}).", "error")
                return redirect(url_for('manage_books'))

            # Update book quantity and adjust available_qty accordingly
            new_available = new_qty - issued_copies
            cursor.execute(
                "UPDATE books SET title = %s, author = %s, category = %s, quantity = %s, available_qty = %s WHERE id = %s",
                (title, author, category, new_qty, new_available, book_id)
            )
            flash(f"'{title}' updated successfully.", "success")
    except Exception as e:
        print(f"Error modifying book: {e}")
        flash("Failed to update book.", "error")
    finally:
        conn.close()

    return redirect(url_for('manage_books'))

@app.route('/delete-book/<int:book_id>')
@login_required
def delete_book(book_id):
    """
    Permanently deletes a book record. (Foreign keys cascade to issued records).
    """
    conn = get_db_connection()
    if not conn:
        flash("Database connection offline.", "error")
        return redirect(url_for('manage_books'))

    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM books WHERE id = %s", (book_id,))
            flash("Book deleted successfully.", "success")
    except Exception as e:
        print(f"Error deleting book: {e}")
        flash("Failed to delete book.", "error")
    finally:
        conn.close()

    return redirect(url_for('manage_books'))

# --------------------------------------------------------
# ADMIN ROUTE: STUDENT MANAGEMENT
# --------------------------------------------------------

@app.route('/students')
@login_required
def students():
    """
    Renders students database directory.
    """
    conn = get_db_connection()
    if not conn:
        return "Database Connection Failed"
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM students ORDER BY id DESC")
            students_list = cursor.fetchall()
        return render_template('students.html', students=students_list)
    except Exception as e:
        print(f"Error fetching students: {e}")
        flash("Failed to load student catalog.", "error")
        return render_template('students.html', students=[])
    finally:
        conn.close()

@app.route('/add-student', methods=['POST'])
@login_required
def add_student():
    """
    Registers a new student profile.
    """
    student_id = request.form.get('student_id')
    name = request.form.get('name')
    email = request.form.get('email')
    phone = request.form.get('phone')
    department = request.form.get('department')

    conn = get_db_connection()
    if not conn:
        flash("Database offline.", "error")
        return redirect(url_for('students'))

    try:
        with conn.cursor() as cursor:
            # Check unique Student ID
            cursor.execute("SELECT id FROM students WHERE student_id = %s", (student_id,))
            if cursor.fetchone():
                flash(f"Student ID '{student_id}' is already registered.", "error")
                return redirect(url_for('students'))

            # Check unique Email
            cursor.execute("SELECT id FROM students WHERE email = %s", (email,))
            if cursor.fetchone():
                flash(f"Email '{email}' is already in use by another student.", "error")
                return redirect(url_for('students'))

            cursor.execute(
                "INSERT INTO students (student_id, name, email, phone, department) VALUES (%s, %s, %s, %s, %s)",
                (student_id, name, email, phone, department)
            )
            flash(f"Student '{name}' registered successfully!", "success")
    except Exception as e:
        print(f"Error registering student: {e}")
        flash("Failed to register student.", "error")
    finally:
        conn.close()

    return redirect(url_for('students'))

@app.route('/edit-student', methods=['POST'])
@login_required
def edit_student():
    """
    Updates student demographics details.
    """
    id_val = request.form.get('id')
    name = request.form.get('name')
    email = request.form.get('email')
    phone = request.form.get('phone')
    department = request.form.get('department')

    conn = get_db_connection()
    if not conn:
        flash("Database connection failure.", "error")
        return redirect(url_for('students'))

    try:
        with conn.cursor() as cursor:
            # Check if email is taken by another student
            cursor.execute("SELECT id FROM students WHERE email = %s AND id != %s", (email, id_val))
            if cursor.fetchone():
                flash("This email address is already registered to another student.", "error")
                return redirect(url_for('students'))

            cursor.execute(
                "UPDATE students SET name = %s, email = %s, phone = %s, department = %s WHERE id = %s",
                (name, email, phone, department, id_val)
            )
            flash(f"Student profile for '{name}' updated.", "success")
    except Exception as e:
        print(f"Error updating student: {e}")
        flash("Failed to update student profile.", "error")
    finally:
        conn.close()

    return redirect(url_for('students'))

@app.route('/delete-student/<int:student_id>')
@login_required
def delete_student(student_id):
    """
    Deletes student profile. (Foreign keys cascade to issued records).
    """
    conn = get_db_connection()
    if not conn:
        flash("Database offline.", "error")
        return redirect(url_for('students'))

    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
            flash("Student record deleted successfully.", "success")
    except Exception as e:
        print(f"Error deleting student: {e}")
        flash("Failed to delete student record.", "error")
    finally:
        conn.close()

    return redirect(url_for('students'))

# --------------------------------------------------------
# ADMIN ROUTE: BOOK ISSUANCE
# --------------------------------------------------------

@app.route('/issue-book', methods=['GET', 'POST'])
@login_required
def issue_book():
    """
    Handles rendering choices and registering transactional book issuance.
    """
    conn = get_db_connection()
    if not conn:
        return "Database Connection Failed"

    if request.method == 'POST':
        book_id = request.form.get('book_id')
        student_id = request.form.get('student_id')
        issue_date = request.form.get('issue_date')
        return_date = request.form.get('return_date')

        try:
            with conn.cursor() as cursor:
                # Verify book availability
                cursor.execute("SELECT available_qty, title FROM books WHERE id = %s", (book_id,))
                book = cursor.fetchone()
                if not book or book['available_qty'] <= 0:
                    flash(f"Error: Selected book is currently out of stock.", "error")
                    return redirect(url_for('issue_book'))

                # Verify student
                cursor.execute("SELECT name FROM students WHERE id = %s", (student_id,))
                student = cursor.fetchone()
                if not student:
                    flash("Error: Selected student record does not exist.", "error")
                    return redirect(url_for('issue_book'))

                # Log issue transaction
                cursor.execute(
                    "INSERT INTO issued_books (book_id, student_id, issue_date, return_date, status) VALUES (%s, %s, %s, %s, 'Issued')",
                    (book_id, student_id, issue_date, return_date)
                )

                # Decrement book available copies
                cursor.execute("UPDATE books SET available_qty = available_qty - 1 WHERE id = %s", (book_id,))
                
            flash(f"Book '{book['title']}' successfully issued to {student['name']}!", "success")
            return redirect(url_for('dashboard'))
        except Exception as e:
            print(f"Error issuing book: {e}")
            flash("Internal transaction failure. Please try again.", "error")
            return redirect(url_for('issue_book'))
        finally:
            conn.close()

    # GET requests - Gather list parameters
    try:
        with conn.cursor() as cursor:
            # Only books that are actually available (qty > 0)
            cursor.execute("SELECT id, title, author, isbn, available_qty FROM books WHERE available_qty > 0 ORDER BY title ASC")
            books_list = cursor.fetchall()

            # All students
            cursor.execute("SELECT id, student_id, name, department FROM students ORDER BY name ASC")
            students_list = cursor.fetchall()
            
        today = date.today()
        due_default = today + timedelta(days=14) # Standard 2-week loan limit
        
        return render_template(
            'issue_book.html', 
            books=books_list, 
            students=students_list, 
            today_date=today.isoformat(), 
            due_date_default=due_default.isoformat()
        )
    except Exception as e:
        print(f"Error rendering issue view: {e}")
        return "Internal Error loading issue details"
    finally:
        conn.close()

# --------------------------------------------------------
# ADMIN ROUTE: BOOK RETURN & FINE TRACKING
# --------------------------------------------------------

@app.route('/return-book', methods=['GET', 'POST'])
@login_required
def return_book():
    """
    Tracks book returns, calculations of fines, and database increments.
    """
    conn = get_db_connection()
    if not conn:
        return "Database Connection Failed"

    if request.method == 'POST':
        issue_id = request.form.get('issue_id')
        actual_return_date = request.form.get('actual_return_date')
        fine_amount = float(request.form.get('fine_amount', 0.00))

        try:
            with conn.cursor() as cursor:
                # Find book ID from issue log
                cursor.execute("SELECT book_id, status FROM issued_books WHERE id = %s", (issue_id,))
                record = cursor.fetchone()
                if not record:
                    flash("Issued record not found.", "error")
                    return redirect(url_for('return_book'))

                if record['status'] == 'Returned':
                    flash("This transaction has already been completed.", "info")
                    return redirect(url_for('return_book'))

                # Update transaction
                cursor.execute(
                    "UPDATE issued_books SET actual_return_date = %s, fine_amount = %s, status = 'Returned' WHERE id = %s",
                    (actual_return_date, fine_amount, issue_id)
                )

                # Increment book available quantity back
                cursor.execute("UPDATE books SET available_qty = available_qty + 1 WHERE id = %s", (record['book_id'],))
                
            flash("Book successfully returned and catalog stock updated.", "success")
        except Exception as e:
            print(f"Error returning book: {e}")
            flash("Failed to return book. Transaction error.", "error")
        finally:
            conn.close()

        return redirect(url_for('return_book'))

    # GET requests - Render open books issue registry
    try:
        today = date.today()
        issued_list = []
        
        with conn.cursor() as cursor:
            query = """
                SELECT ib.id, ib.issue_date, ib.return_date, ib.status,
                       b.title as book_title, b.isbn,
                       s.name as student_name, s.student_id as student_id_val
                FROM issued_books ib
                JOIN books b ON ib.book_id = b.id
                JOIN students s ON ib.student_id = s.id
                WHERE ib.status = 'Issued'
                ORDER BY ib.id DESC
            """
            cursor.execute(query)
            records = cursor.fetchall()
            
            for row in records:
                due = row['return_date']
                if isinstance(due, str):
                    due = datetime.strptime(due, '%Y-%m-%d').date()
                
                # Check overdue and calculate potential fine
                if due < today:
                    row['is_overdue'] = True
                    overdue_days = (today - due).days
                    row['current_accumulated_fine'] = overdue_days * 10.00 # Rs. 10 per day fine
                else:
                    row['is_overdue'] = False
                    row['current_accumulated_fine'] = 0.00
                
                issued_list.append(row)
                
        return render_template('return_book.html', issued_list=issued_list)
    except Exception as e:
        print(f"Error: {e}")
        return "Internal Error loading return registry"
    finally:
        conn.close()

# --------------------------------------------------------
# APPLICATION RUNNER
# --------------------------------------------------------
if __name__ == '__main__':
    # Runs the Flask application on port 5000 in debug mode
    app.run(host='0.0.0.0', port=5000, debug=True)
