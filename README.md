# 🍗 Customizable Biryani & Restaurant POS System + AI RAG Copilot
> **White-Label Ready POS, Financial Intelligence, Deg Costing & AI Copilot System for Biryani & Restaurant Outlets**  
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

## 🤖 AI RAG Copilot with Voice Flow

The built-in **AI Copilot** (available in the Manager Hub) acts as an intelligent restaurant consultant solving 4 critical business problems using Retrieval-Augmented Generation (RAG):

1. **📊 Financial & P&L Diagnostic**: Ask questions like *"What was my net profit today?"* or *"Break down my cost per plate"*. It retrieves real-time SQLite ledger records, computes margins, and explains the financial health in plain language.
2. **🧾 Vendor Invoice & Price Hike Scanner**: Paste raw supplier text/invoices (e.g. *"Got 25kg Mutton at 720/kg and 50kg Basmati Rice at 145/kg"*). The AI extracts the items, flags price spikes compared to past historical averages, and provides a 1-click **"Auto-Log to Ledger"** button.
3. **👨‍🍳 Master Chef Recipe Scaler & Dum SOP**: Ask *"I need 120 plates of Mutton Biryani for catering tonight"*. The AI retrieves the exact Deg ratios, computes required raw meat, rice, spices, packaging, and LPG gas cylinders, and gives step-by-step Dum cooking instructions.
4. **🔮 Morning Prep Briefing & Wastage Minimizer**: The AI analyzes past order velocity by day of the week, predicts today's plate demand, and recommends the exact number of morning Degs to cook to prevent 11 PM stockouts or end-of-night food spoilage.
5. **🎙️ Hands-Free Voice Flow**: Built-in voice input via Web Speech API allows the restaurant owner or chef to speak naturally in the kitchen while prepping.

---

## 📱 Mobile App (PWA) Installation

The app is fully configured as a **Progressive Web App (PWA)** with a standalone mobile manifest:

### On Android (Chrome):
1. Open the hosted URL or local Wi-Fi URL in Google Chrome.
2. Tap the **3-dot menu (⋮)** or the prompt at the bottom: **"Add Biryani POS to Home Screen"**.
3. Tap **Install**. It installs with a dedicated home screen icon and launches full-screen without browser address bars.

### On iPhone / iPad (Safari):
1. Open the URL in Safari.
2. Tap the **Share** button (box with an arrow pointing up).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add**. The standalone app will be on your iOS home screen!

---

## ☁️ 100% Free Cloud Hosting on Render.com

This repository includes [`render.yaml`](render.yaml) for 1-click free deployment on [Render.com](https://render.com):

1. Sign up on [Render.com](https://render.com) using your GitHub account (`Jeweloffice`).
2. Click **New +** $\rightarrow$ **Web Service** $\rightarrow$ Connect `Jeweloffice/cafed`.
3. Set runtime to **Python 3**.
4. **Build Command**:
   ```bash
   npm --prefix frontend install && npm --prefix frontend run build && pip install -r backend/requirements.txt
   ```
5. **Start Command**:
   ```bash
   cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
6. Select the **Free** plan and click **Create Web Service**. You will receive an official live HTTPS URL (e.g. `https://cafed.onrender.com`).

---

## 🚀 Local Quick Start (Single Command)

To run both the Python FastAPI backend and React frontend concurrently on your local machine:

```bash
cd /home/jewel-das/Documents/cafed
./start.sh
```

### Accessing the App:
- **🖥️ Counter Desktop / Laptop**: [http://localhost:5173](http://localhost:5173) (or production port [http://localhost:8000](http://localhost:8000))
- **📱 Any Phone or Tablet on Shop Wi-Fi**: `http://192.168.3.48:8000` (or `:5173`)
- **📚 Interactive Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **⚡ Instant 30-Second Public Tunnel**: `npx localtunnel --port 8000`

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
│   ├── rag_service.py   # RAG engine (Finance Q&A, Invoice scan, Recipe scaler, Prep briefing)
│   ├── models.py        # SQLAlchemy models (ShopSettings, Staff, BatchTemplate, Order, MenuItem, Batch, Expense)
│   ├── schemas.py       # Pydantic validation schemas
│   ├── crud.py          # Database operations, auto-seeding, and P&L math
│   ├── database.py      # SQLite database configuration (biryani_pos.db)
│   ├── requirements.txt # Python dependencies
│   └── venv/            # Python virtual environment
│
├── frontend/
│   ├── public/
│   │   └── manifest.json     # PWA standalone mobile manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Dynamic navigation & PIN security modal
│   │   │   ├── PosView.jsx       # Employee billing screen with staff attribution
│   │   │   ├── ReceiptModal.jsx  # Printable receipt slip with custom shop branding
│   │   │   ├── AdminView.jsx     # Manager P&L, batches, expenses, menu & settings tabs
│   │   │   ├── AiCopilot.jsx     # AI RAG Copilot chat, invoice scanner & auto-log
│   │   │   ├── VoiceInput.jsx    # Microphone voice dictation via Web Speech API
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
├── render.yaml                   # 1-click Render.com cloud deployment blueprint
└── start.sh                      # Single-command launcher script
```
