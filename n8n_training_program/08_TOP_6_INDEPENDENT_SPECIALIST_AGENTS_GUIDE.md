# Top 6 Independent Specialist Agents & Master Orchestrator Architecture
## Complete Implementation Blueprint for n8n Multi-Agent Customer Support System

> **Architecture:** Hierarchical Multi-Agent System (Supervisor / Specialist Mesh)  
> **Target Platform:** n8n (v1.60+), Google Gemini (1.5 Flash), MySQL, Salesforce, Jira  
> **Source Foundation:** `customer_support_agent_skills.md` (28 Core Skills)

---

## 1. Multi-Agent Architecture Overview

Instead of building one monolithic agent with 28 messy tools, we implement the **Supervisor / Specialist Multi-Agent Pattern**:

```
                               ┌─────────────────────────────────────────┐
                               │         MASTER ORCHESTRATOR AGENT       │
                               │  - User-facing Chat Trigger / Webhook   │
                               │  - Intent Classification & Delegation   │
                               │  - Conversation Memory (Window Buffer)  │
                               └────────────────────┬────────────────────┘
                                                    │
         ┌──────────────────┬───────────────────────┼───────────────────────┬──────────────────┐
         ▼                  ▼                       ▼                       ▼                  ▼
┌─────────────────┐┌─────────────────┐    ┌─────────────────┐     ┌─────────────────┐┌─────────────────┐┌─────────────────┐
│ SPECIALIST 01:  ││ SPECIALIST 02:  │    │ SPECIALIST 03:  │     │ SPECIALIST 04:  ││ SPECIALIST 05:  ││ SPECIALIST 06:  │
│ Customer ID &   ││ Order & Track   │    │ Product & Stock │     │ Company Policy  ││ Return & Refund ││ Escalation &    │
│ Profile Agent   ││ Logistics Agent │    │ Discovery Agent │     │ Knowledge Agent ││ Calculator Agent││ Case Mgmt Agent │
│ (Salesforce)    ││ (MySQL Orders)  │    │ (MySQL Catalog) │     │ (Policy Engine) ││ (Policy Math)   ││ (Jira/Salesforce)│
└─────────────────┘└─────────────────┘    └─────────────────┘     └─────────────────┘└─────────────────┘└─────────────────┘
```

### Why These Top 6 Skills Were Selected:
1. **100% Independent:** Each agent owns a distinct business domain and database domain. They do not depend on each other's code to run.
2. **Modular Testing:** You can build, unit test, and verify each specialist independently before wiring them into the Master Orchestrator.
3. **Full Lifecycle Coverage:** Together, they cover 100% of standard customer inquiries: Identity -> Orders -> Products -> Policies -> Financial Refunds -> Human Escalation.

---

## 2. How the Master Orchestrator Calls Each Specialist in n8n

In n8n, each Specialist Agent is built as an independent sub-workflow with an **Execute Workflow Trigger**.
The **Master Orchestrator Agent** connects to each specialist using the **Call n8n Sub-Workflow Tool (`@n8n/n8n-nodes-langchain.toolWorkflow`)** or the **AI Agent Tool (`@n8n/n8n-nodes-langchain.agentTool`)**.

---

# 3. Step-by-Step Implementation Guides for the Top 6 Specialist Agents

---

## SPECIALIST AGENT 01: Customer Identity & Profile Agent
- **Original Skill:** `search_customer`
- **Domain:** Resolves customer identity by phone, email, or customer ID; extracts loyalty tier (Standard, Gold, VIP), risk score, and recent refund frequency.
- **Backend System:** Salesforce (`Contact` object) / Customer DB.

### A. Sub-Workflow Canvas Architecture
```
[Execute Workflow Trigger] ──▶ [Salesforce / Mock DB] ──▶ [Code: Extract Profile] ──▶ [Respond to Workflow]
```

### B. Node-by-Node Configuration
1. **Node 1: Execute Workflow Trigger**
   - Receives inputs from Master Agent: `phone`, `email`, or `customer_id`.
