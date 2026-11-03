# n8n Individual Skill Architecture & Implementation Guide
## Converting Enterprise Agentic Skills (Workato / LangChain) into n8n Modular Skills

> **Reference Source:** `customer_support_agent_skills.md` (28 Enterprise Agentic Skills)  
> **Core Architecture:** Central AI Agent (The "Brain") + Modular Skills / Tools (The "Hands")  
> **Target Platforms:** n8n (v1.60+), Google Gemini, MySQL, Salesforce, Jira, Email

---

## 1. What is an "Individual Skill" in Agentic AI?

Yes, **your understanding is 100% correct**: **everything in that reference document is an independent, modular skill.**

In agentic systems:
- The **AI Agent (Genie / Orchestrator)** is the central cognitive coordinator. It talks to the user, interprets intent, and maintains conversational context.
- Each **Skill** is an **isolated, autonomous tool** that does exactly one specific job (e.g., lookup customer, query orders, calculate refund, update an address, or file a ticket).
- The agent does not hardcode which skill to call next. Instead, the agent reads the **Skill Description and Input Schema**, evaluates what information is missing or what action needs to be taken, and dynamically invokes the matching skill.

```
                      ┌─────────────────────────────────┐
                      │    CENTRAL AI AGENT (BRAIN)     │
                      │  - Google Gemini 1.5 Flash      │
                      │  - Conversation Memory          │
                      │  - Master System Prompt         │
                      └────────────────┬────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│ SKILL 01:        │          │ SKILL 03:        │          │ SKILL 17:        │
│ search_customer  │          │ get_orders       │          │ calculate_refund │
│ (Salesforce SOQL)│          │ (MySQL Query)    │          │ (Policy Engine)  │
└──────────────────┘          └──────────────────┘          └──────────────────┘
```

---

## 2. The 4 Essential Components of ANY Agentic Skill

Every single one of the 28 skills in the document contains 4 strict components that must be reproduced in n8n:

| Component | What It Does | Why the LLM Needs It |
| :--- | :--- | :--- |
| **1. Tool Name & Description** | Explains *what* the skill does, *when to invoke it*, and *when NOT to invoke it*. | Without strict boundaries, the LLM will call the wrong tool or guess parameters. |
| **2. Input Parameters Schema** | Defines the exact data types (`customer_id`, `order_id`, `confirmed`). | Tells the LLM what arguments to extract from the conversation before calling the skill. |
| **3. Execution Logic** | The backend queries (MySQL, Salesforce SOQL, Jira, business math). | Executes the actual database read or write in a safe, parameterized manner. |
| **4. Structured Response** | Clean JSON returned to the agent (`success`, `data`, `error_code`). | Gives the LLM verified facts so it can form a truthful, grounded reply to the user. |

---

## 3. Recommended n8n Implementation: The "Sub-Workflow as a Skill" Pattern

While n8n allows small inline tools (like Custom Code Tool or HTTP Request Tool), the **enterprise best practice** for complex skills like the 28 in your document is the **Workflow Tool (`@n8n/n8n-nodes-langchain.toolWorkflow`)**:

```
[Main Agent Workflow]
      │
      └── Subnode: Workflow Tool (Named: "get_orders")
                │
                ▼ (Invokes Sub-Workflow)
[Sub-Workflow: SKILL - Get Customer Orders]
   [Execute Workflow Trigger]
            │
            ▼
   [MySQL Node: Search Orders]
            │
            ▼
   [Code Node: Format Output JSON]
            │
            ▼
   [Return Data / Respond]
```

### Why Sub-Workflows are Superior for Skills:
1. **Isolation:** You can test `get_orders` or `calculate_refund` independently with mock inputs without running the entire chatbot.
2. **Reusability:** The same `search_customer` skill can be called by a Slack bot, an Email bot, or a Webhook.
3. **Clean Canvas:** You avoid turning the main agent canvas into an unreadable spiderweb of 28 database connections.

---

## 4. The 6-Step Step-by-Step Blueprint for Creating Each Skill in n8n

Follow these 6 steps for every skill you convert:

### Step 1: Create a Dedicated Sub-Workflow for the Skill
1. In n8n, click **New Workflow**.
2. Name it: `SKILL - [skill_name]` (e.g., `SKILL - get_orders`).
3. Add an **Execute Workflow Trigger** node as the first node. This node receives the JSON arguments passed by the AI Agent.

