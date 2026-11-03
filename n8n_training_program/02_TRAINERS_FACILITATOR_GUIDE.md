# Trainer's Facilitator Guide & Session Playbook
## Conducting High-Impact n8n AI Agent Training Sessions

> **Role:** Corporate Technical Trainer & AI Solutions Architect  
> **Target Audience:** Software Developers, Automation Engineers, Technical Analysts  
> **Format:** Multi-session workshop / Full-day Saturday intensive + follow-up project labs

---

## 1. Pedagogical Framework & Delivery Philosophy

Adult learners in technical teams grasp agentic concepts quickest through a **See One, Build One, Extend One** model:
1. **Explain the mental model** (5–10 mins): What is the architectural shift? (e.g., Why deterministic rules fail when text is messy).
2. **Trainer Live Build** (15–20 mins): Build the solution on screen from an empty canvas. Do *not* simply import a pre-baked JSON; show the errors, explain the connection types (subnode vs main connection), and verify outputs.
3. **Participant Guided Exercise** (20–25 mins): Participants replicate the foundational pattern.
4. **Independent Assignment Work** (30–45 mins): Participants implement their assigned distinct business use cases.
5. **Debrief & Failure Mode Analysis** (10 mins): Review real execution errors and inspect prompt/tool mismatches.

---

## 2. Saturday Intensive Working Session Agenda (Full-Day)

Below is the turnkey minute-by-minute facilitator timeline for Session 1:

| Time Slot | Phase | Focus Topic | Trainer Action & Talking Points | Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **09:00 - 09:30** | Welcome & Context | The AI Shift: LLMs to Autonomous Agents | Demystify AI hype. Contrast Deterministic code vs Probabilistic LLMs. Why n8n is the premier low-code agent canvas. | Visual comprehension of Agent stack |
| **09:30 - 10:15** | n8n Core Mastery | Nodes, JSON Data flow, Expressions & Secrets | Live build: Webhook -> Transform -> External HTTP Call -> Response. Teach `$json` and data paths. | Working data transformation workflow |
| **10:15 - 10:30** | *Morning Break* | *Coffee / Refreshment* | *Assist participants lagging behind on account/credential verification.* | All credentials active |
| **10:30 - 11:30** | Prompt Engineering | Production Prompting & Structured JSON Output | The 5-part prompt architecture (Role, Task, Context, Constraints, Schema). Live build of classification workflow. | Tested JSON extraction workflow |
| **11:30 - 12:45** | **Agent Deep-Dive** | **Anatomy of an n8n AI Agent & Live Demo 1** | **Trainer Live Demo 1: Customer Support Triage Agent**. Attach Gemini 1.5 Flash, Tool Node, Memory, and System Prompt. | Fully functional Triage Agent |
| **12:45 - 01:45** | *Lunch Break* | *Lunch & Open Q&A* | *Informal Q&A on enterprise use cases and security.* | - |
| **01:45 - 03:00** | **Hands-on Lab 1** | **Individual Basic Agent Implementations** | Assign 12 distinct use cases (Workbook Part I). Trainer floats to debug and guide participants. | Individual Agent V1 working |
| **03:00 - 03:15** | *Afternoon Break* | *Tea Break* | *Prepare Vector DB credentials.* | Pinecone index validated |
| **03:15 - 04:30** | **RAG Foundation** | **Vector Embeddings, Pinecone & Live Demo 2** | Embeddings explained (768-dim geometric space). **Trainer Live Demo 2: Ingestion + QA RAG**. | Ingested docs & semantic retrieval |
| **04:30 - 05:15** | **Hands-on Lab 2** | **Individual RAG Assignments** | Participants attach Pinecone vector retrieval to their knowledge bases (Workbook Part II). | RAG query pipeline live |
| **05:15 - 05:30** | Wrap-Up & Roadmap | Showcase, Capstone Briefing & Homework | 2 participant demos. Outline Next Steps: Advanced Tools, MCP, A2A & Capstone. | Capstone track selected |