2. **Node 2: Salesforce Node (or HTTP Request to CRM)**
   - Resource: `Contact`
   - Operation: `Get Many` (or SOQL Query)
   - Query:
     ```sql
     SELECT Id, Customer_Id__c, FirstName, LastName, Email, Phone, Tier__c, Risk_Score__c, Refunds_Last_90d__c
     FROM Contact
     WHERE Customer_Id__c = '{{ $json.customer_id }}' 
        OR Email = '{{ $json.email }}' 
        OR Phone LIKE '%{{ $json.phone }}%'
     LIMIT 1;
     ```
3. **Node 3: Code Node (Format Output)**
   ```javascript
   const contact = $input.first()?.json;
   if (!contact || !contact.Customer_Id__c) {
     return [{
       json: {
         found: false,
         message: "No customer account found with the provided details."
       }
     }];
   }
   return [{
     json: {
       found: true,
       customer_id: contact.Customer_Id__c,
       full_name: `${contact.FirstName} ${contact.LastName}`,
       tier: contact.Tier__c || "standard",
       risk_score: parseInt(contact.Risk_Score__c || 0),
       refunds_last_90d: parseInt(contact.Refunds_Last_90d__c || 0)
     }
   }];
   ```

### C. Master Agent Tool Configuration
- **Tool Name:** `customer_identity_specialist`
- **Tool Description:**
  ```text
  Resolves customer identity and retrieves tier, risk score, and refund history.
  WHEN TO INVOKE: ALWAYS call this tool first whenever an unauthenticated customer asks about orders, refunds, or account details.
  INPUTS: Pass phone (digits only), email (lowercase), or customer_id (e.g. C001).
  ```

---

## SPECIALIST AGENT 02: Order & Tracking Logistics Agent
- **Original Skills:** `get_orders`, `get_order_detail`, `get_tracking`
- **Domain:** Queries customer order history, checks package tracking, shipping carriers, and live delivery ETAs.
- **Backend System:** MySQL (`orders`, `shipments` tables).

### A. Sub-Workflow Canvas Architecture
```
[Execute Workflow Trigger] ──▶ [MySQL: Query Orders] ──▶ [Code: Status & ETA] ──▶ [Respond to Workflow]
```

### B. Node-by-Node Configuration
1. **Node 1: Execute Workflow Trigger**
   - Inputs: `customer_id` (required), `order_id` (optional).
2. **Node 2: MySQL Node**
   - Operation: `Execute Query`
   - Query:
     ```sql
     SELECT o.order_id, o.order_date, o.item, o.amount, o.currency, o.status,
            s.carrier, s.tracking_number, s.estimated_delivery, s.delivery_status
     FROM orders o
     LEFT JOIN shipments s ON s.order_id = o.order_id
     WHERE o.customer_id = :customer_id
       AND (:order_id IS NULL OR o.order_id = :order_id)
     ORDER BY o.order_date DESC
     LIMIT 5;
     ```
   - Query Parameters:
     - `customer_id`: `={{ $json.customer_id }}`
     - `order_id`: `={{ $json.order_id || null }}`
3. **Node 3: Code Node (Format Output)**
   ```javascript
   const rows = $input.all().map(i => i.json);
   if (!rows.length) {
     return [{ json: { success: false, error: "NO_ORDERS_FOUND", message: "No purchase history found." } }];
   }
   return [{
     json: {
       success: true,
       order_count: rows.length,
       orders: rows.map(r => ({
         order_id: r.order_id,
         item: r.item,
         total: `${r.amount} ${r.currency}`,
         status: r.status,
         shipping: r.carrier ? `${r.carrier} (${r.delivery_status}) - ETA: ${r.estimated_delivery}` : "Preparing for dispatch"
       }))
     }
   }];
   ```

### C. Master Agent Tool Configuration
- **Tool Name:** `order_logistics_specialist`
- **Tool Description:**
  ```text
  Retrieves order history and live shipping/tracking updates.
  WHEN TO INVOKE: When customer asks "Where is my order?", "Track my shipment", or "Show my previous orders".
  PREREQUISITE: Requires a valid customer_id (call customer_identity_specialist first).
  ```

