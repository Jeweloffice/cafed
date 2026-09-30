from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db
import models
import schemas
import crud

# Initialize database tables
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed default menu, sample batches, and expenses on first run
    db = next(get_db())
    try:
        crud.seed_default_data_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Biryani Shop POS & Financial Management API",
    description="Business-tailored customizable system for Biryani outlets tracking sales, batch costs, gas/rice inventory, and live profit-loss.",
    version="1.1.0",
    lifespan=lifespan,
)

# Enable CORS for frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "Biryani POS API", "version": "1.1.0"}


# --- SHOP SETTINGS & PROFILE ---
@app.get("/api/settings", response_model=schemas.ShopSettingsResponse, tags=["Settings"])
def read_settings(db: Session = Depends(get_db)):
    return crud.get_shop_settings(db)


@app.put("/api/settings", response_model=schemas.ShopSettingsResponse, tags=["Settings"])
def update_settings(update_data: schemas.ShopSettingsUpdate, db: Session = Depends(get_db)):
    return crud.update_shop_settings(db, update_data)


@app.post("/api/settings/reset-data", tags=["Settings"])
def reset_data_endpoint(clear_menu: bool = Query(False), db: Session = Depends(get_db)):
    return crud.reset_shop_data(db, clear_menu=clear_menu)


# --- STAFF MANAGEMENT ---
@app.get("/api/staff", response_model=List[schemas.StaffResponse], tags=["Staff"])
def read_staff(active_only: bool = True, db: Session = Depends(get_db)):
    return crud.get_staff_list(db, active_only=active_only)


@app.post("/api/staff", response_model=schemas.StaffResponse, status_code=status.HTTP_201_CREATED, tags=["Staff"])
def add_staff(staff_data: schemas.StaffCreate, db: Session = Depends(get_db)):
    return crud.create_staff(db, staff_data)


@app.put("/api/staff/{staff_id}", response_model=schemas.StaffResponse, tags=["Staff"])
def edit_staff(staff_id: int, staff_data: schemas.StaffUpdate, db: Session = Depends(get_db)):
    staff = crud.update_staff(db, staff_id, staff_data)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


@app.delete("/api/staff/{staff_id}", tags=["Staff"])
def remove_staff(staff_id: int, db: Session = Depends(get_db)):
    success = crud.delete_staff(db, staff_id)
    if not success:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return {"message": "Staff member removed"}


# --- BATCH RECIPE TEMPLATES ---
@app.get("/api/batch-templates", response_model=List[schemas.BatchTemplateResponse], tags=["Templates"])
def read_templates(db: Session = Depends(get_db)):
    return crud.get_batch_templates(db)


@app.post("/api/batch-templates", response_model=schemas.BatchTemplateResponse, status_code=status.HTTP_201_CREATED, tags=["Templates"])
def add_template(tpl: schemas.BatchTemplateCreate, db: Session = Depends(get_db)):
    return crud.create_batch_template(db, tpl)