---

## 3. Trainer Live Demo 1: Building a Support Triage AI Agent

### 3.1 Business Context
The support desk receives unstructured customer emails ranging from billing complaints to technical bugs. The Agent must:
1. Parse the customer message.
2. Extract customer account status using a mock CRM lookup tool.
3. Classify urgency (`LOW`, `MEDIUM`, `CRITICAL`).
4. Generate an empathetic, policy-compliant response draft.

### 3.2 Workflow Architecture
```
[Webhook / Manual Trigger]
         │
         ▼
[AI Agent: @n8n/n8n-nodes-langchain.agent]
  ├── Subnode (Model): Google Gemini Chat Model (gemini-1.5-flash)
  ├── Subnode (Memory): Simple Memory (Window Buffer = 5)
  └── Subnode (Tool): Custom Code Tool ("crmLookupTool")
         │
         ▼
[Edit Fields / Output Format]
         │
         ▼
[Respond to Webhook]
```

### 3.3 Click-by-Click Live Build Instructions

1. **Create Canvas:** Drag in a **When chat message received** or **Manual Trigger** node.
2. **Add AI Agent:** Drag the **AI Agent** (`@n8n/n8n-nodes-langchain.agent`) node onto the canvas. Set Prompt Type to **"Define below"** and prompt to `={{ $json.chatInput || $json.input }}`.
3. **Attach Chat Model:** In the AI Agent node, click the subnode input for **Model** and select **Google Gemini Chat Model** (`@n8n/n8n-nodes-langchain.lmChatGoogleGemini`). Select Model `models/gemini-1.5-flash`.
4. **Attach Memory:** Connect **Simple Memory** (`@n8n/n8n-nodes-langchain.memoryBufferWindow`) to the **Memory** subnode. Set Context Window Length to `5`.
5. **Attach Tool:** Connect **Custom Code Tool** to the **Tool** subnode.
   - **Tool Name:** `lookup_customer_tier`
   - **Tool Description:** `Lookup customer VIP tier and outstanding balance given a customerId.`
   - **Code Implementation:**
   ```javascript
   const customerDb = {
     "CUST-101": { name: "Acme Corp", tier: "ENTERPRISE_VIP", openTickets: 3, balance: 0 },
     "CUST-102": { name: "Bob Smith", tier: "STANDARD", openTickets: 0, balance: 45.00 },
     "CUST-103": { name: "TechNova", tier: "ENTERPRISE_VIP", openTickets: 1, balance: 1200.00 }
   };
   const id = query.trim().toUpperCase();
   return JSON.stringify(customerDb[id] || { error: "Customer ID not found in database." });
   ```
6. **Configure System Prompt:** Inside the AI Agent node, set the System Prompt:
```
You are the Senior Customer Support Triage Specialist at TechFlow.
Your objective is to inspect incoming customer inquiries, lookup their customer tier using the lookup_customer_tier tool, and draft an empathetic, structured triage summary.

Rules:
1. Always look for a Customer ID (format: CUST-XXX) in the message. If present, immediately use the lookup_customer_tier tool.
2. If the customer is ENTERPRISE_VIP, set urgency to HIGH or CRITICAL.
3. If no Customer ID is provided, politely ask for it while addressing their immediate concern.
4. Output must be structured and professional.
```

### 3.4 Live Demonstration Test Scenarios

Run these 3 test inputs live on screen:
- **Scenario A (VIP Urgent):** *"Hi, my system is throwing 500 errors. My account is CUST-101. We cannot process payroll!"*  
  *Watch n8n visually trigger the tool, pull `Acme Corp` / `ENTERPRISE_VIP`, and output high priority.*
- **Scenario B (Standard User):** *"Hello, I have a quick question about my bill. My ID is CUST-102."*  
  *Watch it pull standard tier and address the $45 balance.*
