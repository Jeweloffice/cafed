import os
import json
import re
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

import models
import crud


def get_financial_context(db: Session) -> Dict[str, Any]:
    """Retrieves full financial summary across today, yesterday, and this month."""
    today_pnl = crud.get_pnl_summary(db, "today")
    yesterday_pnl = crud.get_pnl_summary(db, "yesterday")
    month_pnl = crud.get_pnl_summary(db, "this_month")
    all_time_pnl = crud.get_pnl_summary(db, "all_time")

    # Recent active batches
    batches = db.query(models.Batch).order_by(desc(models.Batch.cooked_at)).limit(5).all()
    batch_summaries = []
    for b in batches:
        batch_summaries.append({
            "name": b.batch_name,
            "type": b.biryani_type,
            "target_plates": b.target_plates,
            "plates_sold": b.actual_plates_sold,
            "cost_per_plate": b.cost_per_plate,
            "total_cost": b.total_cost,
            "status": b.status,
            "date": b.cooked_at.strftime("%Y-%m-%d %H:%M")
        })

    # Recent expenses
    expenses = db.query(models.Expense).order_by(desc(models.Expense.expense_date)).limit(10).all()
    expense_summaries = []
    for e in expenses:
        expense_summaries.append({
            "title": e.title,
            "category": e.category,
            "amount": e.amount,
            "method": e.payment_method,
            "date": e.expense_date.strftime("%Y-%m-%d")
        })

    settings = crud.get_shop_settings(db)

    return {
        "shop_name": settings.shop_name,
        "currency": settings.currency_symbol,
        "today": today_pnl.model_dump(),
        "yesterday": yesterday_pnl.model_dump(),
        "this_month": month_pnl.model_dump(),
        "all_time": all_time_pnl.model_dump(),
        "recent_batches": batch_summaries,
        "recent_expenses": expense_summaries,
    }


def get_historical_ingredient_prices(db: Session) -> Dict[str, Dict[str, float]]:
    """Calculates 30-day baseline average prices for ingredients from batches & expenses."""
    cutoff = datetime.utcnow() - timedelta(days=60)
    
    # Query batch ingredients
    batch_ings = (
        db.query(models.BatchIngredient)
        .join(models.Batch)
        .filter(models.Batch.cooked_at >= cutoff)
        .all()
    )

    history: Dict[str, List[float]] = {}
    units: Dict[str, str] = {}

    for ing in batch_ings:
        name_clean = ing.ingredient_name.lower().strip()
        if ing.unit_price > 0:
            history.setdefault(name_clean, []).append(ing.unit_price)
            units[name_clean] = ing.unit

    # Fallback realistic industry baselines if DB is new
    defaults = {
        "chicken": {"avg": 160.0, "unit": "kg"},
        "fresh chicken": {"avg": 160.0, "unit": "kg"},
        "broiler chicken": {"avg": 160.0, "unit": "kg"},
        "mutton": {"avg": 720.0, "unit": "kg"},
        "basmati rice": {"avg": 95.0, "unit": "kg"},
        "rice": {"avg": 95.0, "unit": "kg"},
        "cooking gas": {"avg": 1800.0, "unit": "cylinder"},
        "lpg gas": {"avg": 1800.0, "unit": "cylinder"},
        "gas": {"avg": 1800.0, "unit": "cylinder"},
        "ghee": {"avg": 220.0, "unit": "liter"},
        "mustard oil": {"avg": 160.0, "unit": "liter"},
        "onion": {"avg": 55.0, "unit": "kg"},
        "potatoes": {"avg": 28.0, "unit": "kg"},
        "packaging": {"avg": 6.0, "unit": "pcs"},
        "spices": {"avg": 240.0, "unit": "pack"},
    }

    result = {}
    for item, prices in history.items():
        avg_price = sum(prices) / len(prices)
        result[item] = {"avg": round(avg_price, 2), "unit": units.get(item, "kg")}

    # Merge defaults if not present
    for k, v in defaults.items():
        if k not in result:
            result[k] = v

    return result