@app.delete("/api/batch-templates/{template_id}", tags=["Templates"])
def remove_template(template_id: int, db: Session = Depends(get_db)):
    success = crud.delete_batch_template(db, template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template removed"}


# --- MENU ITEMS ---
@app.get("/api/menu", response_model=List[schemas.MenuItemResponse], tags=["Menu"])
def read_menu(active_only: bool = True, db: Session = Depends(get_db)):
    return crud.get_menu_items(db, active_only=active_only)


@app.post("/api/menu", response_model=schemas.MenuItemResponse, status_code=status.HTTP_201_CREATED, tags=["Menu"])
def add_menu_item(item: schemas.MenuItemCreate, db: Session = Depends(get_db)):
    return crud.create_menu_item(db, item)


@app.put("/api/menu/{item_id}", response_model=schemas.MenuItemResponse, tags=["Menu"])
def edit_menu_item(item_id: int, item_update: schemas.MenuItemUpdate, db: Session = Depends(get_db)):
    updated = crud.update_menu_item(db, item_id, item_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return updated


@app.delete("/api/menu/{item_id}", tags=["Menu"])
def remove_menu_item(item_id: int, db: Session = Depends(get_db)):
    success = crud.delete_menu_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return {"message": "Menu item removed"}


# --- ORDERS (POS) ---
@app.get("/api/orders", response_model=List[schemas.OrderResponse], tags=["Orders"])
def read_orders(limit: int = 100, status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_orders(db, limit=limit, status=status_filter)


@app.post("/api/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def place_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Cannot place an empty order")
    return crud.create_order(db, order_data)


@app.get("/api/orders/{order_id}", response_model=schemas.OrderResponse, tags=["Orders"])
def read_order(order_id: int, db: Session = Depends(get_db)):
    order = crud.get_order_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.post("/api/orders/{order_id}/cancel", response_model=schemas.OrderResponse, tags=["Orders"])
def cancel_order_endpoint(order_id: int, db: Session = Depends(get_db)):
    order = crud.cancel_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# --- BATCHES (DEG / HANDI COOKING & COGS) ---
@app.get("/api/batches", response_model=List[schemas.BatchResponse], tags=["Batches"])
def read_batches(limit: int = 50, db: Session = Depends(get_db)):
    return crud.get_batches(db, limit=limit)


@app.post("/api/batches", response_model=schemas.BatchResponse, status_code=status.HTTP_201_CREATED, tags=["Batches"])
def create_new_batch(batch_data: schemas.BatchCreate, db: Session = Depends(get_db)):
    return crud.create_batch(db, batch_data)


@app.get("/api/batches/{batch_id}", response_model=schemas.BatchResponse, tags=["Batches"])
def read_batch_detail(batch_id: int, db: Session = Depends(get_db)):
    batch = crud.get_batch_by_id(db, batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@app.put("/api/batches/{batch_id}", response_model=schemas.BatchResponse, tags=["Batches"])
def edit_batch(batch_id: int, update_data: schemas.BatchUpdate, db: Session = Depends(get_db)):
    batch = crud.update_batch(db, batch_id, update_data)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@app.delete("/api/batches/{batch_id}", tags=["Batches"])
def remove_batch(batch_id: int, db: Session = Depends(get_db)):
    success = crud.delete_batch(db, batch_id)
    if not success:
        raise HTTPException(status_code=404, detail="Batch not found")
    return {"message": "Batch deleted"}


# --- EXPENSES (GAS, WAGES, RENT, PACKAGING, MISC) ---
@app.get("/api/expenses", response_model=List[schemas.ExpenseResponse], tags=["Expenses"])
def read_expenses(limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_expenses(db, limit=limit)


@app.post("/api/expenses", response_model=schemas.ExpenseResponse, status_code=status.HTTP_201_CREATED, tags=["Expenses"])
def record_expense(expense_data: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    return crud.create_expense(db, expense_data)


@app.delete("/api/expenses/{expense_id}", tags=["Expenses"])
def remove_expense(expense_id: int, db: Session = Depends(get_db)):
    success = crud.delete_expense(db, expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted"}


# --- ANALYTICS & PROFIT / LOSS ---
@app.get("/api/analytics/pnl", response_model=schemas.ProfitLossSummary, tags=["Analytics"])
def get_profit_loss(period: str = Query("today", pattern="^(today|yesterday|this_month|all_time)$"), db: Session = Depends(get_db)):
    return crud.get_pnl_summary(db, period=period)


@app.get("/api/analytics/plate-breakdown", tags=["Analytics"])
def get_plate_breakdown(db: Session = Depends(get_db)):
    """Calculates average ingredient percentage breakdown per plate across recent batches."""
    batches = crud.get_batches(db, limit=10)
    if not batches:
        return {"items": [], "average_cost_per_plate": 0.0}

    breakdown_map = {}
    total_cost_accum = 0.0
    total_plates_accum = 0

    for b in batches:
        total_cost_accum += b.total_cost
        total_plates_accum += b.target_plates
        for ing in b.ingredients:
            cat = ing.ingredient_name.split("(")[0].strip()
            breakdown_map[cat] = breakdown_map.get(cat, 0.0) + ing.total_cost

    avg_cost_plate = round(total_cost_accum / max(1, total_plates_accum), 2)
    categories = []
    for name, cost in breakdown_map.items():
        percentage = round((cost / max(1.0, total_cost_accum)) * 100, 1)
        categories.append({
            "name": name,
            "total_spent": round(cost, 2),
            "percentage": percentage,
            "cost_per_plate_share": round((avg_cost_plate * percentage) / 100, 2)
        })

    categories.sort(key=lambda x: x["total_spent"], reverse=True)

    return {
        "average_cost_per_plate": avg_cost_plate,
        "total_batches_analyzed": len(batches),
        "total_plates_produced": total_plates_accum,
        "ingredients": categories
    }
