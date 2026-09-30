from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# --- Shop Settings Schemas ---
class ShopSettingsBase(BaseModel):
    shop_name: str = "Shahi Biryani Darbar"
    tagline: str = "Authentic Dum Biryani & Kebabs"
    phone: str = "+91 98765 43210"
    address: str = "Shop #12, Food Street Market"
    fssai_or_gst: Optional[str] = "FSSAI: 12345678901234"
    currency_symbol: str = "₹"
    manager_pin: str = "1234"
    receipt_footer: str = "Thank you for dining with us! Please visit again 🍛"


class ShopSettingsUpdate(BaseModel):
    shop_name: Optional[str] = None
    tagline: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    fssai_or_gst: Optional[str] = None
    currency_symbol: Optional[str] = None
    manager_pin: Optional[str] = None
    receipt_footer: Optional[str] = None


class ShopSettingsResponse(ShopSettingsBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Staff Schemas ---
class StaffBase(BaseModel):
    name: str
    role: str = "Cashier"  # Cashier, Manager, Head Chef, Waiter, Helper
    phone: Optional[str] = None
    daily_wage: float = 0.0
    is_active: bool = True


class StaffCreate(StaffBase):
    pass


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    daily_wage: Optional[float] = None
    is_active: Optional[bool] = None


class StaffResponse(StaffBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Batch Template (Saved Recipes) Schemas ---
class BatchTemplateCreate(BaseModel):
    name: str
    biryani_type: str
    target_plates: int = 45
    ingredients_json: str  # JSON array string


class BatchTemplateResponse(BaseModel):
    id: int
    name: str
    biryani_type: str
    target_plates: int
    ingredients_json: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Menu Item Schemas ---
class MenuItemBase(BaseModel):
    name: str
    category: str = "Biryani"
    price: float
    cost_price: float = 0.0
    description: Optional[str] = None
    is_active: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class MenuItemResponse(MenuItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Order Schemas ---
class OrderItemCreate(BaseModel):
    menu_item_id: Optional[int] = None
    item_name: str
    unit_price: float
    quantity: int = 1


class OrderItemResponse(BaseModel):
    id: int
    menu_item_id: Optional[int] = None
    item_name: str
    unit_price: float
    quantity: int
    total_price: float

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    order_type: str = "Dine-in"  # Dine-in, Takeaway, Delivery
    table_or_token: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    staff_id: Optional[int] = None
    staff_name: Optional[str] = None
    payment_method: str = "Cash"  # Cash, UPI, Card
    discount: float = 0.0
    notes: Optional[str] = None
    items: List[OrderItemCreate]


class OrderResponse(BaseModel):
    id: int
    order_number: str
    order_type: str
    table_or_token: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    staff_id: Optional[int] = None
    staff_name: Optional[str] = None
    payment_method: str
    payment_status: str
    status: str
    subtotal: float
    discount: float
    total_amount: float
    notes: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True


# --- Batch & Ingredients Schemas ---
class BatchIngredientCreate(BaseModel):
    ingredient_name: str
    quantity: float
    unit: str = "kg"
    unit_price: float
    total_cost: Optional[float] = None


class BatchIngredientResponse(BaseModel):
    id: int
    ingredient_name: str
    quantity: float
    unit: str
    unit_price: float
    total_cost: float

    class Config:
        from_attributes = True


class BatchCreate(BaseModel):
    batch_name: str
    biryani_type: str = "Chicken Dum Biryani"
    target_plates: int = 40
    notes: Optional[str] = None
    ingredients: List[BatchIngredientCreate] = []


class BatchUpdate(BaseModel):
    batch_name: Optional[str] = None
    biryani_type: Optional[str] = None
    target_plates: Optional[int] = None
    actual_plates_sold: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class BatchResponse(BaseModel):
    id: int
    batch_name: str
    biryani_type: str
    target_plates: int
    actual_plates_sold: int
    total_cost: float
    cost_per_plate: float
    status: str
    notes: Optional[str] = None
    cooked_at: datetime
    ingredients: List[BatchIngredientResponse]

    class Config:
        from_attributes = True


# --- Expense Schemas ---
class ExpenseCreate(BaseModel):
    title: str
    category: str
    amount: float
    payment_method: str = "Cash"
    expense_date: Optional[datetime] = None
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    title: str
    category: str
    amount: float
    payment_method: str
    expense_date: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True


# --- Analytics & P&L Schemas ---
class ProfitLossSummary(BaseModel):
    period: str
    currency: str = "₹"
    total_revenue: float
    total_orders: int
    batch_cogs: float
    general_expenses: float
    gas_expenses: float
    total_expenses: float
    gross_profit: float
    net_profit: float
    net_profit_margin: float
    average_order_value: float
    total_plates_sold: int
