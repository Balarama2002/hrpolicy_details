# Individual Hands-on Assignments Workbook
## Practical Implementation Projects for Workshop Participants

> **Program:** n8n AI Agent Development & Implementation Training  
> **Structure:** Part I: 12 Foundational Agent Assignments (No RAG)  
> **Structure:** Part II: 10 Semantic Retrieval (RAG) Assignments  
> **Assignment Methodology:** Each participant is assigned one unique project from Part I and one from Part II.

---

## Participant Assignment Matrix

| Slot | Participant Identifier | Part I: Basic Agent Assignment | Part II: RAG Knowledge Assignment |
| :---: | :--- | :--- | :--- |
| **01** | Participant 1 | **Case 01:** Customer Support Ticket Triage Agent | **RAG 01:** Employee HR Policy Advisor |
| **02** | Participant 2 | **Case 02:** Employee Expense Receipt Classifier | **RAG 02:** IT Helpdesk Diagnostic Assistant |
| **03** | Participant 3 | **Case 03:** Executive Meeting Action Item Extractor | **RAG 03:** SaaS Product Documentation Assistant |
| **04** | Participant 4 | **Case 04:** Inbound Sales Lead Qualification Agent | **RAG 04:** Customer Support FAQ Bot |
| **05** | Participant 5 | **Case 05:** E-Commerce Order Status Lookup Agent | **RAG 05:** Corporate Travel Policy Advisor |
| **06** | Participant 6 | **Case 06:** IT Password & Access Request Triager | **RAG 06:** Standard Operating Procedures (SOP) Assistant |
| **07** | Participant 7 | **Case 07:** Vendor Invoice Data Extraction Agent | **RAG 07:** B2B Sales Proposal Knowledge Assistant |
| **08** | Participant 8 | **Case 08:** Candidate Resume Screening Assistant | **RAG 08:** Engineering API & Architecture Assistant |
| **09** | Participant 9 | **Case 09:** Appointment Scheduling Coordinator | **RAG 09:** Legal & Compliance Agreement Assistant |
| **10** | Participant 10 | **Case 10:** Daily Agile Standup Summarizer | **RAG 10:** New Hire Training Material Assistant |
| **11** | Participant 11 | **Case 11:** Social Media Feedback Sentiment Agent | *Extension / Peer Reviewer for RAG 01–05* |
| **12** | Participant 12 | **Case 12:** Database Query Assistant (Mock DB) | *Extension / Peer Reviewer for RAG 06–10* |

---

# PART I: Foundational AI Agent Assignments (12 Use Cases)

---

### Case 01: Customer Support Ticket Triage Agent
- **Assigned To:** Participant 1
- **1. Business Problem:** Support teams receive hundreds of raw tickets daily with mismatched categories and unclear urgencies, leading to delayed response times for critical bugs.
- **2. Objective & Expected Outcome:** Automatically classify raw customer inquiries into Category, Priority, and sentiment, and route to the appropriate department.
- **3. Functional Requirements:**
  - Ingest raw text via Webhook or Manual Trigger.
  - LLM assesses ticket urgency based on business impact keywords.
  - Return clean JSON for downstream ticketing systems.
- **4. Input Data & Sample Payload:**
  ```json
  {
    "ticketId": "TCK-9921",
    "customer": "Sarah Jenkins",
    "email": "sarah@acme.org",
    "message": "URGENT: Our production checkout page is returning 504 gateway timeout since 10 minutes ago! Customers cannot pay!"
  }
  ```
- **5. Required n8n Nodes:**
  - `Manual Trigger` / `Webhook`
  - `AI Agent` (`@n8n/n8n-nodes-langchain.agent`)
  - `Google Gemini Chat Model` (`@n8n/n8n-nodes-langchain.lmChatGoogleGemini`)
  - `Structured Output Parser` (`@n8n/n8n-nodes-langchain.outputParserStructured`)
  - `Respond to Webhook`