---

## SPECIALIST AGENT 03: Product Catalog & Inventory Agent
- **Original Skills:** `search_products`, `get_product_details`, `check_inventory`
- **Domain:** Product search, specifications, size/color variant availability, and stock checks.
- **Backend System:** MySQL (`products`, `inventory` tables).

### A. Sub-Workflow Canvas Architecture
```
[Execute Workflow Trigger] ──▶ [MySQL: Query Catalog] ──▶ [Code: Stock Verification] ──▶ [Respond]
```

### B. Node-by-Node Configuration
1. **Node 1: Execute Workflow Trigger**
   - Inputs: `search_query` (string), `size` (optional), `color` (optional).
2. **Node 2: MySQL Node**
   - Query:
     ```sql
     SELECT p.product_id, p.name, p.category, p.price, p.currency,
            i.size, i.color, i.stock_quantity
     FROM products p
     JOIN inventory i ON i.product_id = p.product_id
     WHERE (p.name LIKE CONCAT('%', :query, '%') OR p.category LIKE CONCAT('%', :query, '%'))
       AND (:size IS NULL OR i.size = :size)
     LIMIT 5;
     ```
   - Parameters:
     - `query`: `={{ $json.search_query }}`
     - `size`: `={{ $json.size || null }}`
3. **Node 3: Code Node**
   ```javascript
   const items = $input.all().map(i => i.json);
   if (!items.length) {
     return [{ json: { found: false, message: "No matching products found in stock." } }];
   }
   return [{
     json: {
       found: true,
       products: items.map(p => ({
         product: p.name,
         price: `${p.price} ${p.currency}`,
         variant: `${p.size} / ${p.color}`,
         in_stock: p.stock_quantity > 0,
         quantity_available: p.stock_quantity
       }))
     }
   }];
   ```

### C. Master Agent Tool Configuration
- **Tool Name:** `product_catalog_specialist`
- **Tool Description:**
  ```text
  Searches products and checks real-time warehouse stock and pricing.
  WHEN TO INVOKE: When customer asks about item availability, sizing, pricing, or product recommendations.
  ```

---

## SPECIALIST AGENT 04: Company Policy & Knowledge Agent
- **Original Skill:** `get_policy`
- **Domain:** Authoritative source on corporate policies: return time limits, warranty durations, international shipping costs, and cancellation rules.
- **Backend System:** MySQL (`policies` table) or Pinecone Vector Store (RAG).

### A. Sub-Workflow Canvas Architecture
```
[Execute Workflow Trigger] ──▶ [MySQL: Query Policies / Pinecone RAG] ──▶ [Respond]
```

### B. Node-by-Node Configuration
1. **Node 1: Execute Workflow Trigger**
   - Inputs: `country` (e.g. "IN", "AE", "US"), `policy_type` ("returns", "shipping", "cancellation").
2. **Node 2: MySQL Node**
   - Query:
     ```sql
     SELECT country, policy_type, return_window_days, max_auto_refund_limit,
            shipping_fee_refundable, policy_terms
     FROM policies
     WHERE country = :country AND policy_type = :policy_type
     LIMIT 1;
     ```
3. **Node 3: Code Node (Format Policy Response)**
   ```javascript
   const p = $input.first()?.json;
   if (!p) {
     return [{ json: { found: false, message: "Standard 30-day corporate policy applies." } }];
   }
   return [{
     json: {
       found: true,
       return_window: `${p.return_window_days} days from delivery`,
       max_instant_refund: p.max_auto_refund_limit,
       shipping_refundable: p.shipping_fee_refundable === 1,
       terms: p.policy_terms
     }
   }];
   ```

### C. Master Agent Tool Configuration
- **Tool Name:** `company_policy_specialist`
- **Tool Description:**
  ```text
  Retrieves official return windows, warranty rules, and refund limits for customer countries.
  WHEN TO INVOKE: When customer asks "What is your return policy?", "Can I cancel my order?", or before initiating any return.
  ```

---

