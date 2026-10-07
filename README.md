# 🎆 Nirmal Firework Shop

A full-stack web application for managing a firework shop's products, employees, sales, billing, and business information.

The application is designed to help shop owners track **which employee sold a product, at what price, and calculate business profit more easily**.

## 🚀 Features

* 👨‍💼 Employee management
* 📦 Product management
* 🧾 Billing and sales management
* 💰 Track product selling prices
* 👤 Identify which employee generated a bill
* 📊 Manage sales and business data
* 🔄 CRUD operations for application data
* 🗄️ MySQL database integration
* 🌐 Angular frontend
* ⚡ FastAPI backend

## 🛠️ Tech Stack

### Frontend

* Angular
* TypeScript
* HTML
* CSS

### Backend

* Python
* FastAPI
* SQLAlchemy
* Uvicorn

### Database

* MySQL

## 📁 Project Structure

```text
nirmal_firework_shop/
│
├── frontend/
│   └── Angular application
│
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   ├── .env
│   └── requirements.txt
│
├── .gitignore
├── LICENSE
└── README.md
```

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/Sanyam-prog-coder/nirmal_firework_shop.git
cd nirmal_firework_shop
```

### 2. Backend Setup

Go to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python3 -m venv venv
```

Activate it:

**Linux/macOS:**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file and configure your MySQL database connection:

```env
DATABASE_URL=mysql+pymysql://username:password@localhost/employee_db
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Backend will run at:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal and go to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Angular development server:

```bash
ng serve
```

Open:

```text
http://localhost:4200
```

## 🗄️ Database

This project uses **MySQL** for storing application data.

Make sure MySQL is installed and running before starting the backend.

Update the database connection in the `.env` file according to your local MySQL configuration.

## 🔄 CRUD Operations

The application follows the basic CRUD architecture:

| Operation | Description                      |
| --------- | -------------------------------- |
| Create    | Add new employees/products/sales |
| Read      | Display stored records           |
| Update    | Modify existing records          |
| Delete    | Remove records                   |

## 🎯 Purpose

The main purpose of this project is to simplify firework shop management by keeping sales and employee information organized.

It helps the shop owner answer questions such as:

* Which employee sold a product?
* At what price was the product sold?
* How many products were sold?
* What is the business profit?
* What sales records have been generated?

## 🔮 Future Improvements

* 📊 Sales dashboard
* 📈 Profit and revenue charts
* 🔐 User authentication
* 🧾 Printable invoices
* 📱 Responsive mobile UI
* 🔍 Advanced search and filtering
* 📅 Date-wise sales reports

## 👨‍💻 Author

**Sanyam Bhupendrakumar Ravne**

GitHub: [Sanyam-prog-coder](https://github.com/Sanyam-prog-coder)

## 📄 License

This project is licensed under the MIT License.
