from sqlalchemy import create_engine, text
import pandas as pd
import numpy as np

# Create an SQLAlchemy engine
engine = create_engine("postgresql+psycopg2://postgres:654321@localhost:5432/rescueplex")


# 1️⃣ Fetch damage data
def fetch_damage_data():
    """
    Fetch the number of buildings in each damage category from the database using SQLAlchemy.
    """
    try:
        query = """
        SELECT damage_id, building_no_damage, 
               building_minor_damage, 
               building_major_damage, 
               building_total_destruction
        FROM damage_assessment;
        """
        with engine.connect() as conn:
            data = pd.read_sql_query(text(query), conn)
        return data
    except Exception as e:
        print(f"❌ Error fetching damage data: {e}")
        return None


# 2️⃣ Fetch resource data
def fetch_resource_data():
    """
    Fetch the available resources from the database using SQLAlchemy.
    """
    try:
        query = "SELECT resource_id, resource_name, quantity FROM resources;"
        with engine.connect() as conn:
            data = pd.read_sql_query(text(query), conn)
        return data
    except Exception as e:
        print(f"❌ Error fetching resource data: {e}")
        return None


# 3️⃣ Update resources
def update_resources(resource_name, allocated_quantity):
    """
    Deduct allocated resources from the resources table while ensuring non-negative stock.
    """
    try:
        allocated_quantity = int(allocated_quantity)  # ✅ Convert numpy.int64 to standard Python int
        
        query = """
        UPDATE resources
        SET quantity = GREATEST(quantity - :allocated_quantity, 0)
        WHERE resource_name = :resource_name;
        """
        with engine.connect() as conn:
            conn.execute(text(query), {"allocated_quantity": allocated_quantity, "resource_name": resource_name})
            conn.commit()
        print(f"✅ Updated resources: {allocated_quantity} units deducted from {resource_name}.")
    except Exception as e:
        print(f"❌ Error updating resources: {e}")


# 4️⃣ Log resource allocation
def log_allocation(damage_id, resource_id, allocated_quantity, user_id=1):
    """
    Log resource allocation into the resource_allocation table using SQLAlchemy.
    """
    try:
        query = """
        INSERT INTO resource_allocation (damage_id, resource_id, allocated_quantity, allocation_time, user_id)
        VALUES (:damage_id, :resource_id, :allocated_quantity, NOW(), :user_id);
        """
        with engine.begin() as conn:
            conn.execute(
                text(query),
                {
                    "damage_id": int(damage_id),
                    "resource_id": int(resource_id),
                    "allocated_quantity": int(allocated_quantity),
                    "user_id": int(user_id),
                },
            )
        print(f"✅ Logged allocation: {allocated_quantity} units for damage_id {damage_id} (resource_id {resource_id}).")
    except Exception as e:
        print(f"❌ Error logging allocation: {e}")


# 5️⃣ Fetch updated available resources
def fetch_available_resources():
    """
    Fetch the latest available resource quantities after allocations.
    """
    try:
        query = "SELECT resource_name, quantity FROM resources;"
        with engine.connect() as conn:
            data = pd.read_sql_query(text(query), conn)
        return data
    except Exception as e:
        print(f"❌ Error fetching available resources: {e}")
        return None


# 6️⃣ Fetch allocation history
def fetch_allocation_history():
    """
    Fetch the latest resource allocation records.
    """
    try:
        query = """
        SELECT ra.allocation_id, da.damage_id, da.building_minor_damage, da.building_major_damage, 
               da.building_total_destruction, r.resource_name, ra.allocated_quantity, ra.allocation_time, u.username
        FROM resource_allocation ra
        JOIN damage_assessment da ON ra.damage_id = da.damage_id
        JOIN resources r ON ra.resource_id = r.resource_id
        JOIN users u ON ra.user_id = u.user_id
        ORDER BY ra.allocation_time DESC;
        """
        with engine.connect() as conn:
            data = pd.read_sql_query(text(query), conn)
        return data
    except Exception as e:
        print(f"❌ Error fetching allocation history: {e}")
        return None