def analyze_vendor_invoice(db: Session, text: str) -> Dict[str, Any]:
    """Problem 2: RAG Invoice Scanner & Price Anomaly Detector."""
    baselines = get_historical_ingredient_prices(db)
    settings = crud.get_shop_settings(db)
    currency = settings.currency_symbol

    # Parse line items: e.g. "Chicken 15kg @ 190" or "Onion 10kg rate 65" or "Gas 1 cylinder 1850"
    lines = text.strip().split("\n")
    analyzed_items = []
    total_invoice_amount = 0.0
    total_overcharge = 0.0
    alerts = []

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue

        # Pattern matching for items, quantities, and rates
        # Matches formats like: "Chicken 10kg @ 180" or "Basmati rice: 25kg, rate 110" or "Gas 1 cyl 1850"
        match = re.search(
            r'([A-Za-z\s]+?)(?:[:\-,\s]+)?(\d+(?:\.\d+)?)\s*(kg|cylinder|liter|l|pcs|pack|units?)?\s*(?:[@xX]|at|rate|price|rs\.?|₹)?\s*(\d+(?:\.\d+)?)',
            line_clean,
            re.IGNORECASE
        )

        if match:
            item_name = match.group(1).strip()
            qty = float(match.group(2))
            unit = (match.group(3) or "kg").lower().strip()
            if unit == "l": unit = "liter"
            unit_price = float(match.group(4))
            line_total = qty * unit_price
            total_invoice_amount += line_total

            # Find matching baseline
            matching_key = None
            item_lower = item_name.lower()
            for key in baselines:
                if key in item_lower or item_lower in key:
                    matching_key = key
                    break

            baseline_price = baselines[matching_key]["avg"] if matching_key else unit_price
            variance_pct = round(((unit_price - baseline_price) / baseline_price) * 100, 1) if baseline_price > 0 else 0
            excess_cost = round(qty * max(0.0, unit_price - baseline_price), 2)
            total_overcharge += excess_cost

            is_spike = variance_pct >= 8.0

            if is_spike:
                alerts.append({
                    "item": item_name,
                    "today_rate": unit_price,
                    "baseline_rate": baseline_price,
                    "variance_pct": variance_pct,
                    "excess_cost": excess_cost,
                    "message": f"⚠️ {item_name} rate is {variance_pct}% HIGHER than your 30-day baseline ({currency}{baseline_price} vs {currency}{unit_price})! Extra cost: {currency}{excess_cost}."
                })

            analyzed_items.append({
                "item_name": item_name,
                "quantity": qty,
                "unit": unit,
                "unit_price": unit_price,
                "line_total": round(line_total, 2),
                "baseline_price": baseline_price,
                "variance_pct": variance_pct,
                "is_spike": is_spike,
            })
        else:
            # Fallback simple line parser (e.g. "Shop rent 400" or "Wages 500")
            num_match = re.search(r'([A-Za-z\s]+?)\s*(?:rs\.?|₹|:)?\s*(\d+(?:\.\d+)?)', line_clean)
            if num_match:
                title = num_match.group(1).strip()
                amt = float(num_match.group(2))
                total_invoice_amount += amt
                analyzed_items.append({
                    "item_name": title,
                    "quantity": 1,
                    "unit": "lump sum",
                    "unit_price": amt,
                    "line_total": amt,
                    "baseline_price": amt,
                    "variance_pct": 0.0,
                    "is_spike": False,
                })

    return {
        "invoice_total": round(total_invoice_amount, 2),
        "total_overcharge": round(total_overcharge, 2),
        "items": analyzed_items,
        "alerts": alerts,
        "currency": currency,
    }


