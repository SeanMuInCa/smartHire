import sqlite3
import os

# 确保数据库目录存在
DB_DIR = os.path.dirname(__file__)
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "recruitment.db")

def clear_database():
    """清除数据库中的所有数据"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 删除所有表中的数据
        cursor.execute("DELETE FROM candidates")
        
        # 重置自增ID
        cursor.execute("DELETE FROM sqlite_sequence WHERE name='candidates'")
        
        conn.commit()
        print("✅ 数据库数据已清除")
        
    except Exception as e:
        print(f"❌ 清除数据库数据失败: {str(e)}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    clear_database() 