Pharmacy Management System (Backend)

📌 Project Overview

The Pharmacy Management System is a backend application designed to manage a chain of pharmacies under a single company. It provides functionalities for managing sales, inventory, stock transfers, reports, and user authentication, with access control for different roles (CEO, Branch Admin).

🔍 Technologies Used

Django (Backend Framework)

Django Rest Framework (DRF) (API Management)

Simple JWT (Authentication)

PostgreSQL (Database)

Redis (Caching)

Docker & Docker Compose (Containerization)

WeasyPrint (PDF Generation)

🚀 Installation

Clone The Repository

    git clone <repository-url>
    cd Pharmacy-Management-System

Create a Python Virtual Environment (Optional but recommended)

    python -m venv env
    source env/bin/activate  # For Linux/Mac
    .\env\Scripts\activate  # For Windows

Install Dependencies

    pip install -r requirements.txt

🔑 Environment Variables

Create a .env file in the backend root directory with the following variables:

SECRET_KEY=your_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://postgres:password@db:5432/postgres

💾 Database Setup

Run Migrations

    python manage.py makemigrations
    python manage.py migrate

Create a Superuser

    python manage.py createsuperuser

⚙️ Running The Application (Without Docker)

    python manage.py runserver

⚙️ Running The Application (With Docker)

Build and Run Containers

    docker-compose up -d --build

Check Logs

    docker-compose logs -f

🚀 Redis Caching Setup

Ensure Redis is running and properly connected.

Testing Redis Connection

    docker-compose exec redis redis-cli ping

Response should be: PONG

Testing Cache From Django Shell

    python manage.py shell
    from django.core.cache import cache
    cache.set('key', 'value')
    cache.get('key')  # Should return 'value'

📖 API Documentation

🔑 Authentication

POST /api/token/ - Obtain JWT Token.

POST /api/token/refresh/ - Refresh JWT Token.

📦 Products

GET /api/products/ - List Products.

POST /api/products/ - Create Product (CEO Only).

📋 Inventory

GET /api/inventory/ - List Inventory (Filtered by Branch for Admins).

💰 Sales

POST /api/sales/ - Record a Sale.

📊 Reports

GET /api/reports/sales/ - Sales Report (Filterable).

GET /api/reports/inventory/ - Inventory Report (Filterable).

📌 Dashboard

GET /api/v1/dashboard/statistics/ - Get Key Statistics.

GET /api/v1/dashboard/monthly-sales/ - Monthly Sales Data.

GET /api/v1/dashboard/sales-table/ - Sales Table (Filterable).

GET /api/v1/dashboard/expiry-list/ - Expired Products Table.

🧩 Testing

Run tests using:

    python manage.py test

🌍 Deployment (Docker)

Build & Start Containers

    docker-compose up -d --build

Run Database Migrations

    docker-compose exec web python manage.py migrate

Create Superuser

    docker-compose exec web python manage.py createsuperuser

🤝 Contributing

Fork the repository

Create a feature branch (git checkout -b feature/YourFeature)

Commit your changes (git commit -m 'Add new feature')

Push to the branch (git push origin feature/YourFeature)

Open a Pull Request

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

