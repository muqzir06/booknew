import os
import sqlite3
import datetime
import pymysql
import pymysql.cursors

# Database Configuration Defaults
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASSWORD = ''  # Enter your MySQL password here
DB_NAME = 'library_db'

# --------------------------------------------------------
# SQLITE COMPATIBILITY WRAPPERS
# --------------------------------------------------------

def dict_factory(cursor, row):
    """
    Converts SQLite row tuples into standard Python dictionaries.
    """
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

class SQLiteCursorWrapper:
    def __init__(self, sqlite_cursor):
        self.cursor = sqlite_cursor

    def execute(self, query, args=None):
        if query:
            # Convert MySQL %s placeholder style to SQLite ? style
            query = query.replace('%s', '?')
        
        if args is not None:
            # Wrap single parameters in a tuple
            if not isinstance(args, (tuple, list, dict)):
                args = (args,)
            
            # Format datetime.date/datetime objects to ISO string representation
            if isinstance(args, (tuple, list)):
                new_args = []
                for val in args:
                    if isinstance(val, (datetime.date, datetime.datetime)):
                        new_args.append(val.isoformat())
                    else:
                        new_args.append(val)
                args = tuple(new_args)
            elif isinstance(args, dict):
                new_args = {}
                for k, val in args.items():
                    if isinstance(val, (datetime.date, datetime.datetime)):
                        new_args[k] = val.isoformat()
                    else:
                        new_args[k] = val
                args = new_args
            
            return self.cursor.execute(query, args)
        else:
            return self.cursor.execute(query)

    def fetchall(self):
        return self.cursor.fetchall()

    def fetchone(self):
        return self.cursor.fetchone()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cursor.close()

class SQLiteConnectionWrapper:
    def __init__(self, sqlite_conn):
        self.conn = sqlite_conn

    def cursor(self):
        return SQLiteCursorWrapper(self.conn.cursor())

    def close(self):
        self.conn.close()

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

# --------------------------------------------------------
# SQLITE SEEDING & SETUP
# --------------------------------------------------------

def init_sqlite_db(conn):
    """
    Creates SQLite schema tables and seeds initial sample records.
    """
    cursor = conn.cursor()
    
    # 1. Admins Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL
    )
    """)
    
    # 2. Books Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      available_qty INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 3. Students Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      department TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 4. Issued Books Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS issued_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER,
      student_id INTEGER,
      issue_date TEXT NOT NULL,
      return_date TEXT NOT NULL,
      actual_return_date TEXT DEFAULT NULL,
      fine_amount REAL DEFAULT 0.00,
      status TEXT DEFAULT 'Issued',
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
    """)
    
    # Seed Admin Account (Username: admin, Password: admin123)
    cursor.execute("SELECT COUNT(*) as count FROM admins")
    if cursor.fetchone()['count'] == 0:
        cursor.execute(
            "INSERT INTO admins (id, username, password, full_name) VALUES (1, 'admin', 'scrypt:32768:8:1$rj8Lt6EkX4Vhj1Mq$111e1b1e1c60873c12c8996f1a2581a1c0cb6e52ad72b8ccb551f12da0623c7031a418f31037a604bf8bea0be086491d10a0e422e3f27265b43b687fd840e13b', 'System Administrator')"
        )
        
        # Seed Students
        cursor.execute(
            "INSERT OR IGNORE INTO students (id, student_id, name, email, phone, department) VALUES (1, 'STU001', 'Alice Johnson', 'alice@university.edu', '9876543210', 'Computer Science')"
        )
        cursor.execute(
            "INSERT OR IGNORE INTO students (id, student_id, name, email, phone, department) VALUES (2, 'STU002', 'Bob Smith', 'bob@university.edu', '8765432109', 'Mechanical Engineering')"
        )
        cursor.execute(
            "INSERT OR IGNORE INTO students (id, student_id, name, email, phone, department) VALUES (3, 'STU003', 'Charlie Brown', 'charlie@university.edu', '7654321098', 'Electronics & Communication')"
        )

        # Seed Books
        cursor.execute(
            "INSERT OR IGNORE INTO books (id, title, author, isbn, category, quantity, available_qty) VALUES (1, 'Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'Computer Science', 5, 4)"
        )
        cursor.execute(
            "INSERT OR IGNORE INTO books (id, title, author, isbn, category, quantity, available_qty) VALUES (2, 'Clean Code', 'Robert C. Martin', '978-0132350884', 'Software Engineering', 3, 3)"
        )
        cursor.execute(
            "INSERT OR IGNORE INTO books (id, title, author, isbn, category, quantity, available_qty) VALUES (3, 'The Pragmatic Programmer', 'Andrew Hunt', '978-0135957059', 'Software Engineering', 4, 3)"
        )
        cursor.execute(
            "INSERT OR IGNORE INTO books (id, title, author, isbn, category, quantity, available_qty) VALUES (4, 'Database System Concepts', 'Abraham Silberschatz', '978-9332901384', 'Database Management', 2, 2)"
        )

        # Seed Issued Books
        # Date arithmetic using SQLite functions
        cursor.execute(
            "INSERT OR IGNORE INTO issued_books (id, book_id, student_id, issue_date, return_date, actual_return_date, fine_amount, status) VALUES (1, 1, 1, date('now', '-5 day'), date('now', '+9 day'), NULL, 0.00, 'Issued')"
        )
        cursor.execute(
            "INSERT OR IGNORE INTO issued_books (id, book_id, student_id, issue_date, return_date, actual_return_date, fine_amount, status) VALUES (2, 3, 2, date('now', '-15 day'), date('now', '-1 day'), NULL, 10.00, 'Issued')"
        )
        conn.commit()

# --------------------------------------------------------
# CORE DATABASE CONNECTION RETRIEVER
# --------------------------------------------------------

def get_db_connection():
    """
    Establishes and returns a connection to the database.
    Attempts connection to local MySQL server first; falls back
    automatically to a local SQLite database if MySQL is unavailable.
    """
    try:
        # Try MySQL connection
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        return connection
    except Exception as e:
        # Fallback to local SQLite
        db_dir = os.path.dirname(os.path.abspath(__file__))
        sqlite_db_path = os.path.join(db_dir, 'library.db')
        is_new = not os.path.exists(sqlite_db_path)
        
        print(f"MySQL Connection offline ({e}). Falling back to SQLite: {sqlite_db_path}")
        
        try:
            conn = sqlite3.connect(sqlite_db_path, isolation_level=None)
            conn.row_factory = dict_factory
            # Enable Foreign Key support in SQLite
            conn.execute("PRAGMA foreign_keys = ON;")
            
            if is_new:
                init_sqlite_db(conn)
                
            return SQLiteConnectionWrapper(conn)
        except Exception as sqlite_err:
            print(f"SQLite Connection Failure: {sqlite_err}")
            return None