def scale_recipe_sop(db: Session, biryani_type: str, target_plates: int) -> Dict[str, Any]:
    """Problem 3: RAG Master Chef Recipe Scaler & Kitchen SOP Assistant."""
    settings = crud.get_shop_settings(db)
    currency = settings.currency_symbol

    # 1. Retrieve matching template or default
    templates = crud.get_batch_templates(db)
    matched_tpl = None
    for t in templates:
        if biryani_type.lower() in t.biryani_type.lower() or t.biryani_type.lower() in biryani_type.lower():
            matched_tpl = t
            break

    if not matched_tpl and templates:
        matched_tpl = templates[0]

    base_plates = matched_tpl.target_plates if matched_tpl else 45
    multiplier = max(1, target_plates) / max(1, base_plates)

    try:
        base_ingredients = json.loads(matched_tpl.ingredients_json) if matched_tpl else []
    except Exception:
        base_ingredients = []

    if not base_ingredients:
        base_ingredients = [
            {"ingredient_name": "Basmati Rice (Daawat / India Gate)", "quantity": 9, "unit": "kg", "unit_price": 95},
            {"ingredient_name": "Fresh Broiler Chicken", "quantity": 10, "unit": "kg", "unit_price": 160},
            {"ingredient_name": "Commercial LPG Cooking Gas", "quantity": 0.25, "unit": "cylinder", "unit_price": 1800},
            {"ingredient_name": "Pure Desi Ghee & Mustard Oil", "quantity": 1.5, "unit": "liter", "unit_price": 220},
            {"ingredient_name": "Biryani Khada Masala, Saffron & Keora", "quantity": 1, "unit": "pack", "unit_price": 240},
            {"ingredient_name": "Onions (Barista), Potatoes & Curd", "quantity": 4, "unit": "kg", "unit_price": 55},
            {"ingredient_name": "Packaging Boxes & Foil Containers", "quantity": 45, "unit": "pcs", "unit_price": 6},
        ]

    scaled_ingredients = []
    total_cost = 0.0

    for ing in base_ingredients:
        # Scale quantity proportionally
        scaled_qty = round(ing["quantity"] * multiplier, 2)
        rate = ing.get("unit_price", 0.0)
        line_cost = round(scaled_qty * rate, 2)
        total_cost += line_cost
        scaled_ingredients.append({
            "ingredient_name": ing["ingredient_name"],
            "quantity": scaled_qty,
            "unit": ing["unit"],
            "unit_price": rate,
            "total_cost": line_cost,
        })

    cost_per_plate = round(total_cost / max(1, target_plates), 2)

    # Standard Culinary SOP for Biryani Dum Cooking
    cooking_sop = [
        f"1. 🌾 Rice Prep: Soak {round(scaled_ingredients[0]['quantity'], 1)}kg long-grain Basmati rice in clean water for exactly 35 minutes.",
        f"2. 🍗 Meat Marination: Marinate {round(scaled_ingredients[1]['quantity'], 1)}kg fresh meat with curd, ginger-garlic paste, red chili, and half the shahi garam masala for at least 1 hour.",
        "3. 🔥 Rice Par-boil: Boil water with whole spices (green cardamom, cloves, cinnamon, bay leaf, salt). Boil rice until 70% done. Strain immediately.",
        "4. 🍲 Pot Layering (Deg): Lay marinated meat at the base with fried onions (barista) and spiced potatoes. Layer par-boiled Basmati rice evenly over meat.",
        f"5. 🧈 Aromatics: Drizzle {round(scaled_ingredients[3]['quantity'], 1)}L warm Desi Ghee mixed with saffron milk, keora water, and meetha atar across the top rice layer.",
        "6. 🔒 Dum Sealing: Seal Deg lid airtight using soft wheat flour dough. Cook on HIGH flame for 12 minutes until steam builds, then reduce to LOW flame over a flat iron tawa for 40 minutes.",
        "7. ⏳ Resting: Turn off burner and rest Deg sealed for 15 minutes before unsealing to let the aromatic steam settle into the rice grains."
    ]

    return {
        "recipe_name": matched_tpl.name if matched_tpl else f"{biryani_type} Deg",
        "target_plates": target_plates,
        "base_plates": base_plates,
        "multiplier": round(multiplier, 2),
        "total_cost": round(total_cost, 2),
        "cost_per_plate": cost_per_plate,
        "currency": currency,
        "ingredients": scaled_ingredients,
        "sop_instructions": cooking_sop,
    }


