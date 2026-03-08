---
layout: post
title: "Optimizing MySQL Queries: Lessons from the Trenches"
date: 2026-03-08
categories: [MySQL, Performance, Backend]
reading_time: 6
icon: ⚡
---

If your application feels sluggish, the database is often the culprit. After years of tuning queries for high‑traffic e‑commerce sites and analytics dashboards, I’ve learned that **a few well‑placed indexes and a rewritten query can turn a 5‑second page load into 200ms.**

Here are the battle‑tested techniques I use to squeeze every millisecond out of MySQL.

## 1. Always Use `EXPLAIN` First

Before you change anything, understand what MySQL is actually doing. Prefix your query with `EXPLAIN` and look for:

- **`type`** – `ALL` means a full table scan (bad). `ref` or `range` with an index is good.
- **`rows`** – the number of rows examined. High numbers mean you're doing too much work.
- **`Extra`** – `Using temporary` or `Using filesort` are red flags for complex operations.

```sql
EXPLAIN SELECT * FROM orders WHERE customer_id = 123 ORDER BY created_at DESC;
