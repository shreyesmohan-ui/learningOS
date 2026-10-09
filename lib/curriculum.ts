export type Phase = "practice" | "pretest" | "posttest";
export type Concept = "Filtering" | "Joins" | "Aggregation";
export type Exercise = {
  id: string; title: string; concept: Concept; phase: Phase;
  prompt: string; columns: string[]; solution: string;
  hints: string[]; explanation: string; ordered: boolean;
};
const exercise = (item: Omit<Exercise, "ordered">): Exercise => ({ ...item, ordered: true });
export const exercises: Exercise[] = [
  exercise({ id: "p1", phase: "practice", title: "A local customer list", concept: "Filtering",
    prompt: "Find every customer based in Bengaluru. Return their id and name, ordered by id from smallest to largest.", columns: ["id", "name"],
    solution: "SELECT id, name\nFROM customers\nWHERE city = 'Bengaluru'\nORDER BY id;",
    hints: ["Which column tells you where a customer lives? You need two output columns and one condition.", "Use WHERE to filter rows before choosing their order. Text values belong in single quotes.", "Try WHERE city = 'Bengaluru', then ORDER BY id. Select only id and name."],
    explanation: "WHERE filters individual rows. ORDER BY makes the result deterministic." }),
  exercise({ id: "p2", phase: "practice", title: "Close the first quarter", concept: "Filtering",
    prompt: "Find fulfilled orders placed in the first quarter of 2026. Return id, customer_id, and total, ordered by id. Include January 1 and exclude April 1.", columns: ["id", "customer_id", "total"],
    solution: "SELECT id, customer_id, total\nFROM orders\nWHERE status = 'fulfilled'\n  AND order_date >= '2026-01-01'\n  AND order_date < '2026-04-01'\nORDER BY id;",
    hints: ["An order must pass both the status condition and the date window.", "Combine conditions with AND. A half-open interval includes the start and excludes the next quarter.", "Use order_date >= '2026-01-01' AND order_date < '2026-04-01'. Also check status."],
    explanation: "Half-open date intervals avoid ambiguity at quarter boundaries." }),
  exercise({ id: "p3", phase: "practice", title: "Put a name to the order", concept: "Joins",
    prompt: "Return every order with the customer who placed it. Name the columns order_id and customer_name. Order the result by order_id.", columns: ["order_id", "customer_name"],
    solution: "SELECT o.id AS order_id, c.name AS customer_name\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nORDER BY o.id;",
    hints: ["The two tables share a relationship, not a column name. Which field points from an order to a customer?", "Join orders.customer_id to customers.id. Table aliases keep the two id columns unambiguous.", "Use o.id AS order_id and c.name AS customer_name, with JOIN customers c ON c.id = o.customer_id."],
    explanation: "The foreign key gives each order its matching customer. Aliases name the requested output." }),
  exercise({ id: "p4", phase: "practice", title: "Count everyone, even zero", concept: "Joins",
    prompt: "List all customers and their number of orders, including customers with no orders. Return customer_id, name, and order_count, ordered by customer_id.", columns: ["customer_id", "name", "order_count"],
    solution: "SELECT c.id AS customer_id, c.name, COUNT(o.id) AS order_count\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nGROUP BY c.id, c.name\nORDER BY c.id;",
    hints: ["Which table must keep every row even when there is no match? Start with that table.", "A LEFT JOIN retains customers without orders. COUNT(*) would count their placeholder row too.", "Count o.id, not *. Group by c.id and c.name; order by c.id."],
    explanation: "COUNT(o.id) ignores the NULL created for an unmatched customer; COUNT(*) would return one." }),
  exercise({ id: "p5", phase: "practice", title: "Recognize returning customers", concept: "Aggregation",
    prompt: "Find customers with at least two fulfilled orders. Return customer_id and order_count, ordered by customer_id. Do not count pending or cancelled orders.", columns: ["customer_id", "order_count"],
    solution: "SELECT customer_id, COUNT(*) AS order_count\nFROM orders\nWHERE status = 'fulfilled'\nGROUP BY customer_id\nHAVING COUNT(*) >= 2\nORDER BY customer_id;",
    hints: ["First decide which orders count; then decide which customer groups qualify.", "WHERE filters orders before grouping. HAVING filters the groups after counting.", "Group by customer_id and use HAVING COUNT(*) >= 2 after the fulfilled-status filter."],
    explanation: "WHERE and HAVING operate at different levels: input rows and aggregate groups." }),
  exercise({ id: "p6", phase: "practice", title: "See where revenue comes from", concept: "Aggregation",
    prompt: "Calculate fulfilled-order revenue for each city. Return city and revenue, ordered by revenue from highest to lowest, breaking ties alphabetically by city.", columns: ["city", "revenue"],
    solution: "SELECT c.city, SUM(o.total) AS revenue\nFROM customers c\nJOIN orders o ON o.customer_id = c.id\nWHERE o.status = 'fulfilled'\nGROUP BY c.city\nORDER BY revenue DESC, c.city ASC;",
    hints: ["The grouping dimension lives in customers; the amount lives in orders.", "Join first, filter fulfilled orders, then group by city and sum total.", "Use SUM(o.total) AS revenue and ORDER BY revenue DESC, c.city ASC."],
    explanation: "A join makes the city available to the aggregate. The second sort key resolves ties." }),
  exercise({ id: "b1", phase: "pretest", title: "Customers in Pune", concept: "Filtering", prompt: "Return id and name for customers in Pune, ordered by id.", columns: ["id", "name"], solution: "SELECT id, name FROM customers WHERE city = 'Pune' ORDER BY id;", hints: [], explanation: "" }),
  exercise({ id: "b2", phase: "pretest", title: "An order's destination city", concept: "Joins", prompt: "Return every order's id as order_id and the customer's city, ordered by order_id.", columns: ["order_id", "city"], solution: "SELECT o.id AS order_id, c.city FROM orders o JOIN customers c ON c.id = o.customer_id ORDER BY o.id;", hints: [], explanation: "" }),
  exercise({ id: "b3", phase: "pretest", title: "Fulfilled orders per customer", concept: "Aggregation", prompt: "For customers with fulfilled orders, return customer_id and their count as fulfilled_count. Order by customer_id.", columns: ["customer_id", "fulfilled_count"], solution: "SELECT customer_id, COUNT(*) AS fulfilled_count FROM orders WHERE status = 'fulfilled' GROUP BY customer_id ORDER BY customer_id;", hints: [], explanation: "" }),
  exercise({ id: "t1", phase: "posttest", title: "The next quarter", concept: "Filtering", prompt: "Return id and total for fulfilled orders placed in Q2 2026: April 1 inclusive to July 1 exclusive. Order by id.", columns: ["id", "total"], solution: "SELECT id, total FROM orders WHERE status = 'fulfilled' AND order_date >= '2026-04-01' AND order_date < '2026-07-01' ORDER BY id;", hints: [], explanation: "" }),
  exercise({ id: "t2", phase: "posttest", title: "Who has not ordered?", concept: "Joins", prompt: "Find customers who have never placed an order. Return id and name, ordered by id.", columns: ["id", "name"], solution: "SELECT c.id, c.name FROM customers c LEFT JOIN orders o ON o.customer_id = c.id WHERE o.id IS NULL ORDER BY c.id;", hints: [], explanation: "" }),
  exercise({ id: "t3", phase: "posttest", title: "Cities above the threshold", concept: "Aggregation", prompt: "Find cities whose fulfilled-order revenue exceeds 3000. Return city and revenue, ordered alphabetically by city.", columns: ["city", "revenue"], solution: "SELECT c.city, SUM(o.total) AS revenue FROM customers c JOIN orders o ON o.customer_id = c.id WHERE o.status = 'fulfilled' GROUP BY c.city HAVING SUM(o.total) > 3000 ORDER BY c.city;", hints: [], explanation: "" }),
];
export const schema = [
  { name: "customers", rows: 12, fields: [["id", "integer", "PK"], ["name", "text", ""], ["city", "text", ""]] },
  { name: "orders", rows: 24, fields: [["id", "integer", "PK"], ["customer_id", "integer", "FK"], ["order_date", "date", ""], ["status", "text", ""], ["total", "numeric", ""]] },
];
export const seedSQL = `
CREATE TABLE customers (id integer PRIMARY KEY, name text NOT NULL, city text NOT NULL);
CREATE TABLE orders (id integer PRIMARY KEY, customer_id integer REFERENCES customers(id), order_date date NOT NULL, status text NOT NULL, total numeric(10,2) NOT NULL);
INSERT INTO customers VALUES
(1,'Aanya Rao','Bengaluru'),(2,'Kabir Shah','Mumbai'),(3,'Meera Iyer','Pune'),(4,'Rohan Das','Bengaluru'),
(5,'Sara Khan','Delhi'),(6,'Arjun Nair','Chennai'),(7,'Diya Patel','Mumbai'),(8,'Ishaan Sen','Pune'),
(9,'Leela Menon','Kochi'),(10,'Neel Kapoor','Delhi'),(11,'Tara Bose','Bengaluru'),(12,'Vihaan Roy','Chennai');
INSERT INTO orders VALUES
(101,1,'2026-01-05','fulfilled',1200),(102,2,'2026-01-10','fulfilled',850),
(103,1,'2026-02-11','fulfilled',2400),(104,3,'2026-02-20','cancelled',600),
(105,4,'2026-03-15','fulfilled',1800),(106,5,'2026-03-31','fulfilled',3200),
(107,6,'2026-04-01','fulfilled',950),(108,2,'2026-04-12','fulfilled',1700),
(109,7,'2026-04-18','pending',2100),(110,8,'2026-05-02','fulfilled',750),
(111,3,'2026-05-14','fulfilled',1600),(112,1,'2026-05-30','cancelled',500),
(113,5,'2026-06-08','fulfilled',1100),(114,6,'2026-06-30','fulfilled',1450),
(115,7,'2026-07-01','fulfilled',2800),(116,4,'2026-07-16','fulfilled',2200),
(117,8,'2026-07-20','pending',900),(118,9,'2026-08-09','fulfilled',1300),
(119,10,'2026-08-21','cancelled',700),(120,9,'2026-09-01','fulfilled',1850),
(121,2,'2026-09-13','fulfilled',650),(122,3,'2026-09-25','fulfilled',1900),
(123,5,'2025-12-31','fulfilled',400),(124,1,'2026-10-01','pending',300);
`;
export const mutationSQL = `
UPDATE customers SET city = 'Pune' WHERE id = 4;
UPDATE orders SET total = total + 137;
DELETE FROM orders WHERE customer_id = 9;
INSERT INTO customers VALUES (13,'Test Customer','Bengaluru');
INSERT INTO orders VALUES (125,13,'2026-04-01','fulfilled',3000),(126,13,'2026-06-30','fulfilled',3000),
(127,13,'2026-07-01','cancelled',800),(128,10,'2026-01-01','fulfilled',200);
`;