- **6. LLM Responsibilities:** Extract category (`Billing`, `Technical`, `Account`, `Feature Request`), Priority (`P1_CRITICAL`, `P2_HIGH`, `P3_NORMAL`), Sentiment (`Frustrated`, `Neutral`, `Happy`), and a 1-sentence executive summary.
- **7. Tools / APIs Required:** None (Pure zero-shot classification with structured JSON output schema).
- **8. System Prompt:**
  ```text
  You are an expert Enterprise Ticket Triage Officer.
  Analyze the incoming customer ticket message. 
  Classify urgency strictly based on business impact: if core revenue or production is halted, assign P1_CRITICAL.
  Output your decision adhering strictly to the JSON schema.
  ```
- **9. Workflow Architecture:**
  `[Webhook] -> [AI Agent + Gemini Model + Structured Output Parser] -> [Respond to Webhook]`
- **10. Node-by-Node Implementation Plan:**
  1. Add Webhook node listening on POST `/triage-ticket`.
  2. Connect to AI Agent node.
  3. Attach Google Gemini Chat Model (`gemini-1.5-flash`).
  4. Attach Structured Output Parser with JSON Schema: `{ "category": "string", "priority": "string", "sentiment": "string", "summary": "string" }`.
  5. Test step and inspect `$json.output`.
- **11. Expected Output:**
  ```json
  {
    "category": "Technical",
    "priority": "P1_CRITICAL",
    "sentiment": "Frustrated",
    "summary": "Production checkout is down returning 504 errors preventing customer purchases."
  }
  ```
- **12. Test Cases:**
  - *Positive:* Billing question -> `Billing`, `P3_NORMAL`.
  - *Negative:* Blank message -> Returns `{"error": "Empty message cannot be triaged"}`.
- **13. Error Handling:** Check if input message is null; return 400 Bad Request before calling LLM.
- **14. Security Considerations:** Strip any detected credit card PANs before prompt injection.
- **15. Completion Criteria:** Successfully categorizes 3 sample tickets into valid JSON without hallucination.
- **16. Optional Advanced Enhancements:** Add Slack node to send alert to `#incident-room` if priority is `P1_CRITICAL`.

---

### Case 02: Employee Expense Receipt Classifier
- **Assigned To:** Participant 2
- **1. Business Problem:** Employees submit disorganized receipt descriptions leading to manual finance accounting reconciliation bottlenecks.
- **2. Objective:** Extract merchant name, transaction date, amount, currency, and tax category (`Meals`, `Travel`, `Office Supplies`, `Software`) from unformatted text.
- **3. Functional Requirements:** Parse single-line or multi-line expense text, normalize amounts to float, classify tax write-off category.
- **4. Input Data & Sample Payload:**
  ```json
  {
    "employeeId": "EMP-404",
    "receiptText": "Dinner with client at Bistro Bella on Oct 14, 2026. Total was 84.50 USD including 15 tip. Paid with corporate card."
  }
  ```
- **5. Required n8n Nodes:** `Manual Trigger`, `AI Agent`, `Google Gemini Chat Model`, `Structured Output Parser`.
- **6. LLM Responsibilities:** Entity extraction (Merchant, Date, Amount, Currency) and tax categorization.
- **7. Tools / APIs Required:** None.
- **8. System Prompt:**
  ```text
  You are a Corporate Finance Compliance Specialist.
  Extract all expense metrics from the raw employee receipt text.
  Categorize strictly into: Meals, Travel, Office Supplies, or Software.
  Normalize amount into a valid floating-point number.
  ```
- **9. Workflow Architecture:**
  `[Trigger] -> [AI Agent + Gemini + Output Parser] -> [Edit Fields]`
- **10. Node-by-Node Implementation:** Set prompt to `={{ $json.receiptText }}`. Set parser schema with numeric `amount`.
- **11. Expected Output:**
  ```json
  {
    "merchant": "Bistro Bella",
    "date": "2026-10-14",
    "amount": 84.50,
    "currency": "USD",
    "category": "Meals"
  }
  ```
- **12. Test Cases:** Missing currency defaults to USD; unrecognized merchants flagged for review.
- **13. Error Handling:** If amount is ambiguous, populate field `"requiresManualAudit": true`.
- **14. Security:** Ensure no personal identifying card numbers are stored.
- **15. Completion Criteria:** Correctly parses 3 diverse receipts with exact float values.
- **16. Enhancements:** Connect to Google Sheets node to append expense row directly.

