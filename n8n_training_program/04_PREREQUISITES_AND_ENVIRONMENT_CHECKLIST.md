# Pre-Workshop Prerequisites and Environment Setup Checklist
## n8n AI Agent Development & Hands-on Implementation Program

> **Audience:** Workshop Participants & IT Administrators  
> **Target Platform:** n8n (v1.60+), Google Gemini API, Pinecone Vector Database  
> **Objective:** Complete all setup and verification steps *before* Session 1 to ensure a seamless hands-on learning experience.

---

## 1. Setup Overview & Session Timeline Matrix

Not every resource is required on Day 1. The table below delineates what must be active before the first session versus what is introduced in later modules:

| Resource / Service | Purpose | Required For | Verification SLA | Cost Tier |
| :--- | :--- | :--- | :--- | :--- |
| **n8n Instance** (Cloud or Self-Hosted) | Primary workflow orchestration & AI Agent runtime | **Module 2 (Day 1)** | 24h before Day 1 | Free Trial / Team / Self-Hosted Docker (Free) |
| **Google Gemini API Key** | Primary LLM provider (Gemini 1.5 Pro / Flash) & Embeddings | **Module 4 (Day 1)** | 24h before Day 1 | Google AI Studio Free Tier / Pay-as-you-go |
| **Pinecone Account & Index** | Vector Database for RAG & Semantic Retrieval | **Module 6 (Day 2)** | Before Module 6 | Free Starter Tier (1 index, 100k vectors) |
| **Modern Web Browser** | Accessing n8n Canvas UI & Google AI Studio | **Module 1 (Day 1)** | Immediate | Chrome / Edge / Firefox (Latest) |
| **Sample Datasets / Docs** | Markdown, PDF, and JSON sample data for lab tests | **Module 5 & 7** | Provided in Course Repo | Free |
| **API Client (Postman / curl)** | Testing n8n Webhooks and API endpoints | **Module 2 (Day 1)** | Day 1 | Free |

---

## 2. Step-by-Step Account Setup Instructions

### 2.1 n8n Setup Options

Participants have two primary options for accessing n8n:

#### Option A: n8n Cloud (Recommended for Corporate Training)
1. Navigate to [https://n8n.io](https://n8n.io) and register for a workspace or accept the invite to your corporate team workspace.
2. Verify that your role has **Workflow Creator** or **Editor** permissions.
3. Access your instance URL: `https://<your-organization>.app.n8n.cloud`.
4. Log in and verify that the canvas renders without WebSocket errors.

#### Option B: Local / Self-Hosted Docker Setup (Alternative)
For developers running on local machines or local servers:
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e N8N_DEFAULT_BINARY_DATA_MODE=filesystem \
  -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n:latest
```
Open `http://localhost:5678` in your browser and complete the initial owner account creation.

---

### 2.2 Google Gemini API Setup

We utilize Google Gemini for both Chat Completion (Chat Models) and Vector Embeddings.

1. Navigate to **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/).
2. Log in with your corporate Google Account (or designated development account).
3. Click **"Get API key"** in the left navigation sidebar.
4. Click **"Create API key"** -> Select an existing Google Cloud Project or select **"Create API key in new project"**.
5. Copy the generated API key.
6. **Verification Test:** Run the following curl command in terminal/PowerShell (replace `$GEMINI_API_KEY` with your key):
```powershell
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{"contents":[{"parts":[{"text":"Hello, confirm you are working."}]}]}'
```
*Expected Response:* A JSON payload containing `"candidates"` with a generated greeting.

> [!CAUTION]
> **Credential Security Rule:** Never paste your raw API key into workflow prompts, notes, chat channels, or git repositories. We will store it securely inside **n8n Credentials**.

---

### 2.3 Pinecone Vector Database Setup

Pinecone serves as our managed vector store for Module 6 and Module 7 (RAG).

1. Navigate to **Pinecone Console**: [https://app.pinecone.io/](https://app.pinecone.io/) and create a free account.
2. In the sidebar, navigate to **API Keys** and copy your `Default` API key.
3. In the sidebar, click **Indexes** -> **Create Index**:
   - **Index Name:** `n8n-rag-knowledgebase`
   - **Dimensions:** `768` (Crucial: Google's `text-embedding-004` outputs 768-dimensional vectors)
   - **Metric:** `cosine`
   - **Capacity Mode:** `Serverless`
   - **Cloud Provider & Region:** `aws` / `us-east-1` (Free tier compatible)
4. Click **Create Index** and wait until the status shows **Ready** (Green).

---

## 3. Configuring Credentials Securely in n8n

Before creating any workflows, register the credentials in n8n's centralized encrypted credential vault:

### 3.1 Register Google Gemini Credential
1. In n8n, click **Credentials** on the left menu -> **Add Credential**.
2. Search for: **Google Gemini API** (or `googlePalmApi`).
3. Enter:
   - **Credential Name:** `Google Gemini - Training Key`
   - **API Key:** `[Paste your Gemini API key here]`
4. Click **Save**. n8n tests the credential and displays a green "Connection tested successfully" checkmark.

### 3.2 Register Pinecone Credential
1. Click **Credentials** -> **Add Credential**.
2. Search for: **Pinecone API** (`pineconeApi`).
3. Enter:
   - **Credential Name:** `Pinecone - Training Key`
   - **API Key:** `[Paste your Pinecone API key here]`
   - **Environment:** (Leave as default or enter region if using older Pod-based index)
4. Click **Save** and verify the connection status.

---

## 4. Quotas, Rate Limits & Cost Management

To avoid unexpected workflow failures during live lab exercises, review these limits:

| Service | Model / Tier | Free Tier Limits | Strategy to Prevent Throttling |
| :--- | :--- | :--- | :--- |
| **Google Gemini** | `gemini-1.5-flash` | 15 Requests Per Minute (RPM), 1M Tokens/Min | Use `gemini-1.5-flash` for initial tests; set n8n loop delay of 1s if batch processing. |
| **Google Gemini** | `text-embedding-004` | 1,500 Requests Per Minute | Batch documents in groups of 10-20 chunks per API call. |
| **Pinecone** | Serverless Starter | 1 Index, 2GB vector storage, 2M read/write units | Store up to 100,000 document chunks free of charge. |
| **n8n** | Cloud Starter / Self-Hosted | Unlimited workflow runs (Self-hosted) or 2,500 executions/mo (Starter) | Keep testing executions under 100 runs per participant during class. |

---

## 5. Pre-Workshop Troubleshooting & Verification Checklist

Check off each item prior to the first session:

- [ ] Can access n8n canvas and create a new blank workflow.
- [ ] Created a `Manual Trigger` node, added an `Edit Fields` (Set) node, and successfully executed it.
- [ ] Google Gemini API key generated and verified via curl or browser.
- [ ] Google Gemini credential added to n8n and passed test connection.
- [ ] Pinecone account registered, API key generated, and `n8n-rag-knowledgebase` index (768 dimensions, cosine) created.
- [ ] Pinecone credential added to n8n and passed test connection.
- [ ] Pop-up blockers and aggressive browser ad-blockers disabled for the n8n domain (ad-blockers can block WebSockets).