## SPECIALIST AGENT 05: Return Eligibility & Refund Calculation Agent
- **Original Skills:** `check_return_eligibility`, `calculate_refund`
- **Domain:** Determines if an order qualifies for return, calculates refund amounts, and routes approval (`auto`, `approval`, or `human`).
- **Backend System:** Orders DB + Policy calculation rules.

### A. Sub-Workflow Canvas Architecture
```
[Execute Workflow Trigger] ──▶ [MySQL: Fetch Order & Dates] ──▶ [Code: Calculate Route] ──▶ [Respond]
```

### B. Node-by-Node Configuration
1. **Node 1: Execute Workflow Trigger**
   - Inputs: `customer_id`, `order_id`, `tier`, `risk_score`, `refunds_last_90d`.
2. **Node 2: MySQL Node**
   - Query:
     ```sql
     SELECT o.order_id, o.amount, o.currency, o.status, o.order_date,
            DATEDIFF(NOW(), o.order_date) AS days_since_order
     FROM orders o
     WHERE o.order_id = :order_id AND o.customer_id = :customer_id;
     ```
3. **Node 3: Code Node (The Decision Engine)**
   ```javascript
   const input = $('Execute Workflow Trigger').first().json;
   const order = $input.first()?.json;

   if (!order) {
     return [{ json: { eligible: false, reason: "Order not found or does not belong to this customer." } }];
   }

   const days = order.days_since_order;
   const risk = parseInt(input.risk_score || 0);
   const refundsCount = parseInt(input.refunds_last_90d || 0);
   const amount = parseFloat(order.amount);
   const tier = (input.tier || 'standard').toLowerCase();

   // 1. Eligibility Check
   if (days > 30 && tier !== "vip") {
     return [{ json: { eligible: false, reason: `Order was placed ${days} days ago (exceeds 30-day policy).` } }];
   }

   // 2. Decision Routing
   let route = "auto";
   let reason = "Instant automated refund approved.";

   if (risk >= 70 || refundsCount >= 3) {
     route = "human";
     reason = "Account flagged for elevated risk or multiple recent returns. Requires staff review.";
   } else if (amount > 150 && tier !== "vip") {
     route = "approval";
     reason = `Amount (${amount} ${order.currency}) exceeds instant refund limit. Requires manager sign-off.`;
   }

   return [{
     json: {
       eligible: true,
       order_id: order.order_id,
       refund_amount: amount,
       currency: order.currency,
       route: route,
       decision_rationale: reason
     }
   }];
   ```

### C. Master Agent Tool Configuration
- **Tool Name:** `refund_calculation_specialist`
- **Tool Description:**
  ```text
  Calculates refund amount and determines whether refund can be instant (auto) or requires human review.
  WHEN TO INVOKE: When customer requests a return or refund after their identity and order have been identified.
  ```

---

## SPECIALIST AGENT 06: Support Escalation & Case Management Agent
- **Original Skills:** `create_salesforce_case`, `escalate_to_human`, `report_technical_issue`
- **Domain:** Opens official Salesforce support cases, files urgent Jira tickets for managers, and generates human handoff transcripts.
- **Backend System:** Salesforce / Jira / Mock Case System.

### A. Sub-Workflow Canvas Architecture
```
[Execute Workflow Trigger] ──▶ [Salesforce: Create Case] ──▶ [Code: Confirmation Card] ──▶ [Respond]
```

### B. Node-by-Node Configuration
1. **Node 1: Execute Workflow Trigger**
   - Inputs: `customer_id`, `order_id`, `priority` (`HIGH`, `MEDIUM`), `reason`, `summary`.
2. **Node 2: Salesforce Node (or Jira Node)**
   - Resource: `Case`
   - Operation: `Create`
   - Fields:
     - `Subject`: `={{ $json.summary }}`
     - `Description`: `={{ $json.reason }} | Customer: {{ $json.customer_id }} | Order: {{ $json.order_id }}`
     - `Priority`: `={{ $json.priority || 'Medium' }}`
     - `Status`: `New`