---

### Case 03: Executive Meeting Action Item Extractor
- **Assigned To:** Participant 3
- **1. Business Problem:** Unstructured meeting notes lead to forgotten tasks and ambiguous accountabilities.
- **2. Objective:** Analyze raw meeting transcripts or minutes and generate structured action items with assignees, deadlines, and priorities.
- **3. Functional Requirements:** Detect implicit assignments ("John will follow up"), extract deliverables, normalize dates.
- **4. Input Data & Sample Payload:**
  ```json
  {
    "meetingTitle": "Q4 Product Strategy",
    "transcript": "Alex mentioned that we need to ship the onboarding redesign by Friday next week. Maya agreed to draft the release notes by Wednesday. Carlos will review AWS billing before end of month."
  }
  ```
- **5. Required Nodes:** `Manual Trigger`, `AI Agent`, `Google Gemini Chat Model`, `Structured Output Parser`.
- **6. LLM Responsibilities:** Task isolation, assignee resolution, due-date standardization.
- **7. Tools:** None.
- **8. System Prompt:**
  ```text
  You are an Executive Chief of Staff.
  Transform informal meeting conversation into an actionable checklist.
  Every item must have a designated Owner, Task Description, and standard ISO Date or relative deadline.
  ```
- **9. Workflow Architecture:** `[Trigger] -> [AI Agent + Gemini + Parser] -> [Code (Format Markdown Table)]`
- **10. Implementation Plan:** Configure parser to return an array of objects `items: [{ task, owner, deadline, urgency }]`.
- **11. Expected Output:**
  ```json
  {
    "actionItems": [
      { "task": "Ship onboarding redesign", "owner": "Alex", "deadline": "Next Friday", "urgency": "High" },
      { "task": "Draft release notes", "owner": "Maya", "deadline": "Wednesday", "urgency": "Medium" },
      { "task": "Review AWS billing", "owner": "Carlos", "deadline": "End of Month", "urgency": "Low" }
    ]
  }
  ```
- **12. Test Cases:** Transcript with no tasks returns empty array; multiple people assigned to one task gets normalized.
- **13. Error Handling:** Graceful fallback if no owners are specified.
- **14. Security:** Scrub confidential revenue projections if marked restricted.
- **15. Completion Criteria:** Correctly extracts all 3 action items with correct owners.
- **16. Enhancements:** Automatically send formatted summary via Send Email (SMTP) node.

---

### Case 04: Inbound Sales Lead Qualification Agent
- **Assigned To:** Participant 4
- **1. Business Problem:** SDRs spend hours manually researching contact forms to determine if a prospect meets the Ideal Customer Profile (ICP).
- **2. Objective:** Score incoming website leads (`HOT`, `WARM`, `COLD`) based on company size, budget, urgency, and use case fit.
- **3. Functional Requirements:** Calculate lead score (1–100), assign BANT status, draft recommended next action.
- **4. Input Data & Sample Payload:**
  ```json
  {
    "leadId": "LEAD-781",
    "fullName": "David Zhang",
    "company": "CloudScale Logistics",
    "companySize": "250-500",
    "inquiry": "We are migrating from Zapier and need enterprise-grade n8n workflow deployment within 30 days. We have budget allocated for enterprise licenses."
  }
  ```
- **5. Required Nodes:** `Manual Trigger`, `AI Agent`, `Google Gemini Chat Model`, `Structured Output Parser`, `IF Node`.
- **6. LLM Responsibilities:** BANT evaluation (Budget, Authority, Need, Timeline) and ICP scoring.
- **7. Tools:** None.
- **8. System Prompt:**
  ```text
  You are a Senior B2B SaaS Sales Development Strategist.
  Evaluate the incoming lead against our ICP: Enterprise company (100+ employees), active budget, and urgent timeline (<60 days) = HOT (Score 80-100).
  Small hobby projects without budget = COLD (Score <40).
  ```
