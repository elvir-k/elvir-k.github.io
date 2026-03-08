---
author: Elvir Kaqanolli
categories:
- MySQL
- Performance
- Backend
- Database Optimization
date: 2026-03-08
description: Learn practical MySQL optimization techniques from a
  seasoned backend engineer.
icon: ⚡
image: /assets/images/blog/mysql-optimization.jpg
layout: post
reading_time: 7
tags:
- mysql
- query optimization
- indexing
- performance tuning
- sql
title: "Optimizing MySQL Queries: 7 Battle-Tested Techniques"
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
Prefix your query with `EXPLAIN` and inspect the execution plan.

``` sql
EXPLAIN SELECT *
FROM orders
WHERE customer_id = 123
ORDER BY created_at DESC;
```

Pay attention to:

-   **type** -- `ALL` means a full table scan (bad). `ref`, `range`, or
    `const` are usually good.
-   **rows** -- how many rows MySQL expects to examine.
-   **Extra** -- `Using temporary` or `Using filesort` can indicate
    inefficiencies.

If you see `type: ALL`, MySQL is scanning the entire table --- which
becomes disastrous once your table reaches millions of rows.

**Goal:** ensure your queries use indexes whenever possible.

------------------------------------------------------------------------

## 2. Create Strategic Indexes (Not Too Many)

Indexes are the **single biggest performance improvement** you can make.

Bad approach:

``` sql
INDEX(name)
INDEX(email)
INDEX(created_at)
```

Better approach --- **composite indexes** designed around real queries:

``` sql
INDEX(customer_id, created_at)
```

Why this works:

``` sql
SELECT *
FROM orders
WHERE customer_id = 123
ORDER BY created_at DESC
LIMIT 10;
```

MySQL can read directly from the index without additional sorting.

### Rule of thumb

Design indexes around the pattern:

**WHERE → ORDER BY → LIMIT**

But remember: every index slightly slows **INSERT** and **UPDATE**
operations, so avoid indexing everything blindly.

------------------------------------------------------------------------

## 3. Avoid `SELECT *`

Using `SELECT *` forces MySQL to read every column even when you only
need a few.

Bad:

``` sql
SELECT * FROM users WHERE id = 5;
```

Better:

``` sql
SELECT id, name, email
FROM users
WHERE id = 5;
```

Benefits:

-   Less disk I/O
-   Smaller result sets
-   Better use of **covering indexes**

On busy systems this can easily shave **tens of milliseconds per
request**.

------------------------------------------------------------------------

## 4. Watch Out for the N+1 Query Problem

This is one of the **most common performance killers** in backend
applications.

Example (bad):

``` sql
SELECT * FROM orders;
```

Then for each order:

``` sql
SELECT * FROM customers WHERE id = ?;
```

If you fetch 100 orders, you now execute **101 queries**.

Better solution: use a **JOIN**.

``` sql
SELECT
    o.id,
    o.total,
    c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id;
```

One query instead of hundreds.

Many ORMs (Laravel, Django, Rails) can accidentally create N+1 queries,
so always inspect the generated SQL.

------------------------------------------------------------------------

## 5. Use `LIMIT` for Large Datasets

Never load thousands of rows if the user only sees 20.

Bad:

``` sql
SELECT *
FROM products
ORDER BY created_at DESC;
```

Better:

``` sql
SELECT *
FROM products
ORDER BY created_at DESC
LIMIT 20;
```

For pagination:

``` sql
LIMIT 20 OFFSET 40;
```

However, **large offsets become slow** on big tables.

A faster approach is **cursor-based pagination**:

``` sql
SELECT *
FROM products
WHERE id < 1050
ORDER BY id DESC
LIMIT 20;
```

This avoids scanning large offsets.

------------------------------------------------------------------------

## 6. Optimize `COUNT(*)` Queries

Counting rows in huge tables can be expensive.

Example:

``` sql
SELECT COUNT(*) FROM orders;
```

Instead consider:

-   Caching counts in Redis or memory
-   Maintaining counters in a summary table
-   Using approximate counts for dashboards

For analytics dashboards, **cached counts are often perfectly
acceptable**.

------------------------------------------------------------------------

## 7. Profile Slow Queries

Enable MySQL's slow query log to find bottlenecks.

Example configuration:

``` sql
slow_query_log = 1
long_query_time = 1
```

This logs queries that take longer than **1 second**.

Useful analysis tools include:

-   `mysqldumpslow`
-   `pt-query-digest`

In many production systems, **a handful of bad queries cause the
majority of performance issues**.

------------------------------------------------------------------------

## Summary

If you remember only a few things from this article:

-   Always run **EXPLAIN**
-   Design **indexes around real queries**
-   Avoid **SELECT **\* when possible
-   Eliminate **N+1 queries**
-   Use **LIMIT**
-   Cache expensive counts
-   Monitor slow queries

These techniques have helped improve database performance **10--100×**
in real production systems.

Database optimization isn't magic --- it's about **understanding how the
database engine executes your queries**.

------------------------------------------------------------------------

## Final Tip

Before upgrading servers or scaling infrastructure, **optimize the
queries first**.

A single well-designed index can save you **thousands of dollars in
infrastructure costs**.

------------------------------------------------------------------------

If you enjoyed this article, consider bookmarking it or sharing it with
your team.

More backend engineering deep dives coming soon ⚡