3. **Node 3: Code Node**
   ```javascript
   const caseRecord = $input.first()?.json;
   const caseNumber = caseRecord?.CaseNumber || "CAS-" + Math.floor(10000 + Math.random() * 90000);
   return [{
     json: {
       success: true,
       case_id: caseNumber,
       message: `Support ticket ${caseNumber} created. A senior specialist will review within 24 hours.`
     }
   }];
   ```

### C. Master Agent Tool Configuration
- **Tool Name:** `escalation_case_specialist`
- **Tool Description:**
  ```text
  Creates official support tickets in Salesforce/Jira when an issue cannot be resolved automatically.
  WHEN TO INVOKE: When refund route is "approval" or "human", customer is angry, or a technical bug is reported.
  ```

---

# 4. Master Orchestrator Agent Setup

Now, create the **Master Orchestrator Agent** that connects all 6 specialists together.

### A. Main Canvas Setup
1. **Trigger:** `When chat message received` (or `Webhook` on POST `/customer-support`).
2. **AI Agent Node:** `@n8n/n8n-nodes-langchain.agent`
   - **Model Subnode:** Google Gemini Chat Model (`gemini-1.5-flash`, Temperature: `0.1`).
   - **Memory Subnode:** Simple Memory (`memoryBufferWindow`, Window: `10`).
   - **Tools Subnodes:** Attach 6 **Workflow Tools** (`toolWorkflow`), one for each of the 6 specialist sub-workflows created above.

### B. Master Orchestrator System Prompt
```text
You are the Lead AI Customer Support Orchestrator for WatchMate.
You communicate directly with the customer and coordinate your 6 specialist tools to resolve issues empathetically and accurately.

Your 6 Specialist Agents:
1. customer_identity_specialist: Call FIRST when customer ID, phone, or email is mentioned or needed.
2. order_logistics_specialist: Call to get order status, package tracking, or purchase history.
3. product_catalog_specialist: Call to look up items, prices, and stock availability.
4. company_policy_specialist: Call to check return windows and policy limits.
5. refund_calculation_specialist: Call to calculate refunds and determine if instant approval is permitted.
6. escalation_case_specialist: Call to create a ticket when a manager review is required.

Operating Rules:
- Never guess a Customer ID or Order ID. If missing, ask the customer politely.
- If customer asks to return an item:
  Step 1: Check identity (customer_identity_specialist).
  Step 2: Get order details (order_logistics_specialist).
  Step 3: Calculate refund (refund_calculation_specialist).
  Step 4: If route is "auto", confirm the refund amount with the customer.
  Step 5: If route is "human" or "approval", invoke escalation_case_specialist and explain that a manager will review.
- Always maintain a warm, polite, professional tone.
```

---

## 5. End-to-End Test Scenarios

| Scenario | Customer Input | Master Orchestrator Execution Flow | Final Output |
| :--- | :--- | :--- | :--- |
| **1. Order Tracking** | *"Hi, where is my watch? My email is sarah@test.com"* | Calls Agent 01 (Identify Sarah -> C001) ──▶ Calls Agent 02 (Fetch Orders) | *"Hi Sarah! Your WatchMate Chrono (Order ORD-101) is currently with FedEx (Out for Delivery), arriving today."* |
| **2. Stock Inquiry** | *"Do you have the Black Diver watch in size 42mm?"* | Calls Agent 03 (Product Catalog) directly | *"Yes! We have the WatchMate Diver (Black, 42mm) in stock for $249. 14 units available."* |
| **3. Policy Check** | *"What is your return policy in the UAE?"* | Calls Agent 04 (Policy Agent for country: AE) | *"In the UAE, you can return items within 30 days of delivery with original tags attached."* |
| **4. High-Value Refund** | *"I want to return order ORD-992 ($500). My ID is C002."* | Calls Agent 01 ──▶ Calls Agent 05 (Eligible: route='approval') ──▶ Calls Agent 06 (Create Case) | *"Since this refund exceeds our standard instant limit, I have created Case #CAS-4821. A manager will confirm within 24 hours."* |