- **9. Workflow Architecture:** `[Webhook] -> [AI Agent + Gemini] -> [IF: Score >= 80] -> [Branch HOT vs Branch COLD]`
- **10. Implementation Plan:** Wire AI Agent output into an n8n IF node checking `$json.output.score >= 80`.
- **11. Expected Output:**
  ```json
  {
    "leadScore": 92,
    "classification": "HOT",
    "rationale": "Company size 250-500, migration budget secured, and urgent 30-day timeline.",
    "recommendedAction": "Schedule immediate AE discovery call within 2 hours."
  }
  ```
- **12. Test Cases:** Test student inquiry -> `COLD` (Score 15); Test Fortune 500 VP -> `HOT` (Score 95).
- **13. Error Handling:** Default missing company size to "UNKNOWN" and flag for manual SDR review.
- **14. Security:** Protect prospect contact information in compliance with GDPR.
- **15. Completion Criteria:** IF node successfully routes HOT leads to top branch and COLD to bottom branch.
- **16. Enhancements:** Attach HubSpot or Salesforce mock webhook for automatic lead creation.

---

### Case 05: E-Commerce Order Status Lookup Agent
- **Assigned To:** Participant 5
- **1. Business Problem:** Repetitive "Where is my order?" (WISMO) queries flood customer service queues.
- **2. Objective:** Understand natural language customer queries, extract order numbers, call an external mock order API tool, and return human-friendly tracking status.
- **3. Functional Requirements:** Use an AI Agent with an external tool; call tool only when an order number is detected.
- **4. Input Data & Sample Payload:**
  ```json
  {
    "customer": "Jessica Alba",
    "message": "Where is my package? The order ID is ORD-8842."
  }
  ```
- **5. Required Nodes:**
  - `AI Agent`
  - `Google Gemini Chat Model`
  - `Custom Code Tool` (Named: `getOrderStatus`)
- **6. LLM Responsibilities:** Detect user intent, extract Order ID, trigger tool, formulate friendly customer explanation.
- **7. Tools / APIs Required:** Custom Code Tool:
  ```javascript
  const orders = {
    "ORD-8842": { status: "Out for Delivery", carrier: "FedEx", tracking: "FX-991203", eta: "Today by 5:00 PM" },
    "ORD-1102": { status: "Processing", carrier: "UPS", tracking: "Pending", eta: "Tomorrow" }
  };
  return JSON.stringify(orders[query.trim().toUpperCase()] || { error: "Order not found" });
  ```
- **8. System Prompt:**
  ```text
  You are an E-commerce Order Support Agent.
  When a user provides an Order ID (format ORD-XXXX), use the getOrderStatus tool to retrieve live logistics data.
  Answer politely and give clear delivery estimates.
  ```
- **9. Workflow Architecture:** `[Trigger] -> [AI Agent (Model + Tool)] -> [Respond]`
- **10. Implementation Plan:** Connect Custom Code Tool to AI Agent's `tool` subnode. Test execution.
- **11. Expected Output:**
  *"Hello Jessica! Your order ORD-8842 is currently Out for Delivery via FedEx (Tracking #FX-991203) and is estimated to arrive today by 5:00 PM."*
- **12. Test Cases:** Valid order returns ETA; invalid order returns empathetic "not found" message.
- **13. Error Handling:** Agent handles tool execution errors without breaking the conversation.
- **14. Security:** Only reveal order information matching the customer's authenticated identifier.
- **15. Completion Criteria:** Agent correctly triggers the tool and formats the response.
- **16. Enhancements:** Add carrier tracking link generation.

---

