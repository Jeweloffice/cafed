# 🍗 Customizable Biryani & Restaurant POS System
> **White-Label Ready POS & Financial Intelligence System for Biryani & Restaurant Outlets**  
> Built with **React (Vite + Tailwind CSS)** and **Python (FastAPI + SQLAlchemy + SQLite)**.

---

## 💼 Sell to Any Biryani Shop Owner (100% Customizable)

This system is built from the ground up to be **sold as a turn-key software product** to any biryani outlet or restaurant owner. Any buyer can fully tailor the application to their shop without writing a single line of code:

### 1. 🏪 Shop Profile & Custom Branding
In the **Manager Hub $\rightarrow$ ⚙️ Shop Profile & Staff** tab, the owner can configure:
- **Shop Name**: e.g., *"Arsalan Biryani"*, *"Aminia Restaurant"*, *"Hyderabad House"*, etc.
- **Tagline**: e.g., *"Authentic Charcoal Dum Biryani"*
- **Contact & WhatsApp**: Custom phone number for orders
- **Shop Address**: Displayed on counter bills and printed thermal receipts
- **GSTIN / FSSAI License**: Printed on customer slips for official compliance
- **Currency Symbol**: Supports `₹`, `$`, `৳`, `AED`, `£`, `€`, or any custom currency
- **Custom Receipt Footer**: Custom thank-you message, Wi-Fi password, or Google review link
- **Manager Security PIN**: Owner can change the default `1234` PIN to any private 4-6 digit code

### 2. 👥 Staff & Cashier Management
- Add/remove team members: **Cashiers**, **Head Chefs / Ustads**, **Waiters / Servers**, **Helpers**, and **Riders**
- Track daily wages and shift costs
- Every order punched at the POS records **"Billed By: [Staff Name]"** for accountability

### 3. 🍲 Custom Deg / Handi Recipe Presets
- Different shops have different recipes and pot sizes (e.g. 35 plates, 50 plates, 60 plates)
- Owners can click **"Save as Shop Recipe"** to store their own ingredients, meat-to-rice ratios, gas consumption, and spices permanently!

### 4. 🍽️ Menu & Category Customization
- Add, edit, or disable menu items
- Create custom categories (e.g., *Biryani*, *Kebabs*, *Rolls*, *Beverages*, *Desserts*)
- Set selling price vs. kitchen cost price to monitor gross margin % per dish

### 5. 🧹 Client Handover / "Clean Slate" Button
- A dedicated **"Clear Demo Orders & Start Fresh"** feature in the settings tab
- When you sell this to a new client, 1 click wipes all demo sales and orders, while preserving their custom branding, menu, and staff so they start at Day 1 with 0 records!

---

## 🚀 Quick Start (Single Command)

To run both the Python FastAPI backend and React frontend concurrently:

```bash
cd /home/jewel-das/Documents/cafed
./start.sh
```

### Accessing the App:
- **🖥️ Counter Desktop / Laptop**: [http://localhost:5173](http://localhost:5173)
- **📱 Any Phone or Tablet on Shop Wi-Fi**: `http://<your-local-ip>:5173` (e.g. `http://192.168.3.48:5173`)
- **📚 Interactive Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔒 Security & Access

- **Staff POS Billing**: Open by default on any counter screen or employee smartphone.
- **Manager Hub**: Click the **"Manager Hub"** tab in the top navigation bar. Enter the 4-digit security PIN:
  - **Default Manager PIN**: `1234` (Can be changed in Shop Settings)

---

## 📁 Project Structure

```text
cafed/
├── backend/
│   ├── main.py          # FastAPI endpoints for Settings, Staff, POS, Batches, Expenses & P&L
│   ├── models.py        # SQLAlchemy models (ShopSettings, Staff, BatchTemplate, Order, MenuItem, Batch, Expense)
│   ├── schemas.py       # Pydantic validation schemas
│   ├── crud.py          # Database operations, auto-seeding, and P&L math
│   ├── database.py      # SQLite database configuration (biryani_pos.db)
│   ├── requirements.txt # Python dependencies
│   └── venv/            # Python virtual environment
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Dynamic navigation & PIN security modal
│   │   │   ├── PosView.jsx       # Employee billing screen with staff attribution
│   │   │   ├── ReceiptModal.jsx  # Printable receipt slip with custom shop branding
│   │   │   ├── AdminView.jsx     # Manager P&L, batches, expenses, menu & settings tabs
│   │   │   ├── BatchModal.jsx    # Deg cost calculator with custom recipe presets
│   │   │   ├── ExpenseModal.jsx  # General shop expense logger
│   │   │   ├── MenuItemModal.jsx # Dish & price editor
│   │   │   └── StaffModal.jsx    # Staff & cashier manager
│   │   ├── api.js                # Frontend API client
│   │   ├── App.jsx               # Main view orchestrator
│   │   └── index.css             # Tailwind typography & styling
│   ├── package.json
│   └── vite.config.js            # Vite config with API proxy
│
└── start.sh                      # Single-command launcher script
```