### Step 2: Extract & Validate Input Parameters
1. Add an **Edit Fields (Set)** or **Code** node after the trigger.
2. Extract the required parameters (e.g., `customerId = $json.customer_id`).
3. Add a basic validation check: If a required parameter is missing, immediately return `{ "success": false, "error_code": "MISSING_REQUIRED_INPUT" }`.

### Step 3: Implement the Integration Node (Database / API)
Depending on what system the skill uses:
- **For MySQL skills (25 skills):** Add the **MySQL** node -> Operation: `Execute Query`. Use parameterized inputs (`:customer_id`) to prevent SQL injection.
- **For Salesforce skills (9 skills):** Add the **Salesforce** node or **HTTP Request** node to execute the SOQL query.
- **For Jira skills (`report_technical_issue`):** Add the **Jira** node -> Operation: `Create Issue`.
- **For Email / SMS (`send_sms_notification`):** Add the **Send Email** node or **Twilio** node.

### Step 4: Implement Business Logic & Rule Calculations
If the skill requires logic (like checking 30-day windows, calculating refunds, or generating verification codes):
- Add a **Code Node** (JavaScript).
- Port the business logic formulas (e.g., converting the Ruby logic from the document to standard JavaScript).

### Step 5: Format the Return Response
1. The sub-workflow's final node must output clean JSON matching the skill's response schema:
   ```json
   {
     "success": true,
     "data": { ... },
     "error_code": null
   }
   ```
2. If no records are found:
   ```json
   {
     "success": false,
     "error_code": "NO_ORDERS_FOUND",
     "message": "No active orders found for customer ID C001."
   }
   ```

### Step 6: Attach the Skill to the Main AI Agent
1. Open your **Main AI Agent** workflow.
2. Under the AI Agent's **Tools** subnode, add a **Call n8n Sub-Workflow Tool** (`@n8n/n8n-nodes-langchain.toolWorkflow`).
3. Configure the tool:
   - **Name:** The exact skill name (e.g., `get_orders`).
   - **Description:** Copy the exact description from the specification (including When to Invoke and When NOT to Invoke).
   - **Workflow:** Select the sub-workflow created in Step 1.
   - **Workflow Inputs:** Define the input properties and descriptions so the LLM knows what arguments to generate.

---

## 5. End-to-End Walkthrough of 3 Real Skills from the Reference Document

---

### Walkthrough 1: Read / Lookup Skill (`get_orders`)

#### 1. Tool Contract (What the Agent Sees):
- **Tool Name:** `get_orders`
- **Tool Description:**
  ```text
  Retrieves a verified customer's complete order history.
  WHEN TO INVOKE: When a customer asks about a purchase without an exact order ID, or asks to see their purchase history.
  WHEN NOT TO INVOKE: Do NOT invoke if the customer has not been identified with a valid customer_id (call search_customer first).
  ```
- **Input Schema:**
  - `customer_id` (string, required): e.g., "C001"
  - `status` (string, optional): e.g., "shipped", "packed"

#### 2. Sub-Workflow Node Configuration in n8n:
1. **Node 1: Execute Workflow Trigger**
2. **Node 2: MySQL Node**
   - Operation: `Execute Query`
   - SQL Query:
     ```sql
     SELECT order_id, customer_id, country, currency, item, sku, size, 
            amount, shipping_fee, payment_method, order_date, status, 
            refunded, ship_to_name, ship_to_address, ship_to_city
     FROM orders 
     WHERE customer_id = :customer_id
     ORDER BY order_date DESC;
     ```
   - Query Parameters:
     - `customer_id`: `={{ $json.customer_id }}`
3. **Node 3: Code Node (Format & State Check)**
   ```javascript
   const rows = $input.all().map(item => item.json);
   if (!rows || rows.length === 0) {
     return [{
       json: {
         success: false,
         error_code: "NO_ORDERS_FOUND",
         message: "No orders found on this account."
       }
     }];
   }
   return [{
     json: {
       success: true,
       data: {
         orders: rows,
         count: rows.length
       }
     }
   }];
   ```

---

### Walkthrough 2: Calculation & Policy Skill (`calculate_refund`)

#### 1. Tool Contract:
- **Tool Name:** `calculate_refund`
- **Tool Description:**
  ```text
  Works out the refund amount and approval routing (auto, approval, or human) for an order and request type.
  WHEN TO INVOKE: Only after check_return_eligibility or check_order_cancellation_eligibility returns eligible=true.
  RULES:
  - route="auto": Customer is entitled to immediate refund.
  - route="approval": Refund exceeds limit; requires human manager approval.
  - route="human": High risk or policy exception; creates a support case.
  ```