def get_predictive_prep_advice(db: Session, requested_day: Optional[str] = None) -> Dict[str, Any]:
    """Problem 4: RAG Predictive Batch Prep & Wastage Minimizer."""
    settings = crud.get_shop_settings(db)
    currency = settings.currency_symbol

    now = datetime.utcnow()
    target_day = requested_day.lower().capitalize() if requested_day else now.strftime("%A")

    # Day mapping: Monday=0, Sunday=6
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    # Look back 45 days of orders
    cutoff = now - timedelta(days=45)
    orders = db.query(models.Order).filter(
        models.Order.status == "Completed",
        models.Order.created_at >= cutoff
    ).all()

    # Aggregate by day of week
    day_plate_counts: Dict[str, List[int]] = {d: [] for d in day_names}
    hourly_distribution: Dict[int, int] = {h: 0 for h in range(10, 24)}

    # Map order items
    order_dates_seen = {d: set() for d in day_names}
    order_plates_by_date: Dict[str, int] = {}

    for o in orders:
        o_date_str = o.created_at.strftime("%Y-%m-%d")
        o_day = o.created_at.strftime("%A")
        order_dates_seen[o_day].add(o_date_str)
        
        plates = 0
        for item in o.items:
            if "biryani" in item.item_name.lower():
                plates += item.quantity

        order_plates_by_date[o_date_str] = order_plates_by_date.get(o_date_str, 0) + plates
        h = o.created_at.hour
        if 10 <= h <= 23:
            hourly_distribution[h] += plates

    for o_day, dates_set in order_dates_seen.items():
        for d_str in dates_set:
            day_plate_counts[o_day].append(order_plates_by_date.get(d_str, 0))

    target_history = day_plate_counts.get(target_day, [])
    if target_history:
        avg_plates = round(sum(target_history) / len(target_history))
        min_plates = min(target_history)
        max_plates = max(target_history)
    else:
        # Realistic defaults if shop is newly opened
        is_weekend = target_day in ["Friday", "Saturday", "Sunday"]
        avg_plates = 65 if is_weekend else 42
        min_plates = 50 if is_weekend else 35
        max_plates = 80 if is_weekend else 55

    # Suggested batch configuration
    if avg_plates <= 45:
        lunch_deg = avg_plates
        dinner_deg = 0
        recommendation = f"Cook 1 Deg of {lunch_deg} plates around 11:30 AM. Do NOT fire a second Deg unless lunch plates sell out before 2:00 PM."
    else:
        lunch_deg = round(avg_plates * 0.6)
        dinner_deg = avg_plates - lunch_deg
        recommendation = f"Cook 1 Lunch Deg of {lunch_deg} plates at 11:30 AM, and 1 Dinner Deg of {dinner_deg} plates at 6:30 PM. Cutoff time: Do not fire any Deg after 8:30 PM."

    # Peak hours
    peak_lunch = "12:30 PM - 2:30 PM"
    peak_dinner = "7:30 PM - 9:30 PM"

    return {
        "day": target_day,
        "is_weekend": target_day in ["Friday", "Saturday", "Sunday"],
        "historical_avg_plates": avg_plates,
        "historical_min_plates": min_plates,
        "historical_max_plates": max_plates,
        "recommended_lunch_deg": lunch_deg,
        "recommended_dinner_deg": dinner_deg,
        "total_recommended_plates": lunch_deg + dinner_deg,
        "peak_lunch_hours": peak_lunch,
        "peak_dinner_hours": peak_dinner,
        "recommendation_summary": recommendation,
        "currency": currency,
        "estimated_revenue": f"{currency}{((lunch_deg + dinner_deg) * 160):,}",
    }