### Case 06: IT Password & Access Request Triager
- **Assigned To:** Participant 6
- **1. Business Problem:** IT support tickets for routine password resets waste tier-2 technician time.
- **2. Objective:** Parse IT requests, classify system requested (Okta, GitHub, Jira, AWS), determine security risk, and provide self-service reset instructions.
- **3. Functional Requirements:** Identify application, assess authorization risk level, provide step-by-step resolution URL.
- **4. Sample Payload:** `{"user": "mark@company.com", "request": "I locked myself out of Okta after trying my password 5 times."}`
- **5. Required Nodes:** `AI Agent`, `Google Gemini Chat Model`, `Structured Output Parser`.
- **6. LLM Responsibilities:** System identification, risk grading (`LOW`, `MEDIUM`, `HIGH`), resolution mapping.
- **7. Tools:** None.
- **8. System Prompt:** Standardized IT Service Desk classification prompt.
- **9. Architecture:** `[Webhook] -> [AI Agent + Gemini] -> [Edit Fields]`
- **10. Implementation:** Setup schema with fields: `system`, `actionType`, `isSelfServiceEligible`, `resolutionUrl`.
- **11. Expected Output:** `{"system": "Okta", "actionType": "Password_Reset", "isSelfServiceEligible": true, "resolutionUrl": "https://identity.corp.local/self-service"}`
- **12. Test Cases:** Okta lockout -> self-service; AWS Admin Access -> requires manager approval (`HIGH` risk).
- **13. Error Handling:** Unknown systems routed to General Helpdesk queue.
- **14. Security:** Never request or handle cleartext passwords in the conversation.
- **15. Completion Criteria:** Accurately routes 3 standard IT scenarios.
- **16. Enhancements:** Connect to Jira Service Management API to create ticket.

---

### Case 07: Vendor Invoice Data Extraction Agent
- **Assigned To:** Participant 7
- **1. Business Problem:** PDF and plain text invoices from diverse vendors arrive in differing formats.
- **2. Objective:** Extract Vendor Name, Invoice Number, PO Number, Line Items, Subtotal, Tax, and Total Due into clean structured JSON.
- **3. Sample Payload:** `{"rawInvoice": "INVOICE #INV-2026-901\nVendor: Apex Cloud Hosting\nPO: PO-771\nServer Compute: $400.00\nStorage: $120.00\nTax: $52.00\nTotal Due: $572.00\nDue Date: Nov 1, 2026"}`
- **4. Required Nodes:** `AI Agent`, `Gemini Chat Model`, `Structured Output Parser`.
- **5. LLM Responsibilities:** Line-item tabular parsing, arithmetic sanity check.
- **6. Tools:** None.
- **7. System Prompt:** Strict accounting parsing rules with explicit JSON schema.
- **8. Expected Output:** Clean JSON with normalized currency and array of line items.
- **9. Completion Criteria:** Calculates and matches total accurately.

---

### Case 08: Candidate Resume Screening Assistant
- **Assigned To:** Participant 8
- **1. Business Problem:** Recruiters need to quickly compare unstructured candidate resumes against minimum job requirements.
- **2. Objective:** Extract candidate core skills, years of experience, education, and calculate a Match Score (0–100%) against a standard Job Description.
- **3. Sample Payload:** `{"jobRole": "Senior Node.js / n8n Developer", "resumeText": "5 years backend JavaScript and TypeScript experience. Built 20+ automated production pipelines with n8n and LangChain. BS in Computer Science."}`
- **4. Required Nodes:** `AI Agent`, `Gemini Model`, `Structured Output Parser`.
- **5. LLM Responsibilities:** Skill gap analysis, boolean qualification check.
- **6. Expected Output:** JSON with `matchScore`, `keyStrengths`, `missingQualifications`, and `recommendation` (`INTERVIEW` / `REJECT`).
- **7. Completion Criteria:** Unbiased, criteria-based evaluation.

---

### Case 09: Appointment Scheduling Coordinator
- **Assigned To:** Participant 9
- **1. Business Problem:** Clients message across timezones with ambiguous meeting requests.
- **2. Objective:** Parse preferred meeting dates, normalize timezone to UTC, verify working hour boundaries, and trigger a calendar availability check tool.
- **3. Required Nodes:** `AI Agent`, `Gemini Model`, `Custom Code Tool` (`checkSlotAvailable`).
- **4. Completion Criteria:** Correctly maps relative dates ("next Tuesday at 2 PM EST") to ISO timestamps.

---

