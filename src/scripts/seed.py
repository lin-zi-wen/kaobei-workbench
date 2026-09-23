#!/usr/bin/env python3
"""
Seed script using Python sqlite3 (fallback when npm is unavailable).
Official TypeScript version: seed.ts (uses better-sqlite3 + Drizzle ORM).
"""

import json
import sqlite3
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "app.db"
MIGRATION_SQL = PROJECT_ROOT / "src" / "db" / "migrations" / "0000_initial.sql"
SEED_JSON = PROJECT_ROOT / "src" / "scripts" / "seed-data.json"

def init_db():
    DATA_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode = WAL")
    return conn

def run_migrations(conn):
    sql = MIGRATION_SQL.read_text(encoding="utf-8")
    statements = [s.strip() for s in sql.split(";") if s.strip()]
    for stmt in statements:
        conn.execute(stmt + ";")
    conn.commit()
    print("[seed] Migrations applied.")

def insert_many(conn, table, rows):
    if not rows:
        return 0
    cols = list(rows[0].keys())
    col_str = ", ".join(cols)
    placeholders = ", ".join(["?"] * len(cols))
    sql = f"INSERT INTO {table} ({col_str}) VALUES ({placeholders})"
    cur = conn.cursor()
    count = 0
    for row in rows:
        values = [row.get(c) for c in cols]
        cur.execute(sql, values)
        count += 1
    conn.commit()
    return count

def main():
    seed_data = json.loads(SEED_JSON.read_text(encoding="utf-8"))
    conn = init_db()
    run_migrations(conn)

    counts = {}
    counts["exam_config"] = insert_many(conn, "exam_config", seed_data.get("exam_config", []))
    counts["subjects"] = insert_many(conn, "subjects", seed_data.get("subjects", []))
    counts["chapters"] = insert_many(conn, "chapters", seed_data.get("chapters", []))
    counts["knowledge_points"] = insert_many(conn, "knowledge_points", seed_data.get("knowledge_points", []))
    counts["knowledge_items"] = insert_many(conn, "knowledge_items", seed_data.get("knowledge_items", []))
    counts["questions"] = insert_many(conn, "questions", seed_data.get("questions", []))
    counts["answer_records"] = insert_many(conn, "answer_records", seed_data.get("answer_records", []))
    counts["mistake_records"] = insert_many(conn, "mistake_records", seed_data.get("mistake_records", []))
    counts["notes"] = insert_many(conn, "notes", seed_data.get("notes", []))
    counts["study_records"] = insert_many(conn, "study_records", seed_data.get("study_records", []))
    counts["mock_exam_records"] = insert_many(conn, "mock_exam_records", seed_data.get("mock_exam_records", []))
    counts["study_reports"] = insert_many(conn, "study_reports", seed_data.get("study_reports", []))
    counts["ai_sessions"] = insert_many(conn, "ai_sessions", seed_data.get("ai_sessions", []))
    counts["ai_messages"] = insert_many(conn, "ai_messages", seed_data.get("ai_messages", []))
    counts["badges"] = insert_many(conn, "badges", seed_data.get("badges", []))
    counts["user_badges"] = insert_many(conn, "user_badges", seed_data.get("user_badges", []))
    counts["settings"] = insert_many(conn, "settings", seed_data.get("settings", []))
    counts["file_assets"] = insert_many(conn, "file_assets", seed_data.get("file_assets", []))
    counts["overdue_scan_logs"] = insert_many(conn, "overdue_scan_logs", seed_data.get("overdue_scan_logs", []))

    print("\n[seed] Insert counts:")
    for table, cnt in counts.items():
        print(f"  {table}: {cnt}")

    # Verification
    cur = conn.cursor()
    ki_count = cur.execute("SELECT COUNT(*) FROM knowledge_items").fetchone()[0]
    past_exam_count = cur.execute("SELECT COUNT(*) FROM knowledge_items WHERE category = 'past_exam'").fetchone()[0]
    damaged_count = cur.execute("SELECT COUNT(*) FROM knowledge_items WHERE status = 'failed'").fetchone()[0]
    subject_count = cur.execute("SELECT COUNT(*) FROM subjects").fetchone()[0]
    badge_count = cur.execute("SELECT COUNT(*) FROM badges").fetchone()[0]
    chapter_count = cur.execute("SELECT COUNT(*) FROM chapters").fetchone()[0]
    settings_count = cur.execute("SELECT COUNT(*) FROM settings").fetchone()[0]

    print("\n[seed] Verification:")
    print(f"  knowledge_items total: {ki_count} (expected: 138)")
    print(f"  past_exam items: {past_exam_count}")
    print(f"  damaged items: {damaged_count} (expected: 1)")
    print(f"  subjects: {subject_count} (expected: 3)")
    print(f"  chapters: {chapter_count} (expected: 16)")
    print(f"  badges: {badge_count} (expected: 7)")
    print(f"  settings: {settings_count} (expected: 1)")

    # Check past exam roll entries (17 years)
    rolls = cur.execute("""
        SELECT title FROM knowledge_items WHERE category = 'past_exam'
        AND title LIKE '%真题卷%'
        ORDER BY title
    """).fetchall()
    print(f"\n[seed] Past exam rolls: {len(rolls)} (expected: 17)")
    for r in rolls:
        print(f"    - {r[0]}")

    passed = ki_count == 138 and damaged_count == 1 and subject_count == 3 and len(rolls) == 17
    print(f"\n[seed] {'PASSED' if passed else 'FAILED'}")

    conn.close()
    return 0 if passed else 1

if __name__ == "__main__":
    sys.exit(main())
