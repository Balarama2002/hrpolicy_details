# Capstone Project Specification & Evaluation Rubric
## Enterprise Autonomous AI Agent Demonstration

> **Program:** n8n AI Agent Development & Implementation Training  
> **Milestone:** Final Individual Capstone  
> **Duration:** 1 Week Implementation + Live 10-Minute Executive Demonstration

---

## 1. Project Overview & Objective

The Capstone Project is the synthesis of everything learned across the training program:
- Foundational and advanced n8n workflow design.
- Production prompt engineering and structured JSON outputs.
- Autonomous AI Agent nodes with subnodes (Model, Memory, Tools, Output Parsers).
- Semantic retrieval via Pinecone Vector Database (RAG).
- Tool integration (REST APIs, custom JavaScript tools, sub-workflows).
- Model Context Protocol (MCP) or Agent-to-Agent (A2A) orchestration patterns where applicable.
- Enterprise security, rate limiting, error handling, and auditability.

Participants must build a **real, functioning, end-to-end AI Agent solution** that solves an actual business friction point.

---

## 2. Six Approved Capstone Project Tracks

Participants may choose one of the following tracks or propose a customized enterprise use case approved by the instructor:

### Track 1: Multi-Tier IT Incident Resolution Agent
- **Scenario:** Autonomous IT agent that receives employee incident reports via Webhook/Chat, queries a Pinecone RAG runbook for troubleshooting steps, executes read-only diagnostic checks via HTTP Request tools, and automatically escalates critical outages with drafted Jira/Slack payloads.
- **Key Capabilities:** RAG + REST API Tool + Dynamic Branching + Human Approval for password resets.

### Track 2: Enterprise Policy & Compliance Copilot
- **Scenario:** Multi-document RAG assistant covering HR, Security, and Legal handbooks. Uses metadata filtering in Pinecone to query only the relevant policy branch based on user intent. Returns strict citations and abstains when policy is silent.
- **Key Capabilities:** Advanced RAG + Pinecone Metadata Filtering + Citations + Zero Hallucination Guardrails.

### Track 3: Intelligent Inbound RFP & Lead Qualification Agent
- **Scenario:** Ingests unformatted vendor inquiries or RFP summaries, extracts requirements into strict JSON, queries company product capabilities via RAG, scores fit (0–100), and posts qualified leads to CRM or Slack.
- **Key Capabilities:** Structured Output Parser + Vector Search + HTTP Request + Conditional Routing.

### Track 4: Autonomous E-Commerce Order Exception & Refund Agent
- **Scenario:** Handles customer order inquiries, shipping delays, and refund requests. Evaluates customer refund eligibility against policy (<30 days, damaged goods), calls an external mock order API tool, and triggers a human approval node for refunds over $100.
- **Key Capabilities:** AI Agent + Custom Tool + Human-in-the-Loop Node + State Memory.

### Track 5: n8n MCP Server Gateway & Enterprise Tool Orchestrator
- **Scenario:** Exposes n8n business workflows as a compliant Model Context Protocol (MCP) tool server, allowing external AI clients (Claude Desktop, custom agent) to securely trigger enterprise data lookups and reports.
- **Key Capabilities:** Webhook MCP SSE/JSON-RPC integration + Tool Schema Declaration + Token Authentication.

### Track 6: Hierarchical Multi-Agent Market & Competitor Intelligence System
- **Scenario:** A Coordinator Agent receives a research prompt and dispatches sub-tasks to a Web Scraper Agent and a Data Synthesis Agent via sub-workflows, culminating in an executive briefing document.
- **Key Capabilities:** Multi-Agent pattern + Sub-workflow Orchestration + Document Generation.

---

## 3. Required Deliverables & Artifacts

Each participant must submit the following repository package:
1. **Exported n8n Workflow JSON(s):** Exported directly from the n8n canvas (`File` -> `Download`).
2. **Architecture Diagram:** Visual workflow map (PNG or Mermaid diagram) showing data flow, subnodes, and integrations.
3. **Knowledge Base Documents:** Any markdown or text files used to seed the Pinecone vector index.
4. **Test Suite & Verification Log:** Documentation of at least 5 positive test queries, 3 negative/edge-case tests, and prompt injection defense tests.
5. **README & Runbook:** Clear setup instructions detailing required credentials, Pinecone index configuration, and sample curl requests.

---

## 4. Live Demonstration Requirements (10 Minutes)

The live presentation will be conducted in front of peers and technical evaluators:
- **Minute 0–2: Business Problem & Architecture (2 mins)**  
  Present the problem statement, business value, and system architecture.
- **Minute 2–7: Live Canvas Demonstration (5 mins)**  
  Trigger the live workflow in real-time. Show the AI Agent reasoning, tool invocation in execution logs, vector retrieval in Pinecone, and final formatted output.
- **Minute 7–9: Edge Case & Guardrail Testing (2 mins)**  
  Submit a query with missing data and a query attempting to elicit a hallucination or policy bypass. Demonstrate how the agent gracefully handles it.
- **Minute 9–10: Evaluator Q&A (1 min)**  
  Answer technical questions regarding scalability, cost, and security.

---

## 5. Comprehensive Capstone Evaluation Rubric (100 Points Total)

| Category | Weight | Evaluation Criteria | Max Points |
| :--- | :---: | :--- | :---: |
| **1. Business Utility & Functionality** | 15% | Does the solution solve a realistic enterprise problem? Does it execute reliably from end to end without manual intervention? | 15 |
| **2. n8n Architecture & Subnode Design** | 15% | Clean workflow layout, proper separation of concerns, correct usage of subnodes (`lmChatGoogleGemini`, `memoryBufferWindow`, tools, output parsers). | 15 |
| **3. Prompt Engineering & Guardrails** | 15% | System prompt includes clear Role, Task, Constraints, Output Schema, and explicit negative fallback instructions. | 15 |
| **4. Retrieval Quality (RAG / Tools)** | 15% | If RAG: Correct chunking, 768-dim Pinecone index, clean citations, zero hallucination. If Tools: Accurate invocation criteria and error handling. | 15 |
| **5. Error Handling & Edge Cases** | 10% | Handles empty inputs, API rate limits, tool timeouts, and invalid IDs gracefully with user-friendly error messages. | 10 |
| **6. Security & Credential Hygiene** | 10% | Zero hardcoded keys in nodes or prompts. Follows credential vault practices. Sensitive PII handled appropriately. | 10 |
| **7. Testing & Verification Rigor** | 10% | Comprehensive test matrix with positive, negative, and adversarial test cases documented in the execution history. | 10 |
| **8. Documentation & Live Presentation** | 10% | Clear README, professional 10-minute live demo, articulate explanation of technical choices. | 10 |
| **TOTAL** | **100%** | **Passing Score: 80 / 100** | **100** |