- **Scenario C (Missing Info):** *"My server is broken, fix it!"*  
  *Watch agent recognize missing ID, refrain from guessing tools, and politely ask for ID.*

---

## 4. Trainer Live Demo 2: Complete RAG Implementation in n8n

### 4.1 Concept Demonstration
Contrast searching a 50-page document with keyword search vs asking Pinecone for semantic vectors. Show that keyword search for "vacation rules" misses "Paid Time Off policy", while Pinecone retrieves it effortlessly.

### 4.2 Workflow A: Document Ingestion Flow
1. **Trigger:** `Manual Trigger` (or `Local File Trigger` / Google Drive).
2. **Read File:** `Read/Write Files from Disk` (read sample `Company_Policy_2026.md`).
3. **Pinecone Vector Store Node:** Drag `@n8n/n8n-nodes-langchain.vectorStorePinecone`.
   - Set Mode: **Insert Documents**.
   - Pinecone Index: `n8n-rag-knowledgebase`.
4. **Subnode - Embeddings:** Attach `Embeddings Google Gemini` (`@n8n/n8n-nodes-langchain.embeddingsGoogleGemini`), model `models/text-embedding-004`.
5. **Subnode - Document Loader:** Attach `Default Data Loader` (`@n8n/n8n-nodes-langchain.documentDefaultDataLoader`).
6. **Subnode - Text Splitter:** Attach `Recursive Character Text Splitter` (`@n8n/n8n-nodes-langchain.textSplitterRecursiveCharacterTextSplitter`).
   - Chunk Size: `500` characters.
   - Chunk Overlap: `50` characters.
7. **Execute:** Click "Test step". Watch 25 document chunks vectorize into Pinecone in ~3 seconds. Open the Pinecone console to show vectors stored with metadata!

### 4.3 Workflow B: Question-Answering (Retrieval) Flow
1. **Trigger:** `When chat message received` (or `Manual Trigger`).
2. **AI Agent Node:** Set System Prompt:
```
You are an authoritative internal Company Policy Advisor.
Answer the employee's question ONLY using the factual context provided by the Pinecone retriever tool.
If the answer cannot be found in the retrieved context, state clearly: "I cannot find this information in the official policy handbook." Never speculate or invent benefits.
Always cite the specific policy section name at the bottom of your answer.
```
3. **Subnode - Model:** Google Gemini Chat Model (`gemini-1.5-flash`).
4. **Subnode - Tool:** Attach `Pinecone Vector Store` with Mode: **Retrieve Documents (As Tool for AI Agent)**.
   - Tool Name: `search_company_policy`
   - Description: `Search the official company policy handbook for answers regarding leave, remote work, expenses, and code of conduct.`
5. **Test Retrieval Live:**
   - Query: *"How many days of bereavement leave am I entitled to?"*
   - Observe the agent invoking `search_company_policy`, receiving the exact chunk, and answering with the exact days and citation.

---

## 5. Facilitator Troubleshooting & Common Pitfalls

| Issue Observed in Class | Root Cause | Immediate Fix |
| :--- | :--- | :--- |
| **"Dimensions mismatch" error in Pinecone** | Index created with 1536 dims (OpenAI) instead of 768 (Gemini) | Delete index and recreate with exactly 768 dimensions. |
| **Agent ignores the tool** | Tool description is vague or missing keywords | Write explicit trigger criteria in Tool Description: *"Use this tool whenever the user mentions..."* |
| **Agent hallucinates answers** | System prompt lacks negative constraint | Add: *"Do not use internal pre-trained knowledge. If not in context, reply 'Information not available'."* |
| **Gemini 429 Too Many Requests** | Exceeded 15 RPM on free tier during batch testing | Introduce a 2-second Wait node between batch executions or switch to flash model. |
| **Memory not persisting** | Session ID is hardcoded or missing in Chat Trigger | Ensure Session ID expression is mapped to `={{ $json.sessionId || 'default-session' }}`. |
