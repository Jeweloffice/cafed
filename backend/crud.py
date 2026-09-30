import json
from datetime import datetime, date, time
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

import models
import schemas


# --- Shop Settings Operations ---
def get_shop_settings(db: Session) -> models.ShopSettings:
    settings = db.query(models.ShopSettings).filter(models.ShopSettings.id == 1).first()
    if not settings:
        settings = models.ShopSettings(
            id=1,
            shop_name="Shahi Biryani Darbar",
            tagline="Authentic Dum Biryani & Kebabs",
            phone="+91 98765 43210",
            address="Shop #12, Food Street Market",
            fssai_or_gst="FSSAI: 12345678901234",
            currency_symbol="₹",
            manager_pin="1234",
            receipt_footer="Thank you for dining with us! Please visit again 🍛",
            updated_at=datetime.utcnow(),
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_shop_settings(db: Session, update_data: schemas.ShopSettingsUpdate) -> models.ShopSettings:
    settings = get_shop_settings(db)
    for field, value in update_data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(settings, field, value)
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    return settings


# --- Staff Operations ---
def get_staff_list(db: Session, active_only: bool = True):
    query = db.query(models.Staff)
    if active_only:
        query = query.filter(models.Staff.is_active == True)
    return query.order_by(models.Staff.role, models.Staff.name).all()


def get_staff(db: Session, staff_id: int):
    return db.query(models.Staff).filter(models.Staff.id == staff_id).first()


def create_staff(db: Session, staff_data: schemas.StaffCreate):
    staff = models.Staff(**staff_data.model_dump())
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


def update_staff(db: Session, staff_id: int, staff_data: schemas.StaffUpdate):
    staff = get_staff(db, staff_id)
    if not staff:
        return None
    for field, value in staff_data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(staff, field, value)
    db.commit()
    db.refresh(staff)
    return staff


def delete_staff(db: Session, staff_id: int):
    staff = get_staff(db, staff_id)
    if not staff:
        return False
    staff.is_active = False  # Soft delete
    db.commit()
    return True


# --- Batch Templates (Custom Saved Recipes) ---
def get_batch_templates(db: Session):
    return db.query(models.BatchTemplate).order_by(models.BatchTemplate.name).all()


def create_batch_template(db: Session, template_data: schemas.BatchTemplateCreate):
    tpl = models.BatchTemplate(**template_data.model_dump())
    db.add(tpl)
    db.commit()
    db.refresh(tpl)
    return tpl


def delete_batch_template(db: Session, template_id: int):
    tpl = db.query(models.BatchTemplate).filter(models.BatchTemplate.id == template_id).first()
    if not tpl:
        return False
    db.delete(tpl)
    db.commit()
    return True


# --- Menu Operations ---
def get_menu_items(db: Session, active_only: bool = True):
    query = db.query(models.MenuItem)
    if active_only:
        query = query.filter(models.MenuItem.is_active == True)
    return query.order_by(models.MenuItem.category, models.MenuItem.name).all()


def get_menu_item(db: Session, item_id: int):
    return db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()


def create_menu_item(db: Session, item_data: schemas.MenuItemCreate):
    item = models.MenuItem(**item_data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_menu_item(db: Session, item_id: int, item_data: schemas.MenuItemUpdate):
    item = get_menu_item(db, item_id)
    if not item:
        return None
    for field, value in item_data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


def delete_menu_item(db: Session, item_id: int):
    item = get_menu_item(db, item_id)
    if not item:
        return False
    item.is_active = False  # Soft delete
    db.commit()
    return True


# --- Order Operations ---
def generate_order_number(db: Session) -> str:
    today_str = datetime.utcnow().strftime("%Y%m%d")
    today_prefix = f"ORD-{today_str}-"
    last_order = (
        db.query(models.Order)
        .filter(models.Order.order_number.like(f"{today_prefix}%"))
        .order_by(desc(models.Order.id))
        .first()
    )
    if last_order and last_order.order_number:
        try:
            seq = int(last_order.order_number.split("-")[-1]) + 1
        except Exception:
            seq = 1
    else:
        seq = 1
    return f"{today_prefix}{seq:03d}"


def create_order(db: Session, order_data: schemas.OrderCreate):
    order_number = generate_order_number(db)
    
    subtotal = sum(item.unit_price * item.quantity for item in order_data.items)
    discount = max(0.0, order_data.discount)
    total_amount = max(0.0, subtotal - discount)

    db_order = models.Order(
        order_number=order_number,
        order_type=order_data.order_type,
        table_or_token=order_data.table_or_token,
        customer_name=order_data.customer_name,
        customer_phone=order_data.customer_phone,
        staff_id=order_data.staff_id,
        staff_name=order_data.staff_name,
        payment_method=order_data.payment_method,
        payment_status="Paid",
        status="Completed",
        subtotal=subtotal,
        discount=discount,
        total_amount=total_amount,
        notes=order_data.notes,
        created_at=datetime.utcnow(),
    )
    db.add(db_order)
    db.flush()

    biryani_plates_in_order = 0

    for item_in in order_data.items:
        line_total = item_in.unit_price * item_in.quantity
        order_item = models.OrderItem(
            order_id=db_order.id,
            menu_item_id=item_in.menu_item_id,
            item_name=item_in.item_name,
            unit_price=item_in.unit_price,
            quantity=item_in.quantity,
            total_price=line_total,
        )
        db.add(order_item)
        if "biryani" in item_in.item_name.lower():
            biryani_plates_in_order += item_in.quantity

    if biryani_plates_in_order > 0:
        active_batch = (
            db.query(models.Batch)
            .filter(models.Batch.status == "Active")
            .order_by(desc(models.Batch.id))
            .first()
        )
        if active_batch:
            active_batch.actual_plates_sold += biryani_plates_in_order

    db.commit()
    db.refresh(db_order)
    return db_order


def get_orders(db: Session, limit: int = 100, status: Optional[str] = None):
    query = db.query(models.Order)
    if status:
        query = query.filter(models.Order.status == status)
    return query.order_by(desc(models.Order.created_at)).limit(limit).all()


def get_order_by_id(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def cancel_order(db: Session, order_id: int):
    order = get_order_by_id(db, order_id)
    if not order:
        return None
    order.status = "Cancelled"
    db.commit()
    db.refresh(order)
    return order


# --- Batch & Ingredients Operations ---
def create_batch(db: Session, batch_data: schemas.BatchCreate):
    total_cost = 0.0
    for ing in batch_data.ingredients:
        cost = ing.total_cost if ing.total_cost is not None and ing.total_cost > 0 else (ing.quantity * ing.unit_price)
        total_cost += cost

    target_plates = max(1, batch_data.target_plates)
    cost_per_plate = round(total_cost / target_plates, 2)

    db_batch = models.Batch(
        batch_name=batch_data.batch_name,
        biryani_type=batch_data.biryani_type,
        target_plates=target_plates,
        actual_plates_sold=0,
        total_cost=round(total_cost, 2),
        cost_per_plate=cost_per_plate,
        status="Active",
        notes=batch_data.notes,
        cooked_at=datetime.utcnow(),
    )
    db.add(db_batch)
    db.flush()

    for ing in batch_data.ingredients:
        line_cost = ing.total_cost if ing.total_cost is not None and ing.total_cost > 0 else (ing.quantity * ing.unit_price)
        db_ing = models.BatchIngredient(
            batch_id=db_batch.id,
            ingredient_name=ing.ingredient_name,
            quantity=ing.quantity,
            unit=ing.unit,
            unit_price=ing.unit_price,
            total_cost=round(line_cost, 2),
        )
        db.add(db_ing)

    db.commit()
    db.refresh(db_batch)
    return db_batch


def get_batches(db: Session, limit: int = 50):
    return db.query(models.Batch).order_by(desc(models.Batch.cooked_at)).limit(limit).all()


def get_batch_by_id(db: Session, batch_id: int):
    return db.query(models.Batch).filter(models.Batch.id == batch_id).first()


def update_batch(db: Session, batch_id: int, update_data: schemas.BatchUpdate):
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        return None
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(batch, field, value)
    
    if batch.target_plates > 0:
        batch.cost_per_plate = round(batch.total_cost / batch.target_plates, 2)

    db.commit()
    db.refresh(batch)
    return batch


def delete_batch(db: Session, batch_id: int):
    batch = get_batch_by_id(db, batch_id)
    if not batch:
        return False
    db.delete(batch)
    db.commit()
    return True


# --- Expense Operations ---
def create_expense(db: Session, expense_data: schemas.ExpenseCreate):
    db_exp = models.Expense(
        title=expense_data.title,
        category=expense_data.category,
        amount=expense_data.amount,
        payment_method=expense_data.payment_method,
        expense_date=expense_data.expense_date or datetime.utcnow(),
        notes=expense_data.notes,
    )
    db.add(db_exp)
    db.commit()
    db.refresh(db_exp)
    return db_exp


def get_expenses(db: Session, limit: int = 100):
    return db.query(models.Expense).order_by(desc(models.Expense.expense_date)).limit(limit).all()


def delete_expense(db: Session, expense_id: int):
    exp = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not exp:
        return False
    db.delete(exp)
    db.commit()
    return True


# --- Reset Data (For New Shop Client Onboarding) ---
def reset_shop_data(db: Session, clear_menu: bool = False):
    """Wipes all orders, batches, and expenses so a new shop starts fresh."""
    db.query(models.OrderItem).delete()
    db.query(models.Order).delete()
    db.query(models.BatchIngredient).delete()
    db.query(models.Batch).delete()
    db.query(models.Expense).delete()
    if clear_menu:
        db.query(models.MenuItem).delete()
    db.commit()
    return {"message": "Shop data successfully reset to clean slate."}


# --- Profit & Loss Calculations ---
def get_pnl_summary(db: Session, period: str = "today") -> schemas.ProfitLossSummary:
    now = datetime.utcnow()
    settings = get_shop_settings(db)

    if period == "today":
        start_dt = datetime.combine(date.today(), time.min)
    elif period == "yesterday":
        from datetime import timedelta
        yest = date.today() - timedelta(days=1)
        start_dt = datetime.combine(yest, time.min)
    elif period == "this_month":
        start_dt = datetime(now.year, now.month, 1)
    else:  # all_time
        start_dt = datetime(2020, 1, 1)

    orders_query = db.query(models.Order).filter(
        models.Order.status == "Completed",
        models.Order.created_at >= start_dt
    )
    orders = orders_query.all()
    total_revenue = sum(o.total_amount for o in orders)
    total_orders = len(orders)

    plates_sold = 0
    for order in orders:
        for item in order.items:
            if "biryani" in item.item_name.lower():
                plates_sold += item.quantity

    batches = db.query(models.Batch).filter(models.Batch.cooked_at >= start_dt).all()
    batch_cogs = sum(b.total_cost for b in batches)

    expenses = db.query(models.Expense).filter(models.Expense.expense_date >= start_dt).all()
    general_expenses = sum(e.amount for e in expenses)

    gas_expenses = 0.0
    for e in expenses:
        if "gas" in e.category.lower() or "gas" in e.title.lower():
            gas_expenses += e.amount
    for b in batches:
        for ing in b.ingredients:
            if "gas" in ing.ingredient_name.lower():
                gas_expenses += ing.total_cost

    total_expenses = batch_cogs + general_expenses
    gross_profit = total_revenue - batch_cogs
    net_profit = total_revenue - total_expenses
    net_profit_margin = round((net_profit / total_revenue * 100), 1) if total_revenue > 0 else 0.0
    average_order_value = round((total_revenue / total_orders), 2) if total_orders > 0 else 0.0

    return schemas.ProfitLossSummary(
        period=period,
        currency=settings.currency_symbol,
        total_revenue=round(total_revenue, 2),
        total_orders=total_orders,
        batch_cogs=round(batch_cogs, 2),
        general_expenses=round(general_expenses, 2),
        gas_expenses=round(gas_expenses, 2),
        total_expenses=round(total_expenses, 2),
        gross_profit=round(gross_profit, 2),
        net_profit=round(net_profit, 2),
        net_profit_margin=net_profit_margin,
        average_order_value=average_order_value,
        total_plates_sold=plates_sold,
    )


# --- Seed Initial Realistic Data ---
def seed_default_data_if_empty(db: Session):
    # 1. Shop Settings
    get_shop_settings(db)

    # 2. Staff members
    if db.query(models.Staff).count() == 0:
        default_staff = [
            models.Staff(name="Rahul (Cashier)", role="Cashier", phone="9876543210", daily_wage=500.0, is_active=True),
            models.Staff(name="Ustad Karim (Head Chef)", role="Head Chef", phone="9876543211", daily_wage=900.0, is_active=True),
            models.Staff(name="Manoj (Waiter / Server)", role="Waiter", phone="9876543212", daily_wage=450.0, is_active=True),
        ]
        for s in default_staff:
            db.add(s)
        db.commit()

    # 3. Default Batch Recipes / Templates
    if db.query(models.BatchTemplate).count() == 0:
        default_templates = [
            models.BatchTemplate(
                name="Standard Chicken Dum Biryani Deg (45 Plates)",
                biryani_type="Chicken Dum Biryani",
                target_plates=45,
                ingredients_json=json.dumps([
                    {"ingredient_name": "Basmati Rice (Daawat / India Gate)", "quantity": 9, "unit": "kg", "unit_price": 95},
                    {"ingredient_name": "Fresh Broiler Chicken", "quantity": 10, "unit": "kg", "unit_price": 160},
                    {"ingredient_name": "Commercial LPG Cooking Gas", "quantity": 0.25, "unit": "cylinder", "unit_price": 1800},
                    {"ingredient_name": "Pure Desi Ghee & Mustard Oil", "quantity": 1.5, "unit": "liter", "unit_price": 220},
                    {"ingredient_name": "Biryani Khada Masala, Saffron & Keora", "quantity": 1, "unit": "pack", "unit_price": 240},
                    {"ingredient_name": "Onions (Barista), Potatoes & Curd", "quantity": 4, "unit": "kg", "unit_price": 55},
                    {"ingredient_name": "Packaging Boxes & Foil Containers", "quantity": 45, "unit": "pcs", "unit_price": 6},
                ])
            ),
            models.BatchTemplate(
                name="Special Mutton Dum Biryani Deg (35 Plates)",
                biryani_type="Special Mutton Biryani",
                target_plates=35,
                ingredients_json=json.dumps([
                    {"ingredient_name": "Aromatic Basmati Rice", "quantity": 8, "unit": "kg", "unit_price": 110},
                    {"ingredient_name": "Fresh Mutton / Khasi Meat", "quantity": 9, "unit": "kg", "unit_price": 720},
                    {"ingredient_name": "Commercial Cooking Gas (LPG)", "quantity": 0.35, "unit": "cylinder", "unit_price": 1800},
                    {"ingredient_name": "Desi Ghee & White Oil", "quantity": 1.5, "unit": "liter", "unit_price": 260},
                    {"ingredient_name": "Rich Shahi Masala & Saffron", "quantity": 1, "unit": "pack", "unit_price": 350},
                    {"ingredient_name": "Curd, Onions & Whole Spices", "quantity": 4, "unit": "kg", "unit_price": 60},
                    {"ingredient_name": "Packaging Foil Containers", "quantity": 35, "unit": "pcs", "unit_price": 6},
                ])
            ),
        ]
        for t in default_templates:
            db.add(t)
        db.commit()

    existing_items = db.query(models.MenuItem).count()
    if existing_items > 0:
        return

    # 4. Default Menu Items
    default_items = [
        {"name": "Chicken Biryani (Full)", "category": "Biryani", "price": 160.0, "cost_price": 75.0, "description": "Aromatic Basmati rice cooked with tender chicken, potato, and boiled egg."},
        {"name": "Chicken Biryani (Half)", "category": "Biryani", "price": 100.0, "cost_price": 50.0, "description": "Half portion of authentic Kolkata/Hyderabadi style chicken biryani."},
        {"name": "Special Mutton Biryani", "category": "Biryani", "price": 240.0, "cost_price": 120.0, "description": "Juicy mutton pieces slow-cooked in rich spices with saffron rice."},
        {"name": "Egg Biryani", "category": "Biryani", "price": 90.0, "cost_price": 40.0, "description": "Two spiced eggs served over long grain dum biryani rice."},
        {"name": "Extra Biryani Rice (Kuska)", "category": "Biryani", "price": 60.0, "cost_price": 25.0, "description": "Flavourful seasoned biryani rice portion."},
        {"name": "Chicken Chaap", "category": "Starters & Gravies", "price": 110.0, "cost_price": 55.0, "description": "Slow cooked chicken leg in rich poppy seed & cashew gravy."},
        {"name": "Spiced Raita & Salad", "category": "Starters & Gravies", "price": 30.0, "cost_price": 10.0, "description": "Chilled curd raita with roasted cumin, cucumber, and onions."},
        {"name": "Shahi Firni", "category": "Desserts", "price": 50.0, "cost_price": 20.0, "description": "Traditional earthen pot ground rice pudding infused with saffron and pistachios."},
        {"name": "Gulab Jamun (2 pcs)", "category": "Desserts", "price": 40.0, "cost_price": 15.0, "description": "Warm melt-in-mouth milk solid dumplings in green cardamom syrup."},
        {"name": "Soft Drink (Thums Up / Coke 300ml)", "category": "Beverages", "price": 40.0, "cost_price": 28.0, "description": "Chilled fizzy soda."},
        {"name": "Packaged Drinking Water (1L)", "category": "Beverages", "price": 20.0, "cost_price": 12.0, "description": "Sealed mineral water bottle."},
    ]
    for it in default_items:
        db.add(models.MenuItem(**it))
    db.commit()
