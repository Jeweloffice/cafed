from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class ShopSettings(Base):
    """Stores shop profile, custom branding, currency, and manager PIN."""
    __tablename__ = "shop_settings"

    id = Column(Integer, primary_key=True, index=True)
    shop_name = Column(String(150), nullable=False, default="Shahi Biryani Darbar")
    tagline = Column(String(200), default="Authentic Dum Biryani & Kebabs")
    phone = Column(String(50), default="+91 98765 43210")
    address = Column(String(255), default="Shop #12, Food Street Market")
    fssai_or_gst = Column(String(100), default="FSSAI: 12345678901234")
    currency_symbol = Column(String(10), default="₹")
    manager_pin = Column(String(10), default="1234")
    receipt_footer = Column(String(255), default="Thank you for dining with us! Please visit again 🍛")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Staff(Base):
    """Staff members (Cashier, Waiter, Head Chef / Ustad, Delivery, Manager)."""
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(50), default="Cashier")  # Cashier, Manager, Head Chef, Waiter, Helper
    phone = Column(String(30), nullable=True)
    daily_wage = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class BatchTemplate(Base):
    """Custom saved recipes / Deg cooking presets defined by the shop owner."""
    __tablename__ = "batch_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    biryani_type = Column(String(100), nullable=False)
    target_plates = Column(Integer, default=45)
    ingredients_json = Column(Text, nullable=False)  # JSON-encoded array of ingredients
    created_at = Column(DateTime, default=datetime.utcnow)


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="Biryani")  # Biryani, Sides, Beverages, Desserts
    price = Column(Float, nullable=False)
    cost_price = Column(Float, default=0.0)  # Estimated plate cost
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True)
    order_type = Column(String(30), default="Dine-in")  # Dine-in, Takeaway, Delivery
    table_or_token = Column(String(50), nullable=True)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    staff_name = Column(String(100), nullable=True)
    payment_method = Column(String(30), default="Cash")  # Cash, UPI, Card
    payment_status = Column(String(30), default="Paid")  # Paid, Pending
    status = Column(String(30), default="Completed")     # Completed, Cancelled
    subtotal = Column(Float, default=0.0)
    discount = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=True)
    item_name = Column(String(100), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    total_price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")


class Batch(Base):
    """Represents a Deg / Handi cooking batch to track per-pot raw materials and gas cost."""
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_name = Column(String(100), nullable=False)  # e.g., "Deg #1 - Lunch Chicken Dum"
    biryani_type = Column(String(100), nullable=False)
    target_plates = Column(Integer, nullable=False, default=40)
    actual_plates_sold = Column(Integer, default=0)
    total_cost = Column(Float, default=0.0)
    cost_per_plate = Column(Float, default=0.0)
    status = Column(String(30), default="Active")  # Active, Completed, Discarded
    notes = Column(Text, nullable=True)
    cooked_at = Column(DateTime, default=datetime.utcnow, index=True)

    ingredients = relationship("BatchIngredient", back_populates="batch", cascade="all, delete-orphan")


class BatchIngredient(Base):
    """Specific raw materials consumed for a batch (Gas, Rice, Meat, Spices, Oil)."""
    __tablename__ = "batch_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    ingredient_name = Column(String(100), nullable=False)  # Basmati Rice, Chicken, Gas Cylinder fraction, etc.
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False, default="kg")  # kg, cylinder, liter, packet
    unit_price = Column(Float, nullable=False, default=0.0)
    total_cost = Column(Float, nullable=False, default=0.0)

    batch = relationship("Batch", back_populates="ingredients")


class Expense(Base):
    """General shop expenses (Daily wages, Gas refills, Shop Rent, Packaging, Electricity)."""
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # Gas, Meat & Rice, Spices & Grocery, Wages, Rent, Packaging, Utilities, Misc
    amount = Column(Float, nullable=False)
    payment_method = Column(String(30), default="Cash")  # Cash, UPI, Bank
    expense_date = Column(DateTime, default=datetime.utcnow, index=True)
    notes = Column(Text, nullable=True)
