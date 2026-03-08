---
author: Elvir Kaqanolli
categories:
- MySQL
- PostgreSQL
- Backend
- System Design
- Database Architecture
date: 2026-03-08
description: Learn when to shard vs. partition your database from a
  seasoned backend engineer who's scaled systems beyond single servers.
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

If you've optimized every query, added all the right indexes, and your
database is *still* struggling under growth---welcome to the next level.

After scaling databases for e-commerce platforms handling millions of
orders and SaaS products with petabytes of data, I've learned that
**choosing between sharding and partitioning can make or break your
architecture**.

Here's how to decide which strategy is right for your situation.

```{=html}
<!--more-->
```
> Already optimized your queries? Skip to the decision framework.

------------------------------------------------------------------------

## 1. First, Understand the Limits of Optimization

Before we dive in, let's be clear: sharding and partitioning are **not
substitutes for optimization**.

Once your queries are lean, ask yourself:

**Is my data outgrowing a single server?**

Signs it might be time:

-   Backups take hours
-   `ALTER TABLE` runs for minutes (or fails)
-   Disk I/O is consistently near 100%
-   You're frequently pruning old data manually

------------------------------------------------------------------------

## 2. What Is Database Partitioning? (Logical Splits)

Partitioning divides a single table into smaller physical pieces while
keeping the logical table intact.

From the application's perspective, it's still **one table**.

### Example: Range Partitioning in MySQL

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

When querying orders from 2021, MySQL scans only the `p_2021` partition.

### When Partitioning Shines

  Use Case           Why It Works
  ------------------ ----------------------------------------------
  Time-series data   Queries filter by date
  Easy archival      Drop old partitions instead of large DELETEs
  Maintenance        Optimize partitions independently

### The Catch

All partitions still live on the **same server**.

Partitioning improves organization and performance but **does not
increase total server capacity**.

------------------------------------------------------------------------

## 3. What Is Database Sharding? (Physical Splits)

Sharding distributes data across **multiple independent database
servers**.

Each shard stores only part of the dataset.

### Conceptual Example

``` python
def get_shard(customer_id):
    shard_id = customer_id % 8
    return shard_connections[shard_id]

conn = get_shard(123)
conn.execute("SELECT * FROM orders WHERE customer_id = 123")
```

### When Sharding Becomes Necessary

-   Data exceeds a single server's capacity
-   Extremely high write throughput
-   Geographic distribution requirements
-   Regulatory data locality rules

### The Hard Truth

Sharding adds complexity:

-   Cross-shard queries become difficult
-   Distributed transactions are risky
-   Schema migrations must run across all shards
-   Resharding is operationally complex

------------------------------------------------------------------------

## 4. Sharding vs Partitioning

  Aspect         Partitioning    Sharding
  -------------- --------------- ------------------
  Location       Single server   Multiple servers
  Complexity     Low             High
  SQL support    Full            Limited
  Transactions   Easy            Hard
  Scaling        Limited         Horizontal
  Data size      100GB--1TB      Multi‑TB
  Setup          Minutes         Weeks

------------------------------------------------------------------------

## 5. Decision Framework

### Can partitioning solve it?

✔ Natural data boundaries\
✔ Queries target specific partitions\
✔ Still fits on one strong server

➡ Start with partitioning.

### Do you truly need sharding?

❌ Server CPU / IO maxed out\
❌ Dataset larger than 5--10TB\
❌ 10k+ writes per second\
❌ Geographic data distribution

➡ Prepare for sharding.

------------------------------------------------------------------------

## 6. Real‑World Example

An e‑commerce platform grew to **50 million orders**.

**Phase 1:** Partitioning by `YEAR(created_at)`.

Dropping old data:

``` sql
ALTER TABLE orders DROP PARTITION p_2018;
```

**Phase 2:** Write load maxed out.

Solution: shard by `customer_id` across **8 servers**.

Partitioning delayed sharding by several years.

------------------------------------------------------------------------

## 7. Common Pitfalls

### Bad Sharding Key

``` sql
-- Bad: auto increment id
-- Causes shard hotspots
```

Better:

``` sql
-- customer_id or user_id
```

### Too Many Partitions

Avoid thousands of partitions.

Prefer **monthly or yearly partitions**.

### Forgetting Resharding

Plan how you'll rebalance shards as data grows.

### Ignoring Secondary Indexes

Queries not using the shard key may require **scatter‑gather across
shards**.

------------------------------------------------------------------------

## Scaling Playbook

1.  Optimize queries
2.  Add partitioning around \~100GB tables
3.  Shard only when single‑server scaling is exhausted
4.  Monitor using query logs and metrics

------------------------------------------------------------------------

## Final Thought

The best scaling strategy is the one you don't need because you
optimized well.

But when you do:

**Partitioning organizes.\
Sharding distributes.**

Know the difference before your database forces the decision.
