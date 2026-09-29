# Simple POS System

A lightweight, full-stack Point of Sale (POS) system built for small retail shops to manage products, sales transactions, stock levels, and daily revenue reporting.

## Features

✅ **Authentication** - Admin and cashier login with role-based access  
✅ **Product Management** - Add, edit, and view products with prices and stock  
✅ **Sales Module** - Search products, add to cart, calculate totals and change  
✅ **Stock Management** - Automatic stock reduction after sales, prevent out-of-stock sales  
✅ **Sales History** - View all transactions with dates, products, quantities, and amounts  
✅ **Dashboard** - Today's sales count, total revenue, and current inventory  

## Project Structure

```
simple-pos/
├── backend/                    # Node.js/Express API
│   ├── routes/                # API route handlers
│   │   ├── auth.js           # Login endpoint
│   │   ├── products.js       # Product CRUD operations
│   │   ├── sales.js          # Sales transaction handling
│   │   └── dashboard.js      # Dashboard statistics
│   ├── db.js                 # SQLite database setup & schema
│   ├── server.js             # Express server initialization
│   └── package.json          # Dependencies
├── frontend/                  # HTML/CSS/JavaScript UI
│   ├── index.html            # Main application page
│   ├── css/
│   │   └── style.css         # Responsive styling
│   └── js/
│       └── app.js            # Application logic & API calls
└── pos.db                     # SQLite database (auto-created)
```

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Authentication**: bcryptjs for password hashing

## Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd simple-pos
```

2. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

3. Start the backend server:
```bash
cd backend
npm start
```

The server will start on `http://localhost:3000`

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Cashier Account:**
- Username: `cashier`
- Password: `cashier123`

## Usage

### Dashboard
- View today's sales count and total revenue
- See current product inventory

### Product Management
- Add new products with name, price, and initial quantity
- Edit existing products
- View all products and their stock levels

### Make a Sale
1. Search for a product by name
2. Select quantity needed
3. Add to cart (can add multiple items)
4. Review cart with item details
5. Enter amount paid by customer
6. System automatically calculates change
7. Click "Complete Sale" to finalize

### Sales History
- View all past transactions
- Click "View" to see detailed breakdown of each sale

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `password` - Hashed password
- `role` - 'admin' or 'cashier'

### Products Table
- `id` - Primary key
- `name` - Product name
- `price` - Unit price
- `quantity` - Current stock quantity

### Sales Table
- `id` - Primary key
- `user_id` - Reference to cashier who made the sale
- `total_amount` - Total sale amount
- `amount_paid` - Amount paid by customer
- `change` - Change given to customer
- `sale_date` - Date of sale

### Sale Items Table
- `id` - Primary key
- `sale_id` - Reference to the sale
- `product_id` - Reference to product
- `quantity` - Quantity sold
- `price` - Price at time of sale
- `subtotal` - Quantity × Price

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Add new product
- `PUT /api/products/:id` - Edit product

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/date/:date` - Get sales for specific date
- `GET /api/sales/details/:id` - Get sale details with items
- `POST /api/sales` - Create new sale

### Dashboard
- `GET /api/dashboard/today` - Get today's stats
- `GET /api/dashboard/stats` - Get all-time stats

## Key Features Explained

### Stock Management
- Products can't be sold if out of stock
- Stock automatically reduces after each completed sale
- Prevents overselling with validation

### Transactions
- Sales use database transactions for data integrity
- All items in a sale must process successfully or entire sale is rolled back
- Prevents data inconsistency

### Real-time Cart
- Add/remove items dynamically
- Quantity controls with live calculations
- Total and change calculated automatically

## Troubleshooting

### Port 3000 already in use
Change the PORT in backend/server.js or set environment variable:
```bash
PORT=3001 npm start
```

### Database errors
Delete `backend/pos.db` to reset the database:
```bash
rm backend/pos.db
npm start
```

### Frontend not loading
Ensure backend is running and accessible at http://localhost:3000

## Development Notes

- All data is stored locally in SQLite database
- No external services required
- CORS enabled for cross-origin requests
- Sessions stored in browser's sessionStorage
- Responsive design works on desktop and mobile

## Future Enhancements

- User profile management
- Advanced reporting and analytics
- Product categories and filtering
- Receipt printing
- Barcode scanning support
- Multi-currency support

---

**Built for the intern task**: A complete, working POS system demonstrating full-stack development with frontend, backend, and database integration.