def process_rag_copilot_query(db: Session, query: str) -> Dict[str, Any]:
    """Universal Router and Intelligent Contextual Synthesizer."""
    q = query.lower().strip()
    settings = crud.get_shop_settings(db)
    currency = settings.currency_symbol

    # Intent 1: Recipe Scaling (Problem 3)
    # Check for keywords: "scale", "recipe", "plates", "how much rice", "how much chicken"
    scale_match = re.search(r'(\d+)\s*(?:plates?|portion)', q)
    if "scale" in q or "recipe" in q or (scale_match and ("cook" in q or "make" in q or "biryani" in q)):
        target_plates = int(scale_match.group(1)) if scale_match else 60
        biryani_type = "Mutton Biryani" if "mutton" in q else "Chicken Dum Biryani"
        result = scale_recipe_sop(db, biryani_type, target_plates)
        
        md = f"### 👨‍🍳 Master Chef Recipe Scaler: {result['recipe_name']}\n\n"
        md += f"**Scaled for {result['target_plates']} Plates** (Multiplier: {result['multiplier']}x from standard {result['base_plates']} plates)\n\n"
        md += f"💰 **Total Batch Cost**: `{currency}{result['total_cost']}` • **Cost Per Plate**: `{currency}{result['cost_per_plate']}`\n\n"
        md += "#### 🛒 Exact Ingredient Measurements:\n"
        for ing in result["ingredients"]:
            md += f"- **{ing['ingredient_name']}**: `{ing['quantity']} {ing['unit']}` @ {currency}{ing['unit_price']}/{ing['unit']} = **{currency}{ing['total_cost']}**\n"
        
        md += "\n#### 🍲 Standard Kitchen Dum SOP:\n"
        for step in result["sop_instructions"]:
            md += f"{step}\n"

        return {
            "type": "recipe_scaler",
            "reply": md,
            "data": result,
            "action": "open_batch_modal",
        }

    # Intent 2: Vendor Invoice & Grocery Bill Scanner (Problem 2)
    # Check for keywords: "invoice", "vendor", "bill", "price check", "bought", "@", "rate"
    has_invoice_tokens = any(k in q for k in ["invoice", "bill", "receipt", "supplier", "vendor", "bought", "rate", "@", "per kg"])
    has_numbers_and_items = any(item in q for item in ["chicken", "rice", "gas", "onion", "oil", "ghee"]) and any(char.isdigit() for char in q)
    if has_invoice_tokens or (has_numbers_and_items and ("price" in q or "rate" in q or "cost" in q or "@" in q)):
        analysis = analyze_vendor_invoice(db, query)
        
        md = f"### 🧾 Vendor Invoice & Price Alert Scanner\n\n"
        md += f"**Total Billed Amount**: `{currency}{analysis['invoice_total']}`\n"
        if analysis['total_overcharge'] > 0:
            md += f"🚨 **Excess Cost / Overcharge Detected**: `{currency}{analysis['total_overcharge']}`\n\n"
        else:
            md += "✅ **Price Check**: All line items are within standard 30-day baseline rates.\n\n"

        if analysis["alerts"]:
            md += "#### ⚠️ Supplier Price Spike Alerts:\n"
            for a in analysis["alerts"]:
                md += f"- {a['message']}\n"
            md += "\n"

        md += "#### 📋 Line Item Breakdown:\n"
        for it in analysis["items"]:
            spike_badge = "🔴 SPIKE" if it["is_spike"] else "🟢 FAIR"
            md += f"- **{it['item_name']}**: {it['quantity']} {it['unit']} @ `{currency}{it['unit_price']}` (Baseline: {currency}{it['baseline_price']}) → **{currency}{it['line_total']}** [{spike_badge}]\n"

        return {
            "type": "invoice_scanner",
            "reply": md,
            "data": analysis,
            "action": "log_expense",
        }

    # Intent 3: Predictive Morning Prep & Wastage Minimizer (Problem 4)
    # Check for keywords: "prep", "tomorrow", "today", "how many plates", "how many deg", "waste", "briefing"
    if any(k in q for k in ["how many plates", "prep", "cook today", "how much should i cook", "morning briefing", "wastage", "forecast", "predict"]):
        day_match = None
        for d in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
            if d in q:
                day_match = d
                break
        
        prep = get_predictive_prep_advice(db, day_match)
        md = f"### 🌅 Predictive Kitchen Prep Briefing for **{prep['day']}**\n\n"
        md += f"📊 **Historical Demand on {prep['day']}s**: Average **{prep['historical_avg_plates']} plates** (Range: {prep['historical_min_plates']} – {prep['historical_max_plates']} plates)\n\n"
        md += "#### 🍲 Recommended Deg Cooking Schedule:\n"
        md += f"- **Lunch Deg (11:30 AM)**: `{prep['recommended_lunch_deg']} Plates`\n"
        if prep['recommended_dinner_deg'] > 0:
            md += f"- **Dinner Deg (6:30 PM)**: `{prep['recommended_dinner_deg']} Plates`\n"
        md += f"- **Total Production**: **{prep['total_recommended_plates']} Plates** (Projected Revenue: `{prep['estimated_revenue']}`)\n\n"
        md += f"⏰ **Peak Rush Hours**: Lunch: `{prep['peak_lunch_hours']}` | Dinner: `{prep['peak_dinner_hours']}`\n\n"
        md += f"💡 **Wastage Prevention Tip**: {prep['recommendation_summary']}\n"

        return {
            "type": "prep_briefing",
            "reply": md,
            "data": prep,
            "action": "view_batches",
        }

    # Intent 4: Natural Language P&L & Business Copilot (Problem 1)
    context = get_financial_context(db)
    
    # Analyze query period
    if "yesterday" in q:
        p = context["yesterday"]
        period_label = "Yesterday"
    elif "month" in q:
        p = context["this_month"]
        period_label = "This Month"
    elif "all time" in q or "overall" in q:
        p = context["all_time"]
        period_label = "All Time"
    else:
        p = context["today"]
        period_label = "Today (Live)"

    net_profit = p["net_profit"]
    margin = p["net_profit_margin"]
    status_icon = "🟢" if net_profit >= 0 else "🔴"

    md = f"### 📊 Business & P&L Analysis: **{period_label}**\n\n"
    md += f"- 💰 **Sales Revenue**: `{currency}{p['total_revenue']:,}` ({p['total_orders']} Bills | Avg Order: {currency}{p['average_order_value']})\n"
    md += f"- 🍲 **Biryani Plates Sold**: `{p['total_plates_sold']} plates`\n"
    md += f"- 🥩 **Batch Cooking COGS**: `{currency}{p['batch_cogs']:,}` (Meat, Rice, Ghee, Spices in Degs)\n"
    md += f"- 🏢 **Operational Overheads**: `{currency}{p['general_expenses']:,}` (Gas refills, helper wages, packaging)\n"
    md += f"- ⛽ **Cooking Gas Spent**: `{currency}{p['gas_expenses']:,}`\n"
    md += f"- {status_icon} **Net Profit / Loss**: **`{currency}{net_profit:,}`** (Net Margin: **{margin}%**)\n\n"

    # Business Diagnostic Advice
    if "gas" in q:
        md += f"🔥 **Cooking Gas Insights**: Gas costs account for `{currency}{p['gas_expenses']}`. In commercial LPG, aim for less than {currency}12–{currency}15 gas cost per plate.\n"
    elif "why" in q and net_profit < 0:
        md += f"💡 **Why Profit is Low**: Your total expenses ({currency}{p['total_expenses']}) exceeded sales ({currency}{p['total_revenue']}). Cooking batches and initial ingredient procurement were logged, but more plates need to be sold today to reach break-even!\n"
    elif net_profit > 0:
        md += f"🚀 **Health Check**: Great performance! You are operating at a healthy **{margin}% Net Margin**. Biryani business target is usually 35%–50%.\n"
    else:
        md += f"💡 **Break-Even Notice**: You need approx {max(1, int(abs(net_profit) / 160))} more Biryani plates sold today to turn profitable.\n"

    return {
        "type": "pnl_copilot",
        "reply": md,
        "data": p,
        "action": "view_pnl",
    }