### Case 10: Daily Agile Standup Summarizer
- **Assigned To:** Participant 10
- **1. Business Problem:** Team members post fragmented Slack updates throughout the morning.
- **2. Objective:** Consolidate multiple developer updates into: `What was accomplished`, `What is planned today`, and `Blockers needing attention`.
- **3. Required Nodes:** `AI Agent`, `Gemini Model`, `Edit Fields`.
- **4. Completion Criteria:** Highlights critical blockers prominently in red bold text.

---

### Case 11: Social Media Feedback Sentiment Agent
- **Assigned To:** Participant 11
- **1. Business Problem:** Brand marketing needs to detect sudden PR spikes or customer outrage across tweets and reviews.
- **2. Objective:** Analyze brand mentions, detect sarcasm/irony, compute sentiment score (-1.0 to +1.0), and tag key themes.
- **3. Required Nodes:** `AI Agent`, `Gemini Model`, `Structured Output Parser`.
- **4. Completion Criteria:** Correctly classifies sarcastic praise as negative sentiment.

---

### Case 12: Database Query Assistant (Mock DB)
- **Assigned To:** Participant 12
- **1. Business Problem:** Non-technical managers need instant metrics without writing SQL queries.
- **2. Objective:** Convert natural language business questions into mock database API lookups and explain results.
- **3. Required Nodes:** `AI Agent`, `Gemini Model`, `Custom Code Tool` (`executeMockQuery`).
- **4. Completion Criteria:** Safeguards against destructive SQL commands (DROP, DELETE).

---

# PART II: Semantic Retrieval (RAG) Assignments (10 Use Cases)

Every RAG project requires two interconnected n8n workflows:
- **Workflow A (Ingestion):** Chunking and vectorizing specialized domain documents into Pinecone with custom metadata.
- **Workflow B (Retrieval QA):** Semantic retrieval via Pinecone Vector Store Tool, context injection, and hallucination-free answer generation with source citations.

---

### RAG 01: Employee HR Policy Advisor
- **Assigned To:** Participant 1
- **Domain Document:** `HR_Benefits_Leave_Policy_2026.md` (Paid time off, parental leave, bereavement, health insurance, remote work stipend).
- **Pinecone Metadata Schema:** `{ "document": "HR_Policy", "section": "Leave" | "Health" | "Compensation", "effectiveYear": 2026 }`
- **Evaluation Criteria:**
  - Must state exact days allowed for parental leave (16 weeks paid).
  - Must refuse to invent pet insurance policy (not present in document) by stating: *"I cannot find information regarding pet insurance in the official HR policy handbook."*
  - Must cite `[Source: HR Policy 2026, Section 4.2]`.

---

### RAG 02: IT Helpdesk Diagnostic Assistant
- **Assigned To:** Participant 2
- **Domain Document:** `IT_Troubleshooting_Runbook.md` (VPN error 800, printer spooler restart, Wi-Fi 802.1x certificate renewal, BitLocker recovery).
- **Pinecone Metadata:** `{ "category": "Network" | "Hardware" | "Security", "os": "Windows" | "macOS" }`
- **Evaluation Criteria:**
  - Provides exact command line step for restarting spooler (`net stop spooler && net start spooler`).
  - Does not guess steps for Linux if not covered in runbook.

---

### RAG 03: SaaS Product Documentation Assistant
- **Assigned To:** Participant 3
- **Domain Document:** `SaaS_Platform_API_Docs.md` (Rate limits, OAuth2 token renewal, Webhook signatures, Webhook payload schemas).
- **Pinecone Metadata:** `{ "api_version": "v2", "resource": "Auth" | "Webhooks" | "Billing" }`
- **Evaluation Criteria:**
  - Returns exact HTTP header syntax for verifying HMAC signatures.
  - Cites exact documentation endpoint URLs.

---

### RAG 04: Customer Support FAQ Bot
- **Assigned To:** Participant 4
- **Domain Document:** `ECommerce_Returns_Shipping_FAQ.md` (30-day return policy, international customs, defective item exchange, restocking fees).
- **Pinecone Metadata:** `{ "topic": "Returns" | "Shipping" | "Warranty" }`
- **Evaluation Criteria:**
  - Explains the 30-day return window accurately.
  - Explains who pays for return shipping based strictly on condition.

