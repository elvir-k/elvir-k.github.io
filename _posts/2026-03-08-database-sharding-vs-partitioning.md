markdown
---
author: Elvir Kaqanolli
categories:
- MySQL
- PostgreSQL
- Backend
- System Design
- Database Architecture
date: 2026-03-15
description: Learn when to shard vs. partition your database from a seasoned backend engineer who's scaled systems beyond single servers.
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
title: "Database Sharding vs. Partitioning: A Practical Guide for Scaling Your Backend"
---

If you've optimized every query, added all the right indexes, and your database is *still* struggling under growth—welcome to the next level.

After scaling databases for e‑commerce platforms handling millions of orders and SaaS products with petabytes of data, I've learned that **choosing between sharding and partitioning can make or break your architecture**.

Here's how to decide which strategy is right for your situation.

```{=html}
<!--more-->
→ Already optimized your queries? Skip to the decision framework

1. First, Understand the Limits of Optimization
Before we dive in, let's be clear: sharding and partitioning are not substitutes for optimization. They're what you do after you've applied techniques from my previous post on query optimization.

Once your queries are lean, you need to ask: Is my data outgrowing a single server?

Signs it might be time:

Backups take hours

ALTER TABLE runs for minutes (or fails)

Disk I/O is consistently near 100%

You're frequently pruning old data manually

If any of these sound familiar, read on.

2. What Is Database Partitioning? (Logical Splits)
Partitioning divides a single table into smaller physical pieces while keeping the logical table intact. From your application's perspective, it's still one table—MySQL or PostgreSQL handles where each row lives.

Example: Range Partitioning in MySQL
sql
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
Now when you query for orders from 2021, MySQL only scans the p_2021 partition—much faster than scanning the entire table.

When Partitioning Shines
Use Case	Why It Works
Time‑series data (logs, events, orders)	Queries almost always filter by date range
Easy archival	Just drop old partitions instead of DELETE FROM huge_table
Improved maintenance	OPTIMIZE TABLE can run on a single partition
The Catch
All partitions still live on the same database server. You're not adding more hardware—you're just organizing your data better. Partitioning helps with performance and manageability, but not with write throughput or total data size beyond what one machine can handle.

3. What Is Database Sharding? (Physical Splits)
Sharding distributes data across multiple independent database servers. Each shard holds a subset of the data and operates completely independently.

Unlike partitioning, sharding is not built into MySQL or PostgreSQL (though there are extensions and proxies). You typically implement it in your application logic or via a middleware layer.

Conceptual Example
python
# Application code decides which shard to use
def get_shard(customer_id):
    shard_id = customer_id % 8  # 8 shards
    return shard_connections[shard_id]

# Then query the appropriate shard
conn = get_shard(123)
conn.execute("SELECT * FROM orders WHERE customer_id = 123")
When Sharding Becomes Necessary
Data no longer fits on a single server (multi‑terabyte scale)

Write throughput exceeds one server's capacity (thousands of writes/sec)

Geographic distribution—place data closer to users

Regulatory requirements—keep data in specific regions

The Hard Truth
Sharding adds serious complexity:

Cross‑shard queries are impossible (or require fan‑out and client‑side joins)

Transactions across shards become difficult (distributed transactions are slow and risky)

Schema changes must be rolled out carefully across all shards

Resharding (adding/removing shards) is a major operation

4. Sharding vs. Partitioning: The Core Differences
Aspect	Partitioning	Sharding
Location	Single server	Multiple servers
Complexity	Low (built into database)	High (app‑level or proxy)
Querying	Full SQL support, transparent	Limited—no cross‑shard joins
Transactions	Full ACID across partitions	Difficult across shards
Scaling	Better organization, but still one server	True horizontal scaling
Typical data size	100GB–1TB per table	Multi‑TB, multi‑server
Setup time	Minutes (ALTER TABLE ... PARTITION BY)	Weeks (architecture, testing, migration)
5. How to Choose: A Decision Framework
Ask yourself these questions in order. Be honest—simpler is almost always better.

Question 1: Can partitioning solve my problem?
✅ Does my data have natural time or category boundaries? (e.g., orders by month, users by region)

✅ Do most queries target a specific partition? (e.g., "show me last month's orders")

✅ Can I still fit everything on one powerful server with good I/O?

If yes → Start with partitioning. It's built into your database, requires no application changes, and can buy you years of headroom.

Question 2: Do I truly need sharding?
❌ Is my single server maxed on CPU, disk I/O, or network?

❌ Is data growing beyond 5–10TB, making backups and restores impractical?

❌ Am I hitting 10,000+ writes per second?

❌ Do I need geographic data distribution for latency or compliance?

If yes → Prepare for sharding. This is a major architectural shift that will affect every part of your system.

6. Real-World Example: E-Commerce Orders
I once worked on a platform that hit 50 million orders and kept growing.

Phase 1 (Years 1–2): Partitioning by YEAR(created_at). Queries stayed fast, old partitions archived easily. We could drop 2018 data with a single ALTER TABLE ... DROP PARTITION.

Phase 2 (Year 3): Write load maxed out the master. Partitioning couldn't help—writes still went to the latest partition on the same server. We sharded by customer_id across 8 servers.

The lesson: Partitioning bought us years before sharding became necessary. When we finally sharded, we had a clean data model and clear sharding key (customer_id) ready.

7. Common Pitfalls to Avoid
Sharding without a good key
sql
-- Bad: Sharding by auto-increment ID
-- All new writes go to the last shard (hotspot)
-- Better: Shard by customer_id, user_id, or something with natural distribution
Partitioning too granularly
sql
-- Bad: Daily partitions for 10 years
-- 3,650 partitions = metadata nightmare, query planner overhead
-- Stick to monthly or yearly unless you have a strong reason
Forgetting about resharding
No sharding strategy is permanent. Data grows, access patterns change. Plan for rebalancing from day one—even if it's just a document that says "when we hit 80% capacity, we'll..."

Ignoring secondary indexes
In a sharded system, indexes are per shard. Queries that filter on non‑shard‑key columns must be sent to all shards (scatter/gather). Design your queries around the shard key.

Summary: Your Scaling Playbook
Start with optimization – queries, indexes, caching. (Read Optimizing MySQL Queries if you haven't.)

Add partitioning when tables grow beyond 100GB and queries show clear partition pruning.

Consider sharding only when you've exhausted single‑server options and have a clear sharding key.

Monitor relentlessly – use tools like pt-query-digest, Prometheus, and slow query logs to know when you're approaching limits.

Database scaling isn't about choosing the flashiest technology—it's about applying the right solution at the right time.

Final Thought
The best scaling strategy is the one you don't need because you optimized well. But when you do need it, make the choice deliberately.

Partitioning organizes. Sharding distributes. Know the difference before your database forces the decision for you.

Want to dive deeper into any of these topics? Reach out on Twitter or check out my system design newsletter.

Next up: Database replication strategies for high availability. ⚡

text

**Instructions:**
1. Save the content as `database-sharding-vs-partitioning.md`.
2. Place it in your blog's `_posts` directory (or wherever your static site generator expects posts).
3. Update the `date` field to your intended publication date.
4. Create the corresponding image at `/assets/images/blog/database-sharding-partitioning.jpg` (or update the path).
5. Review the internal link to your previous MySQL post and update the URL if needed.

Let me know if you'd like any adjustments!
