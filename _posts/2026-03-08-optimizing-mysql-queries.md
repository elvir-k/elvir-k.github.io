---
layout: post
title: "Optimizing MySQL Queries: 7 Battle-Tested Techniques"
date: 2026-03-08
categories: [MySQL, Performance, Backend, Database Optimization]
tags: [mysql, query optimization, indexing, performance tuning, sql]
description: "Learn practical MySQL optimization techniques from a seasoned backend engineer."
author: Elvir Kaqanolli
reading_time: 7
icon: ⚡
image: /assets/images/blog/mysql-optimization.jpg
---

If your application feels sluggish, the database is often the culprit.
After years of tuning queries for high‑traffic e‑commerce sites and
analytics dashboards, I've learned that **a few well‑placed indexes and
a rewritten query can turn a 5‑second page load into 200ms.**

Here are the battle‑tested techniques I use to squeeze every millisecond
out of MySQL.

```{=html}
<!--more-->
```
*→ Want to jump ahead?* [Skip to the summary](#summary)

------------------------------------------------------------------------

## 1. Always Use `EXPLAIN` First

Before you change anything, understand what MySQL is actually doing.
Prefix your query with `EXPLAIN` and look for:

-   **`type`** -- `ALL` means a full table scan (bad). `ref` or `range`
    with an index is good.
-   **`rows`** -- the number of rows examined. High numbers mean you're
    doing too much work.
-   **`Extra`** -- `Using temporary` or `Using filesort` are red flags
    for complex operations.

```{=html}
<!-- -->
```
    EXPLAIN SELECT * FROM orders WHERE customer_id = 123 ORDER BY created_at DESC;

If you see `type: ALL`, MySQL is scanning the entire table --- which
becomes disastrous once your table reaches millions of rows.

**Goal:** Ensure queries use indexes whenever possible.

------------------------------------------------------------------------

## 2. Create Strategic Indexes (Not Too Many)

Indexes are the **#1 performance improvement tool**, but they must be
used carefully.

Bad approach:

    INDEX(name)
    INDEX(email)
    INDEX(created_at)

Better approach --- **composite indexes** that match real queries:

    INDEX(customer_id, created_at)

Why?

Because this query:

    SELECT *
    FROM orders
    WHERE customer_id = 123
    ORDER BY created_at DESC
    LIMIT 10;

can be resolved **directly from the index**, avoiding extra sorting and
scanning.

### Rule of Thumb

Indexes should match the **WHERE → ORDER BY → LIMIT** pattern of your
most frequent queries.

But remember: every index slightly slows **INSERT / UPDATE**, so don't
index everything blindly.

------------------------------------------------------------------------

## 3. Avoid `SELECT *`

`SELECT *` forces MySQL to read **every column**, even if you only need
two.

Bad:

    SELECT * FROM users WHERE id = 5;

Better:

    SELECT id, name, email FROM users WHERE id = 5;

Benefits:

-   Less disk I/O
-   Smaller result sets
-   Better use of **covering indexes**

In high-traffic systems this can shave **tens of milliseconds per
request**.

------------------------------------------------------------------------

## 4. Watch Out for the N+1 Query Problem

This is one of the **most common performance killers** in backend
applications.

Example (bad):

    SELECT * FROM orders;

    -- then for each order
    SELECT * FROM customers WHERE id = ?

If you have 100 orders, you now run **101 queries**.

Better approach --- use a **JOIN**:

    SELECT
        o.id,
        o.total,
        c.name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id;

One query instead of hundreds.

ORMs (Laravel, Django, etc.) often hide this problem --- so always
inspect generated SQL.

------------------------------------------------------------------------

## 5. Use `LIMIT` for Large Datasets

Never load thousands of rows if the user only sees 20.

Bad:

    SELECT * FROM products ORDER BY created_at DESC;

Better:

    SELECT *
    FROM products
    ORDER BY created_at DESC
    LIMIT 20;

For pagination:

    LIMIT 20 OFFSET 40

Even better for large datasets: **cursor-based pagination**.

Example:

    SELECT *
    FROM products
    WHERE id < 1050
    ORDER BY id DESC
    LIMIT 20;

This avoids large offset scans.

------------------------------------------------------------------------

## 6. Optimize `COUNT(*)` Queries

Counting rows in massive tables can be expensive.

Instead of:

    SELECT COUNT(*) FROM orders;

Consider:

-   caching counts
-   maintaining counters in another table
-   using approximate analytics tables

For dashboards, **cached counts are usually more than enough**.

------------------------------------------------------------------------

## 7. Profile Slow Queries

Enable MySQL slow query log:

    slow_query_log = 1
    long_query_time = 1

This logs queries taking longer than **1 second**.

Then analyze them with tools like:

-   `mysqldumpslow`
-   `pt-query-digest`

Often you'll discover that **one poorly written query is responsible for
most of your load**.

------------------------------------------------------------------------

# Summary

If you remember only a few things from this article:

-   Always run `EXPLAIN`
-   Design **indexes around real queries**
-   Avoid `SELECT *`
-   Eliminate **N+1 queries**
-   Use `LIMIT`
-   Cache expensive counts
-   Monitor slow queries

These techniques have helped me improve database performance
**10--100x** in production systems.

Database optimization isn't about magic --- it's about **understanding
how the engine executes your queries**.

------------------------------------------------------------------------

## Final Tip

Before scaling servers or upgrading hardware, **optimize the queries
first**.

A single index can save you **thousands of dollars in infrastructure**.

------------------------------------------------------------------------

If you enjoyed this article, consider bookmarking it for future
reference or sharing it with your team.

More backend engineering deep dives coming soon ⚡