- **Inputs:** `customer_id`, `order_id`, `request_type`, `risk_score`, `refunds_last_90d`, `tier`.

#### 2. Sub-Workflow Node Configuration:
1. **Node 1: Trigger (`Execute Workflow Trigger`)**
2. **Node 2: MySQL Node (`Get Order Amount & Policy Limits`)**
   ```sql
   SELECT o.amount, o.currency, p.max_auto_refund_limit 
   FROM orders o 
   JOIN policies p ON p.country = o.country
   WHERE o.order_id = :order_id;
   ```
3. **Node 3: Code Node (Policy Routing Logic)**
   ```javascript
   const input = $('Execute Workflow Trigger').first().json;
   const order = $input.first().json;

   const amount = parseFloat(order.amount);
   const maxLimit = parseFloat(order.max_auto_refund_limit || 200);
   const riskScore = parseInt(input.risk_score || 0);
   const refundsCount = parseInt(input.refunds_last_90d || 0);
   const tier = (input.tier || 'standard').toLowerCase();

   let route = "auto";
   let reason = "Standard automated refund approved.";

   if (riskScore >= 70 || refundsCount >= 3) {
     route = "human";
     reason = "High risk profile or excessive recent refunds; requires staff review.";
   } else if (amount > maxLimit && tier !== "vip") {
     route = "approval";
     reason = `Amount (${amount} ${order.currency}) exceeds standard auto-approval threshold (${maxLimit}).`;
   }

   return [{
     json: {
       success: true,
       data: {
         order_id: input.order_id,
         refund_amount: amount,
         currency: order.currency,
         route: route,
         reason: reason
       }
     }
   }];
   ```

---

### Walkthrough 3: Action / Mutation Skill (`update_customer_details`)

#### 1. Tool Contract:
- **Tool Name:** `update_customer_details`
- **Tool Description:**
  ```text
  Updates a customer's first name, last name, phone, or email.
  MANDATORY PROTOCOL:
  1. For name or phone: Read change back to customer, get clear YES, then call with confirmed=true.
  2. For email change: Call once with confirmed=true and NO verification_code. Tool returns action=code_sent.
  3. Tell customer a 6-digit code was emailed to them. Ask for the code, then call tool again with verification_code.
  ```
- **Inputs:** `customer_id`, `field`, `new_value`, `confirmed`, `verification_code`.

#### 2. Sub-Workflow Node Configuration:
1. **Node 1: Trigger (`Execute Workflow Trigger`)**
2. **Node 2: IF Node (`Is Confirmed?`)**
   - Condition: `$json.confirmed === 'true' || $json.confirmed === true`
   - If False -> Return `{ success: false, action: "need_confirm", message: "Customer has not explicitly confirmed the change." }`
3. **Node 3: Switch Node (`Field Type`)**
   - Branch: `email`
   - Branch: `phone` / `first_name` / `last_name`
4. **Node 4 (Email Branch): Check Verification Code**
   - If `verification_code` is missing:
     - Generate 6-digit PIN: `Math.floor(100000 + Math.random() * 900000)`
     - Store in MySQL table `verification_codes` with 10-minute expiry.
     - Send Email node to current address on file.
     - Return `{ success: true, action: "code_sent", message: "Verification PIN sent to email." }`
   - If `verification_code` matches DB record:
     - Update Salesforce & MySQL Contact records.
     - Mark code as used.
     - Return `{ success: true, action: "applied", message: "Email successfully updated." }`
5. **Node 5: Audit Log Node (MySQL)**
   - Always write an entry into `customer_change_log` recording old value, new value, timestamp, and verification method.

---

## 6. Summary Checklist for Building Each Skill in n8n

When creating any of the 28 skills:
- [ ] **Create isolated Sub-Workflow** with `Execute Workflow Trigger`.
- [ ] **Name clearly:** `SKILL - <skill_name>`.
- [ ] **Use parameterized SQL** (`:variable`) to prevent SQL injections.
- [ ] **Handle edge cases:** If record not found, return clean JSON with `success: false` and `error_code` rather than letting the workflow crash.
- [ ] **Attach to Main AI Agent** using `@n8n/n8n-nodes-langchain.toolWorkflow`.
- [ ] **Write comprehensive Tool Description:** Include *When to Invoke*, *When NOT to Invoke*, and *Required Order of Preceding Skills* (e.g., must run `search_customer` first).
