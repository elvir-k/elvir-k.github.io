---
author: Elvir Kaqanolli
categories:
- MySQL
- PostgreSQL
- Backend
- System Design
- Database Architecture
date: 2026-03-08
description: Learn when to shard vs partition your database. A practical
  backend engineering guide explaining scaling strategies for MySQL and
  PostgreSQL.
icon: 🗄️
image: /assets/images/blog/database-sharding-partitioning.jpg
layout: post
reading_time: 8
tags:
- database sharding
- database partitioning
- horizontal scaling
- mysql scaling
- postgresql
- system design
title: "Database Sharding vs. Partitioning: A Practical Guide for
  Scaling Your Backend"
---

# Database Sharding vs. Partitioning

Scaling databases is one of the most important challenges backend
engineers face.

If you've optimized every query, added indexes, tuned caches, and your
database **still struggles under growth**, you're entering the next
stage of scaling architecture.

After working on systems processing **millions of e‑commerce orders and
multi‑terabyte SaaS datasets**, one lesson becomes clear:

> Choosing between **sharding** and **partitioning** can determine
> whether your system scales smoothly or collapses under load.

This guide explains **when to use partitioning, when to shard, and how
to decide between them.**

------------------------------------------------------------------------

```{=html}

```
## 1. Understand the Limits of Optimization

Before introducing architectural complexity, ensure you've already
optimized your database.

Sharding and partitioning are **not replacements for good query
design**.

Ask yourself:

**Is the dataset outgrowing a single machine?**

### Warning signs

-   Backups take hours
-   `ALTER TABLE` operations take minutes or fail
-   Disk I/O constantly sits near **100%**
-   You frequently delete or archive old data manually

If these symptoms appear, it may be time to restructure how your data is
stored.

------------------------------------------------------------------------

# 2. What Is Database Partitioning?

Partitioning divides **one logical table** into smaller physical
segments.

From the application's perspective, it still behaves like **a single
table**.

The database engine decides which partition contains the requested rows.

## Example: Range Partitioning in MySQL

``` sql
CREATE TABLE orders (
    id INT NOT NULL,
    order_date DATE,
    amount DECIMAL(10,2),
    customer_id INT
)
PARTITION BY RANGE (YEAR(order_date)) (
    PARTITION p_old VALUES LESS THAN (2020),
    PARTITION p_2020 VALUES LESS THAN (2021),
    PARTITION p_2021 VALUES LESS THAN (2022),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

When querying 2021 orders, MySQL scans only the `p_2021` partition
instead of the entire dataset.

This technique is called **partition pruning**.

------------------------------------------------------------------------

## When Partitioning Works Best

  Use Case             Why It Works
  -------------------- ------------------------------------------
  Time-series data     Queries typically filter by date
  Logs or analytics    Data naturally groups by time
  Archiving old data   Old partitions can be dropped instantly
  Maintenance          Operations can run on a single partition

### Example

Instead of:

``` sql
DELETE FROM orders WHERE created_at < '2018-01-01';
```

You can simply drop a partition:

``` sql
ALTER TABLE orders DROP PARTITION p_2018;
```

------------------------------------------------------------------------

## Partitioning Limitations

Partitioning improves organization and query performance, but
**everything still runs on one database server**.

This means:

-   Storage is still limited to one machine
-   Write throughput is unchanged
-   CPU and disk I/O remain a bottleneck

Partitioning **improves efficiency**, but it **does not horizontally
scale infrastructure**.

------------------------------------------------------------------------

# 3. What Is Database Sharding?

Sharding distributes data across **multiple database servers**.

Each server stores only part of the dataset.

Instead of one large database, you now have **many smaller databases**
called *shards*.

The application (or a proxy layer) determines which shard stores each
record.

------------------------------------------------------------------------

## Simple Sharding Example

``` python
def get_shard(customer_id):
    shard_id = customer_id % 8
    return shard_connections[shard_id]

conn = get_shard(123)
conn.execute("SELECT * FROM orders WHERE customer_id = 123")
```

This example distributes data across **8 shards** using `customer_id`.

------------------------------------------------------------------------

## When Sharding Becomes Necessary

Sharding becomes unavoidable when:

-   Data exceeds **single-server storage limits**
-   Write throughput exceeds server capacity
-   Applications require **global distribution**
-   Regulations require **data locality**

Large platforms like Netflix, Amazon, and Shopify rely heavily on
sharding.

------------------------------------------------------------------------

# 4. The Hidden Complexity of Sharding

While powerful, sharding introduces serious engineering challenges.

### Cross-shard queries

Queries spanning multiple shards require **scatter‑gather queries**.

### Distributed transactions

ACID guarantees across shards become complex and slow.

### Schema migrations

Every shard must be updated individually.

### Resharding

Adding or removing shards requires **data migration across servers**.

------------------------------------------------------------------------

# 5. Sharding vs Partitioning

  Feature             Partitioning     Sharding
  ------------------- ---------------- ------------------
  Infrastructure      Single server    Multiple servers
  Complexity          Low              High
  SQL Support         Full             Limited
  Transactions        Easy             Hard
  Scaling             Organizational   Horizontal
  Typical Data Size   100GB -- 1TB     Multi‑TB
  Setup Time          Minutes          Weeks

------------------------------------------------------------------------

# 6. Decision Framework

Follow these questions in order.

## Step 1 --- Can partitioning solve the problem?

✔ Data has natural boundaries (time, region, category)\
✔ Queries target specific partitions\
✔ The dataset still fits on one powerful server

**If yes → Use partitioning first.**

It provides **years of additional scalability** with minimal complexity.

------------------------------------------------------------------------

## Step 2 --- Do you truly need sharding?

Consider sharding if:

-   The database server is maxed out on CPU or I/O
-   Data exceeds **5--10 TB**
-   The system handles **10k+ writes per second**
-   Users require global low‑latency access

If several of these are true, begin planning a sharding strategy.

------------------------------------------------------------------------

# 7. Real World Example

An e‑commerce platform reached **50 million orders**.

### Phase 1 --- Partitioning

Orders were partitioned by:

    YEAR(created_at)

This allowed easy archival and faster queries.

### Phase 2 --- Sharding

Eventually write throughput exceeded a single server.

The solution:

    Shard by customer_id across 8 database servers

Partitioning delayed sharding for **multiple years**, buying time to
design the correct architecture.

------------------------------------------------------------------------

# 8. Common Pitfalls

## Poor Sharding Key

Bad example:

``` sql
-- Sharding by auto increment id
```

This creates **hot shards**.

Better options:

    customer_id
    user_id
    tenant_id

------------------------------------------------------------------------

## Too Many Partitions

Daily partitions across years can create **thousands of partitions**,
increasing metadata overhead.

Prefer:

-   Monthly partitions
-   Yearly partitions

------------------------------------------------------------------------

## Ignoring Secondary Indexes

In sharded systems:

Indexes exist **per shard**.

Queries not using the shard key require **fan‑out queries across every
shard**.

------------------------------------------------------------------------

# 9. Scaling Strategy Cheat Sheet

1️⃣ Optimize queries, indexes, and caching\
2️⃣ Add partitioning once tables exceed \~100GB\
3️⃣ Introduce sharding only when single-server scaling is exhausted\
4️⃣ Continuously monitor performance metrics

------------------------------------------------------------------------

# Final Thought

The best scaling strategy is the one you **never needed because
optimization solved the problem**.

But when the time comes:

**Partitioning organizes data.**\
**Sharding distributes data.**

Understanding the difference before you need it can save **months of
engineering work.**

------------------------------------------------------------------------

**Next article:** Database Replication Strategies for High Availability