---

### RAG 05: Corporate Travel Policy Advisor
- **Assigned To:** Participant 5
- **Domain Document:** `Corporate_Travel_Expense_Rules.md` (Per diem rates, flight class restrictions, car rental insurance, hotel nightly caps).
- **Pinecone Metadata:** `{ "region": "Domestic" | "International", "tier": "Executive" | "Standard" }`
- **Evaluation Criteria:**
  - Enforces economy class rule for flights under 6 hours.
  - Refuses reimbursement claims exceeding nightly hotel caps.

---

### RAG 06: Standard Operating Procedures (SOP) Assistant
- **Assigned To:** Participant 6
- **Domain Document:** `Warehouse_Safety_Inventory_SOP.md` (Forklift checklist, hazardous chemical disposal, PPE requirements, emergency exits).
- **Pinecone Metadata:** `{ "facility": "Logistics", "safetyLevel": "Mandatory" }`
- **Evaluation Criteria:**
  - Step-by-step checklist matching ISO guidelines in the SOP.

---

### RAG 07: B2B Sales Proposal Knowledge Assistant
- **Assigned To:** Participant 7
- **Domain Document:** `Enterprise_Product_Battlecards.md` (Competitor comparisons, SOC2 certification details, SLA uptime guarantees 99.99%).
- **Pinecone Metadata:** `{ "competitor": "CompetitorX" | "CompetitorY", "tier": "Enterprise" }`
- **Evaluation Criteria:**
  - Pulls exact SOC2 Type II audit date and SLA credit percentage.

---

### RAG 08: Engineering API & Architecture Assistant
- **Assigned To:** Participant 8
- **Domain Document:** `Microservices_Architecture_Guidelines.md` (gRPC communication, Redis caching TTLs, Kafka partition keys, circuit breaker thresholds).
- **Pinecone Metadata:** `{ "serviceType": "Backend", "tech": "Go" | "Node" | "Kafka" }`
- **Evaluation Criteria:**
  - Recommends 300ms circuit breaker timeout as written in standard.

---

### RAG 09: Legal & Compliance Agreement Assistant
- **Assigned To:** Participant 9
- **Domain Document:** `Standard_NDA_Master_Service_Agreement.md` (Confidentiality terms, IP ownership, liability limitation $1M, governing law Delaware).
- **Pinecone Metadata:** `{ "clause": "Liability" | "Confidentiality" | "Jurisdiction" }`
- **Evaluation Criteria:**
  - Identifies 3-year term of confidentiality without guessing.

---

### RAG 10: New Hire Training Material Assistant
- **Assigned To:** Participant 10
- **Domain Document:** `Employee_Onboarding_Week1_Guide.md` (Slack etiquette, email setup, agile sprint cycles, buddy program, 30-day review).
- **Pinecone Metadata:** `{ "phase": "Day1" | "Week1" | "Month1" }`
- **Evaluation Criteria:**
  - Outlines exact sequence of Day 1 IT account activations.

---

## RAG Quality & Factuality Evaluation Checklist (Grading Sheet)

Every participant's completed RAG workflow is tested against these 5 objective tests:

| Metric | Verification Method | Pass Condition | Fail Condition |
| :--- | :--- | :--- | :--- |
| **1. Groundedness (Faithfulness)** | Compare answer claims against retrieved Pinecone chunks. | 100% of claims are substantiated by chunks. | Agent makes claims not found in context. |
| **2. Citation Accuracy** | Inspect footer of response for document/section reference. | Contains valid document and section name. | Missing citation or cites non-existent file. |
| **3. Negative Constraint Handling** | Submit query asking for data NOT in the document. | Answers: *"This is not mentioned in the official handbook."* | Hallucinates plausible but fake policy. |
| **4. Chunk Retrieval Quality** | Inspect Pinecone node output in n8n execution history. | Top retrieved chunk contains the exact answer. | Irrelevant chunks retrieved due to bad query. |
| **5. Subnode Configuration** | Review canvas wiring. | Uses Google Gemini Embeddings + Pinecone tool correctly. | Hardcoded text or broken embeddings model. |
