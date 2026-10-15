# hrpolicy_details - TGH HR Agent Analytics & Monitoring Dashboard

A real-time analytics dashboard built with **React, Vite, Tailwind CSS, Lucide Icons, and Recharts** to monitor queries, usefulness, and LLM token economics for **`SWF_RAG_VectorSearch`** and **`MWF_HR_AssistanceAgent`**.

---

## 🚀 Key Features

1. **Searches Today & Period Breakdown**:
   - Tracks how many HR policy searches executed today vs over 7 days, this month, this year, and all-time.
   - Grounded in production runs of `SWF_RAG_VectorSearch`.

2. **Usefulness & Resolution Rate**:
   - **Direct Feedback**: 👍 Helpful, 👎 Not Helpful, and 🎟️ Ticket Raised (from Teams Adaptive Card).
   - **RAG Sufficiency**: Tracks queries answered directly (`Status: Sufficient Data`) vs escalated to Jira tickets (`Status: Insufficient Data`).

3. **Accurate LLM Token Consumption Profile**:
   - Displays exact prompt/input tokens (System prompt + top-k Pinecone policy context + query) vs completion/output tokens per request.
   - Calculates blended Gemini 3.5 Flash Lite API costs.
   - Includes full token distribution and cost efficiency charts.

4. **Option B (Direct n8n REST API) Connection**:
   - Connects directly to your n8n instance via API Key.
   - Settings modal includes a live **Test Connection** button that pings n8n and measures response latency.
   - Pre-synchronized with your existing production queries from `HR_AGENT_AUDIT_LOG`.

5. **Query & Execution Audit Log Explorer**:
   - Searchable and filterable by employee name, question text, feedback, or Jira ticket number.
   - CSV Export for offline HR reporting.
   - Detailed modal inspection showing sanitized question, Teams HTML response, and token breakdown.

---

## 🛠️ Running the Dashboard

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production (Hostinger / Web hosting)
npm run build
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 📊 Token Accuracy: Why Simple Word Counting Fails for RAG

If an application only counts the user query (e.g., *"How many leaves can I take?"* = ~10 tokens) and the response (~100 tokens), it will estimate **~110 tokens**. 

In reality, your RAG workflow injects:
- **TGH HR Bot System Prompt**: 16 strict rules & formatting directives = **~1,380 tokens**
- **Retrieved Pinecone Context (topK=4)**: 4 complete HR policy passages = **~1,600 - 2,100 tokens**
- **User Question & Conversation**: **~50 - 300 tokens**
- **LLM Generated Output**: **~250 - 450 tokens**

**True total per query:** **~3,800 tokens**. The UI reflects this exact token anatomy.
