import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page count 'Page X of Y'
    and consistent corporate running headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber == 1:
            # Suppress headers/footers on cover page
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#718096"))

        # Running Header
        self.drawString(54, letter[1] - 36, "n8n AI Agent Development & Implementation Program | Master Training Handbook")
        self.setStrokeColor(colors.HexColor("#CBD5E0"))
        self.setLineWidth(0.5)
        self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

        # Running Footer
        self.line(54, 45, letter[0] - 54, 45)
        self.drawString(54, 32, "Confidential - For Internal Corporate Training Use Only")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 32, page_str)
        self.restoreState()


def build_pdf(filename="n8n_AI_Agent_Training_Master_Handbook.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Corporate Color Palette
    c_primary = colors.HexColor("#1A365D")   # Deep Corporate Navy
    c_secondary = colors.HexColor("#2B6CB0") # Slate Blue
    c_dark = colors.HexColor("#2D3748")      # Charcoal Body Text
    c_code_bg = colors.HexColor("#F7FAFC")
    c_border = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=c_primary,
        spaceAfter=12
    )

    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=17,
        textColor=c_secondary,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=c_secondary,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor("#2C5282"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_dark,
        spaceAfter=5
    )

    code_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#1A202C")
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#2C5282")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=c_dark
    )

    story = []

    def add_callout(text, title="NOTE / BEST PRACTICE", bg_hex="#EBF8FF", border_hex="#3182CE"):
        p_title = Paragraph(f"<b>{title}</b>", ParagraphStyle('CTitle', parent=callout_style, fontName='Helvetica-Bold', fontSize=8, leading=10, textColor=colors.HexColor(border_hex)))
        p_text = Paragraph(text, callout_style)
        t = Table([[p_title], [p_text]], colWidths=[letter[0] - 108])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg_hex)),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor(border_hex)),
            ('LINELEFT', (0,0), (0,-1), 3.5, colors.HexColor(border_hex)),
        ]))
        story.append(Spacer(1, 3))
        story.append(t)
        story.append(Spacer(1, 4))

    def add_code(text):
        safe_text = text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>').replace(' ', '&nbsp;')
        p = Paragraph(safe_text, code_style)
        t = Table([[p]], colWidths=[letter[0] - 108])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), c_code_bg),
            ('BOX', (0,0), (-1,-1), 0.5, c_border),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(Spacer(1, 3))
        story.append(t)
        story.append(Spacer(1, 4))

    def add_table(header_data, rows_data, col_widths=None):
        if col_widths is None:
            col_widths = [(letter[0] - 108) / len(header_data)] * len(header_data)
        
        table_content = []
        table_content.append([Paragraph(h, table_header_style) for h in header_data])
        for r in rows_data:
            table_content.append([Paragraph(str(c), table_cell_style) for c in r])
        
        t = Table(table_content, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_primary),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#F7FAFC")]),
        ]))
        story.append(Spacer(1, 3))
        story.append(t)
        story.append(Spacer(1, 4))

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=6, color=c_secondary, spaceBefore=0, spaceAfter=18))
    story.append(Paragraph("n8n AI Agent Development &amp; Implementation Program", title_style))
    story.append(Paragraph("Master Engineering Handbook: Practical Step-by-Step Implementation from Zero to Autonomous Multi-Agent Systems", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=8, spaceAfter=25))

    meta_text = """
    <b>Document Type:</b> Master Corporate Technical Training Handbook &amp; Assignment Workbook<br/>
    <b>Primary Platform:</b> n8n Automation Engine (v1.60+) with LangChain Cluster Nodes<br/>
    <b>Foundational AI Models:</b> Google Gemini 1.5 Flash / Pro (Chat) &amp; text-embedding-004 (Embeddings)<br/>
    <b>Vector Database:</b> Pinecone Serverless (768 Dimensions, Cosine Metric)<br/>
    <b>Protocols Covered:</b> ReAct Reasoning, Vector RAG, Model Context Protocol (MCP), Agent-to-Agent (A2A)<br/>
    <b>Author / Facilitator:</b> Senior AI Solutions Architect, RAG Specialist &amp; Technical Trainer<br/>
    <b>Edition:</b> Enterprise Production Edition 2026
    """
    story.append(Paragraph(meta_text, body_style))
    story.append(Spacer(1, 40))

    add_callout(
        "This master document provides complete step-by-step guidance for corporate training sessions. It includes foundational theory, live trainer demonstration scripts, a library of 22 simple, practical business use cases with exact configurations, testing matrices, and evaluation rubrics.",
        title="EXECUTIVE TRAINING BRIEFING"
    )

    story.append(PageBreak())

    # =========================================================================
    # TABLE OF CONTENTS
    # =========================================================================
    story.append(Paragraph("Comprehensive Training Program Roadmap", h1_style))
    story.append(Paragraph("The curriculum is structured into 12 rigorous modules, providing an unbroken progression from baseline automation to autonomous agent swarms:", body_style))

    toc_data = [
        ["Module 1: AI & LLM Fundamentals from Scratch", "Tokens, tokenization, context windows, temperature, hallucinations, embeddings, and ReAct."],
        ["Module 2: n8n Automation Engine & Core Architecture", "Node graph mechanics, execution history, expressions ($json, nodeJson), and data mapping."],
        ["Module 3: Pre-Workshop Environment Setup", "Turnkey registration & API verification for n8n, Google Gemini, and Pinecone Serverless."],
        ["Module 4: Production Prompt Engineering", "5-pillar prompt architecture, structured JSON schemas, and defensive prompt injection filtering."],
        ["Module 5: Designing Autonomous AI Agents in n8n", "AI Agent nodes, subnodes (Model, Memory, Tools, Parsers), and Trainer Live Demo 1 (Support Triage)."],
        ["Part I: Foundational Agent Assignments", "12 complete, simple business use cases with 16-point specifications for individual participants."],
        ["Module 6: Vector Databases & Embeddings Architecture", "Semantic vector space, chunking strategies, overlap rules, and Pinecone index management."],
        ["Module 7: Retrieval-Augmented Generation (RAG) Mastery", "Offline ingestion vs online retrieval, grounding, and Trainer Live Demo 2 (Company Policy RAG)."],
        ["Part II: Semantic Retrieval (RAG) Assignments", "10 domain-specific RAG projects with knowledge bases, metadata schemas, and factuality checklists."],
        ["Module 8: Advanced Agent Capabilities & Memory", "Heterogeneous tools (HTTP, Code, DB), session memory, and Human-in-the-Loop approval nodes."],
        ["Module 9: Model Context Protocol (MCP) Integration", "MCP client-server architecture, exposing n8n workflows as tools, consuming external servers."],
        ["Module 10: Agent-to-Agent (A2A) Orchestration", "Hierarchical coordinator-specialist architectures, task delegation, and multi-agent systems."],
        ["Module 11: Production Readiness & Governance", "Credential vaulting, rate limiting, error alert workflows, evaluation datasets, and audit trails."],
        ["Module 12: Final Capstone Project & Evaluation", "6 enterprise project tracks, submission requirements, 10-minute live demo, and 100-point rubric."],
        ["Master Facilitator Session Timeline", "Detailed minute-by-minute agenda for the full-day Saturday intensive workshop."],
        ["Appendix: Master Glossary of AI & n8n Terminology", "Authoritative definitions for all critical agentic, RAG, and automation terms."]
    ]
    add_table(["Curriculum Section", "Core Competencies Delivered"], toc_data, [180, 324])

    story.append(PageBreak())

    # =========================================================================
    # MODULE 1: AI & LLM FUNDAMENTALS
    # =========================================================================
    story.append(Paragraph("Module 1: AI & LLM Fundamentals from Scratch", h1_style))
    story.append(Paragraph("1.1 The AI Hierarchy: From Rules to Generative Models", h2_style))
    story.append(Paragraph(
        "To engineer effective agentic workflows, developers must understand that Large Language Models (LLMs) are not databases or deterministic calculation engines. They are <b>probabilistic next-token predictors</b>. When an LLM receives an input prompt, it computes probability distributions across its learned vocabulary to generate subsequent tokens.",
        body_style
    ))

    add_table(
        ["Core Concept", "Technical Definition", "Practical Implication for n8n Developers"],
        [
            ["Token", "Atomic linguistic chunk (~4 characters or 0.75 words).", "API costs and context limits are strictly measured in tokens."],
            ["Context Window", "Total token capacity processed in a single inference call.", "Gemini 1.5 Flash provides 1M tokens; ideal for massive documents."],
            ["Temperature", "Hyperparameter (0.0 to 1.0+) controlling sampling randomness.", "Set to 0.0 for strict JSON extraction and classification; 0.7 for creative drafts."],
            ["Hallucination", "Plausible-sounding output unsupported by factual data.", "Must be mitigated using Grounding and Vector RAG context injection."],
            ["Embedding", "High-dimensional vector array representing semantic meaning.", "Enables mathematical similarity search across documents in Pinecone."]
        ],
        [90, 180, 234]
    )

    story.append(Paragraph("1.2 The Evolution: LLM vs. Assistant vs. Agent vs. Agentic AI", h2_style))
    add_table(
        ["Dimension", "Raw LLM", "AI Assistant (Chatbot)", "Autonomous AI Agent", "Agentic AI System"],
        [
            ["Control Flow", "Stateless, single turn", "Multi-turn, user-guided", "Goal-oriented ReAct loop", "Multi-agent coordination"],
            ["Tool Usage", "None (text only)", "Static pre-set plugins", "Autonomous API & DB calls", "Dynamic cross-agent tools"],
            ["Memory", "Zero internal state", "Ephemeral chat window", "Buffer + Vector memory", "Distributed shared state"],
            ["Autonomy", "Passive text generation", "Waits for user prompt", "Decomposes goals, handles errors", "Self-healing enterprise mesh"]
        ],
        [74, 95, 110, 115, 110]
    )

    story.append(Spacer(1, 4))
    story.append(Paragraph("1.3 The LLM Request Lifecycle", h2_style))
    story.append(Paragraph(
        "Understanding how a prompt flows from user input to final completion prevents architectural errors:<br/>"
        "<b>1. User Input:</b> Raw text submitted via Webhook or Chat.<br/>"
        "<b>2. Prompt Construction:</b> System Prompt + Injected Context + Conversation Memory + User Message.<br/>"
        "<b>3. Tokenization:</b> Text is converted into token integer IDs.<br/>"
        "<b>4. Transformer Inference:</b> Attention heads evaluate relationships; softmax layer generates probabilities.<br/>"
        "<b>5. De-Tokenization & Streaming:</b> Highest probability tokens converted back to text and returned to n8n.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # MODULE 2: N8N AUTOMATION ENGINE & CORE ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("Module 2: n8n Automation Engine & Core Architecture", h1_style))
    story.append(Paragraph("2.1 Why n8n is the Premier Low-Code Agent Canvas", h2_style))
    story.append(Paragraph(
        "Writing agent logic in pure code (e.g. raw Python scripts) forces teams to reinvent connection pooling, queuing, state serialization, error recovery, API authentication, and execution logging. n8n provides all of this out of the box with complete visual observability.",
        body_style
    ))

    story.append(Paragraph("2.2 Dynamic Expressions and the Critical Subnode Scoping Rule", h2_style))
    story.append(Paragraph(
        "Every node in n8n consumes an array of JSON objects and outputs an array of JSON objects. Understanding how data traverses n8n is vital:",
        body_style
    ))

    add_code(
"""// 1. Standard node data access (Edit Fields, HTTP Request, IF):
{{ $json.myVariable }}                       // Current item field
{{ $('Webhook').first().json.body.email }}    // Upstream node reference

// 2. CRUCIAL RULE inside AI Agent Subnodes (Tools, Parsers, Memory):
// Subnodes DO NOT share item context with predecessor nodes!
// Never use $json inside a Tool subnode. Instead use nodeJson():
{{ nodeJson('Webhook', 'body.customerId') }}"""
    )

    add_callout(
        "The #1 mistake beginners make in n8n AI workflows is referencing {{ $json.field }} inside a Tool subnode. Subnodes execute in an isolated execution scope. Always reference upstream triggers using nodeJson('TriggerNodeName', 'path.to.key').",
        title="CRITICAL SUBNODE SCOPING RULE",
        bg_hex="#FFF5F5",
        border_hex="#E53E3E"
    )

    story.append(Paragraph("2.3 Hands-on Exercise: Data Transformation Pipeline", h2_style))
    story.append(Paragraph("Build a verification flow: Webhook -> Edit Fields -> IF -> Respond to Webhook.", body_style))

    add_table(
        ["Node Name", "Node Type", "Key Parameter / Expression", "Expected Behavior"],
        [
            ["Customer Ingest", "Webhook", "Path: /customer-ingest, Method: POST", "Receives raw customer payload"],
            ["Normalize Data", "Edit Fields (Set)", "name: ={{ $json.name.toUpperCase() }}<br/>vip: ={{ $json.total >= 100 }}", "Transforms data types and computes boolean flag"],
            ["Check VIP", "IF", "Conditions: vip Equal true", "Branches flow based on VIP status"],
            ["Send Response", "Respond to Webhook", "Response Body: ={{ JSON.stringify($json) }}", "Returns clean JSON to calling client"]
        ],
        [95, 105, 174, 130]
    )

    story.append(PageBreak())

    # =========================================================================
    # MODULE 3: PRE-WORKSHOP PREREQUISITES & ENVIRONMENT SETUP
    # =========================================================================
    story.append(Paragraph("Module 3: Pre-Workshop Prerequisites & Setup", h1_style))
    story.append(Paragraph("3.1 Service Setup & SLA Matrix", h2_style))
    story.append(Paragraph(
        "To ensure a seamless hands-on learning experience, all accounts and API credentials must be provisioned and tested prior to live lab sessions:",
        body_style
    ))

    add_table(
        ["Resource / Service", "Purpose", "Required For", "Cost Tier & Quotas", "Verification Action"],
        [
            ["n8n Instance", "Workflow & Agent Orchestration", "Module 2 (Day 1)", "Cloud Free Trial / Self-Hosted Docker", "Access canvas UI & test manual execution."],
            ["Google Gemini API", "Chat Model & Embeddings", "Module 4 (Day 1)", "Google AI Studio Free Tier (15 RPM)", "Execute curl generateContent test."],
            ["Pinecone Vector DB", "Semantic Vector Store for RAG", "Module 6 (Day 2)", "Free Starter Tier (1 index, 100k vectors)", "Create index 'n8n-rag-knowledgebase' (768 dims)."],
            ["Web Browser", "Canvas UI & Management", "Immediate", "Free (Chrome / Edge / Firefox)", "Disable aggressive ad-blockers on n8n domain."]
        ],
        [90, 110, 85, 115, 104]
    )

    story.append(Paragraph("3.2 Secure Credential Registration in n8n", h2_style))
    story.append(Paragraph(
        "<b>Rule:</b> Never paste raw API keys into workflow notes, prompt bodies, or code blocks.<br/>"
        "1. Open n8n -> Navigate to <b>Credentials</b> on left menu -> Click <b>Add Credential</b>.<br/>"
        "2. Add <b>Google Gemini API</b> -> Paste API Key -> Click Save (Verifies with green checkmark).<br/>"
        "3. Add <b>Pinecone API</b> -> Paste API Key -> Click Save (Verifies connection).",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # MODULE 4: PRODUCTION PROMPT ENGINEERING & STRUCTURED OUTPUTS
    # =========================================================================
    story.append(Paragraph("Module 4: Production Prompt Engineering", h1_style))
    story.append(Paragraph("4.1 The 5-Pillar Production Prompt Framework", h2_style))
    story.append(Paragraph(
        "Enterprise prompt engineering is about <b>deterministic behavioral containment</b>. Every production prompt must include these 5 structural blocks:",
        body_style
    ))

    add_table(
        ["Structural Block", "Core Purpose", "Production Example"],
        [
            ["1. Role & Identity", "Establishes persona, domain authority & scope", "'You are an Enterprise Support Triage Officer at TechFlow.'"],
            ["2. Primary Task", "Clear, unambiguous statement of work", "'Analyze the customer email and classify urgency based on business impact.'"],
            ["3. Context & Variables", "Injected reference data or document chunks", "'Context from CRM: {{ nodeJson(\"Webhook\", \"body.crmData\") }}'"],
            ["4. Negative Constraints", "Explicit rules on what the model MUST NOT do", "'NEVER invent account details. If missing ID, request it politely.'"],
            ["5. Output Schema", "Strict formatting directives or JSON structure", "'Output your decision adhering strictly to the JSON schema provided.'"]
        ],
        [100, 160, 244]
    )

    story.append(Paragraph("4.2 Five Before-and-After Production Prompt Examples", h2_style))

    add_table(
        ["Use Case", "Naive Prompt (Fragile / Prone to Failure)", "Production Prompt (Robust & Deterministic)"],
        [
            ["Ticket Triage", "Tell me if this customer is angry and what they want.", "You are a Triage Officer. Classify email into: [BILLING, BUG, ACCESS]. Rate sentiment: [FRUSTRATED, NEUTRAL, HAPPY]. If downtime mentioned, set priority P1_CRITICAL."],
            ["Invoice Parsing", "Extract all the information from this invoice.", "Extract vendorName, invoiceId (INV-XXXXX), totalAmount (float, 2 decimals), dueDate (YYYY-MM-DD). If missing, set null and manualReviewRequired: true."],
            ["Policy Inquiries", "Answer the employee's question about vacation.", "Answer using ONLY the provided HR Policy Context. If not explicitly in context, reply word-for-word: 'This policy is not covered in the official 2026 handbook.'"],
            ["SQL Generation", "Write SQL to find all sales last month.", "Generate a single SELECT query on table 'orders'. Output ONLY raw SQL. NEVER generate INSERT, UPDATE, DELETE, or DROP. Append LIMIT 50."],
            ["Standup Summary", "Summarize what the developers said today.", "Transform raw updates into 3 sections: 1. Accomplished Yesterday, 2. Planned Today, 3. Blockers. Highlight critical blockers in bold red."]
        ],
        [80, 180, 244]
    )

    story.append(PageBreak())

    # =========================================================================
    # MODULE 5: DESIGNING AUTONOMOUS AI AGENTS IN N8N
    # =========================================================================
    story.append(Paragraph("Module 5: Designing Autonomous AI Agents in n8n", h1_style))
    story.append(Paragraph("5.1 Anatomy of an n8n AI Agent", h2_style))
    story.append(Paragraph(
        "An n8n AI Agent node (<code>@n8n/n8n-nodes-langchain.agent</code>) coordinates reasoning and action via specialized subnode connectors:",
        body_style
    ))

    add_table(
        ["Subnode Connector", "Supported n8n Node", "Configuration Parameters", "Functional Responsibility"],
        [
            ["Model", "Google Gemini Chat Model", "Model: gemini-1.5-flash, Temp: 0.0", "Core cognitive engine that evaluates prompts and tool calls."],
            ["Memory", "Simple Memory", "Window Buffer: 5 messages", "Stores recent dialogue turns so the agent remembers context."],
            ["Tools", "Custom Code Tool / Pinecone", "Tool Name, Strict Tool Description", "External actions the agent can choose to execute."],
            ["Output Parser", "Structured Output Parser", "JSON Schema Definition", "Forces model completion into strictly validated JSON."]
        ],
        [90, 120, 144, 150]
    )

    story.append(Paragraph("5.2 Trainer Live Demonstration 1: Customer Support Triage Agent", h2_style))
    story.append(Paragraph(
        "In this live build, the trainer constructs an autonomous support triage agent on an empty canvas. The agent accepts raw user messages, uses a custom tool to look up customer tier in a database, and generates structured priority classifications.",
        body_style
    ))

    add_code(
"""// Custom Code Tool Implementation: lookup_customer_tier
const customerDb = {
  "CUST-101": { name: "Acme Corp", tier: "ENTERPRISE_VIP", balance: 0 },
  "CUST-102": { name: "Bob Smith", tier: "STANDARD", balance: 45.00 }
};
const id = query.trim().toUpperCase();
return JSON.stringify(customerDb[id] || { error: "Customer not found." });"""
    )

    add_code(
"""# System Prompt for Support Triage Agent
You are the Senior Customer Support Triage Specialist at TechFlow.
Your objective is to inspect incoming inquiries, lookup the customer tier using the lookup_customer_tier tool, and draft an empathetic summary.

Strict Rules:
1. Look for a Customer ID (format: CUST-XXX). If present, immediately invoke the tool.
2. If tier is ENTERPRISE_VIP, mark priority as P1_CRITICAL.
3. If no Customer ID is present, politely request it while acknowledging their inquiry.
4. Never invent customer account details."""
    )

    story.append(PageBreak())

    # =========================================================================
    # PART I: INDIVIDUAL BASIC AGENT ASSIGNMENTS (12 USE CASES)
    # =========================================================================
    story.append(Paragraph("Part I: Foundational AI Agent Assignments (12 Use Cases)", h1_style))
    story.append(Paragraph(
        "Each participant is assigned one distinct, practical business project. All projects follow a simple, step-by-step implementation pattern without RAG complexity:",
        body_style
    ))

    cases_summary = [
        ["Case 01 (Part. 1)", "Customer Support Ticket Triager", "Classify urgency (P1/P2/P3), extract sentiment, output structured JSON."],
        ["Case 02 (Part. 2)", "Expense Receipt Classifier", "Parse merchant, float amount, date, and tax category (Meals/Travel)."],
        ["Case 03 (Part. 3)", "Meeting Action Item Extractor", "Extract tabular checklist with Task, Assignee, Deadline, and Dependencies."],
        ["Case 04 (Part. 4)", "Sales Lead Qualification Agent", "Evaluate BANT criteria; score lead 1-100; branch with IF node (HOT vs COLD)."],
        ["Case 05 (Part. 5)", "Order Status Inquiry Agent", "Extract order ID; call Custom Code Tool (mock orders); return delivery ETA."],
        ["Case 06 (Part. 6)", "IT Password & Access Triager", "Identify system (Okta/Jira/AWS); assess risk; supply self-service URL."],
        ["Case 07 (Part. 7)", "Vendor Invoice Data Extractor", "Extract line items, subtotal, tax, and verify arithmetic total."],
        ["Case 08 (Part. 8)", "Candidate Resume Screener", "Compare resume against Job Description; score match %; list strengths & gaps."],
        ["Case 09 (Part. 9)", "Appointment Scheduling Coordinator", "Normalize relative dates to ISO; verify working hours; call slot tool."],
        ["Case 10 (Part. 10)", "Daily Standup Summarizer", "Consolidate fragmented team updates into Accomplished, Planned, and Blockers."],
        ["Case 11 (Part. 11)", "Social Media Sentiment Agent", "Analyze brand mentions; detect sarcasm; calculate sentiment score (-1.0 to 1.0)."],
        ["Case 12 (Part. 12)", "Database Query Assistant", "Convert natural language to mock SQL SELECT; guard against DELETE/DROP."]
    ]
    add_table(["Case Identifier", "Project Title", "Core Functional Deliverable"], cases_summary, [100, 160, 244])

    story.append(Spacer(1, 4))
    story.append(Paragraph("Deep Dive: Case 05 - Order Status Inquiry Agent (Step-by-Step Guide)", h2_style))
    story.append(Paragraph(
        "<b>1. Business Problem:</b> High volume of 'Where is my order?' queries burden human agents.<br/>"
        "<b>2. Workflow Steps:</b><br/>"
        "&nbsp;&nbsp;• <i>Step 1:</i> Add Webhook node listening on POST <code>/order-status</code>.<br/>"
        "&nbsp;&nbsp;• <i>Step 2:</i> Add AI Agent node. Set prompt to <code>={{ $json.body.message }}</code>.<br/>"
        "&nbsp;&nbsp;• <i>Step 3:</i> Attach Google Gemini Chat Model subnode (<code>gemini-1.5-flash</code>).<br/>"
        "&nbsp;&nbsp;• <i>Step 4:</i> Attach Custom Code Tool subnode named <code>getOrderStatus</code>.<br/>"
        "&nbsp;&nbsp;• <i>Step 5:</i> In tool code, return JSON: <code>{ 'ORD-8842': { status: 'Delivered', eta: 'Oct 20' } }</code>.<br/>"
        "&nbsp;&nbsp;• <i>Step 6:</i> Set System Prompt: 'When user provides an order ID, call getOrderStatus. Be polite and state delivery date.'<br/>"
        "&nbsp;&nbsp;• <i>Step 7:</i> Test with: 'Where is ORD-8842?' -> Verify agent calls tool and replies accurately.",
        body_style
    ))

    story.append(PageBreak())

    # =========================================================================
    # MODULE 6 & 7: VECTOR DATABASES & RAG MASTERY
    # =========================================================================
    story.append(Paragraph("Module 6 & 7: Vector Databases & RAG Mastery", h1_style))
    story.append(Paragraph("6.1 High-Dimensional Vector Embeddings Explained", h2_style))
    story.append(Paragraph(
        "An <b>Embedding Model</b> (such as Google's <code>text-embedding-004</code>) maps text strings to 768-dimensional coordinates in geometric space. Sentences with similar semantic meaning end up in close physical proximity, regardless of the specific vocabulary used.",
        body_style
    ))

    story.append(Paragraph("7.1 The Two Lifecycles of Enterprise RAG", h2_style))
    add_table(
        ["Pipeline", "Trigger Mechanism", "Component Nodes in n8n", "Outcome"],
        [
            ["Pipeline A: Ingestion", "Manual / File Upload / Schedule", "File Read -> Text Splitter -> Gemini Embeddings -> Pinecone Insert", "Knowledge indexed into 768-dim Pinecone vectors."],
            ["Pipeline B: Query / QA", "Chat Received / Webhook", "AI Agent -> Gemini Chat Model -> Pinecone Vector Tool", "Semantic chunks retrieved & synthesized into cited answer."]
        ],
        [100, 100, 180, 124]
    )

    story.append(Paragraph("7.2 Trainer Live Demonstration 2: Company Policy RAG System", h2_style))
    story.append(Paragraph(
        "The trainer demonstrates building both workflows live. Key configuration parameters:",
        body_style
    ))

    add_table(
        ["Component", "Exact Node ID / Setting", "Recommended Value", "Rationale"],
        [
            ["Vector Store", "@n8n/n8n-nodes-langchain.vectorStorePinecone", "Mode: insert (Ingest) / retrieve-as-tool (QA)", "Pinecone serverless manages scaling without infrastructure overhead."],
            ["Embeddings", "@n8n/n8n-nodes-langchain.embeddingsGoogleGemini", "Model: models/text-embedding-004", "Outputs 768 dimensions; highly performant and cost-efficient."],
            ["Chunking", "Recursive Character Text Splitter", "Size: 500 chars, Overlap: 50 chars", "Prevents breaking sentences across boundary lines."],
            ["System Prompt", "Policy Grounding Prompt", "Must include explicit negative fallback", "Forces agent to say 'Not found' rather than hallucinate policies."]
        ],
        [95, 160, 115, 134]
    )

    add_callout(
        "RAG Grounding Guardrail: Always include this exact sentence in your system prompt: 'If the retrieved context does not contain the answer, reply word-for-word: I cannot find this information in the official handbook. Never speculate or extrapolate.'",
        title="ZERO-HALLUCINATION GUARDRAIL"
    )

    story.append(PageBreak())

    # =========================================================================
    # PART II: INDIVIDUAL RAG ASSIGNMENTS (10 USE CASES)
    # =========================================================================
    story.append(Paragraph("Part II: Semantic Retrieval (RAG) Assignments (10 Use Cases)", h1_style))
    story.append(Paragraph(
        "Each participant builds a domain-specific RAG knowledge assistant with dedicated domain documents, metadata schemas, and rigorous factuality testing:",
        body_style
    ))

    rag_summary = [
        ["RAG 01 (Part. 1)", "HR Benefits & Leave Advisor", "HR_Policy_2026.md", "{ section: 'Leave', year: 2026 }", "Must state 16 weeks parental leave; abstain on pet insurance."],
        ["RAG 02 (Part. 2)", "IT Helpdesk Diagnostic Bot", "IT_Runbook.md", "{ category: 'Network|Hardware' }", "Provide exact command to restart print spooler; no guessing on Linux."],
        ["RAG 03 (Part. 3)", "SaaS API Documentation Bot", "API_Docs_v2.md", "{ resource: 'Auth|Webhooks' }", "Return exact HMAC signature header syntax; cite endpoint URLs."],
        ["RAG 04 (Part. 4)", "E-Commerce Return Policy Bot", "Returns_FAQ.md", "{ topic: 'Returns|Shipping' }", "Enforce 30-day return window; explain return shipping cost rules."],
        ["RAG 05 (Part. 5)", "Corporate Travel Policy Advisor", "Travel_Rules.md", "{ region: 'Domestic|Intl' }", "Enforce economy class for flights under 6h; enforce hotel per diem."],
        ["RAG 06 (Part. 6)", "Warehouse Safety SOP Bot", "Warehouse_SOP.md", "{ safetyLevel: 'Mandatory' }", "Provide step-by-step forklift inspection checklist matching ISO."],
        ["RAG 07 (Part. 7)", "B2B Sales Battlecard Assistant", "Battlecards.md", "{ competitor: 'CompX|CompY' }", "Pull exact SOC2 Type II audit date and 99.99% SLA credit terms."],
        ["RAG 08 (Part. 8)", "Microservices Architecture Guide", "Arch_Guide.md", "{ tech: 'Kafka|Redis|Go' }", "Recommend 300ms circuit breaker timeout as written in standard."],
        ["RAG 09 (Part. 9)", "Legal NDA Compliance Assistant", "Standard_NDA.md", "{ clause: 'Liability|Law' }", "Identify 3-year term of confidentiality and Delaware governing law."],
        ["RAG 10 (Part. 10)", "New Hire Onboarding Guide", "Onboarding_Week1.md", "{ phase: 'Day1|Week1' }", "Outline exact sequence of Day 1 IT account and email activations."]
    ]
    add_table(["Project Identifier", "Domain Assistant", "Source Document", "Metadata Schema", "Key Evaluation Criteria"], rag_summary, [80, 110, 85, 105, 124])

    story.append(Spacer(1, 4))
    story.append(Paragraph("Objective RAG Quality & Factuality Checklist", h2_style))
    add_table(
        ["Quality Dimension", "Verification Technique", "Pass Standard", "Fail Condition"],
        [
            ["1. Faithfulness", "Compare claims against retrieved Pinecone chunks", "100% of facts present in context", "Agent states unwritten assumptions"],
            ["2. Citation", "Inspect footer of generated completion", "Valid source document and section name", "Missing citation or fictional filename"],
            ["3. Negative Guardrail", "Ask question deliberately omitted from document", "Replies: 'Information not found in handbook'", "Hallucinates plausible but fake policy"],
            ["4. Chunk Retrieval", "Inspect Pinecone node output in execution log", "Top-1 chunk contains direct answer", "Irrelevant chunks retrieved due to bad query"]
        ],
        [90, 140, 134, 140]
    )

    story.append(PageBreak())

    # =========================================================================
    # MODULE 8, 9 & 10: ADVANCED AGENTS, MCP & A2A
    # =========================================================================
    story.append(Paragraph("Module 8, 9 & 10: Advanced Agent Systems, MCP & A2A", h1_style))
    story.append(Paragraph("8.1 Equipping Agents with Multiple Heterogeneous Tools", h2_style))
    story.append(Paragraph(
        "Real-world enterprise agents rarely rely on a single tool. A production agent orchestrates multiple heterogeneous tools simultaneously:<br/>"
        "• <b>Tool 1: Pinecone Vector Store</b> (Queries static internal knowledge bases and handbooks).<br/>"
        "• <b>Tool 2: HTTP Request Tool</b> (Queries live REST APIs like Stripe, Jira, or Salesforce).<br/>"
        "• <b>Tool 3: Custom Code Tool</b> (Executes deterministic JavaScript for math, date math, and regex parsing).",
        body_style
    ))

    story.append(Paragraph("8.2 Human-in-the-Loop (HITL) Approval Nodes", h2_style))
    story.append(Paragraph(
        "For consequential business actions (e.g. issuing refunds > $100, resetting employee passwords, sending customer emails), agents must not execute unchecked. In n8n, we insert an <b>Approval Node</b> (e.g. Slack interactive message or Email with Webhook callback). The workflow execution pauses until a manager clicks 'Approve'.",
        body_style
    ))

    story.append(Paragraph("9.1 Model Context Protocol (MCP) in n8n", h2_style))
    story.append(Paragraph(
        "The Model Context Protocol (MCP) standardizes how AI applications discover and invoke tools. An n8n workflow can act as an MCP server by exposing tools over Webhooks adhering to the JSON-RPC 2.0 specification:",
        body_style
    ))

    add_code(
"""// Sample MCP JSON-RPC 2.0 Tool Invocation Payload
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "query_order_status",
    "arguments": { "orderId": "ORD-9910" }
  },
  "id": "req-001"
}"""
    )

    story.append(Paragraph("10.1 Agent-to-Agent (A2A) Multi-Agent Collaboration", h2_style))
    story.append(Paragraph(
        "When business problems require multiple specialist personas, we decouple them into a Coordinator Agent with downstream Specialist Sub-Agents:",
        body_style
    ))

    add_table(
        ["Agent Persona", "Responsibility", "Tool Access", "Implementation Node"],
        [
            ["Coordinator Agent", "Deconstructs user request and delegates sub-tasks", "AI Agent Tools representing specialist workflows", "@n8n/n8n-nodes-langchain.agent"],
            ["Research Specialist", "Performs semantic vector searches and extracts facts", "Pinecone Vector Store Tool", "Sub-workflow via Execute Workflow"],
            ["Analytics Specialist", "Executes calculations, SQL queries, and validations", "PostgreSQL / Custom Code Tool", "Sub-workflow via Execute Workflow"],
            ["Executive Reporter", "Compiles final executive briefing with citations", "Structured Output Parser / Markdown Formatter", "@n8n/n8n-nodes-langchain.agent"]
        ],
        [100, 140, 120, 144]
    )

    story.append(PageBreak())

    # =========================================================================
    # MODULE 11 & 12: PRODUCTION READINESS & CAPSTONE RUBRIC
    # =========================================================================
    story.append(Paragraph("Module 11 & 12: Production Readiness & Capstone Evaluation", h1_style))
    story.append(Paragraph("11.1 Enterprise Production Readiness Checklist", h2_style))
    story.append(Paragraph("Before promoting any n8n AI Agent to production, verify each audit criterion:", body_style))

    add_table(
        ["Audit Category", "Production Verification Requirement", "Failure Impact if Ignored"],
        [
            ["Security & Credentials", "Zero API keys in canvas nodes; all secrets stored in n8n Credential Store.", "Severe credential leak risk via canvas exports."],
            ["Rate Limit Protection", "Retry on Fail enabled with exponential backoff; Wait nodes in batch flows.", "HTTP 429 errors crashing production pipelines."],
            ["Prompt Injection Guard", "User input wrapped in triple quotes; delimiters enforced in prompt.", "Malicious users overriding agent instructions."],
            ["Human-in-the-Loop", "Financial transactions > $100 or password resets require approval node.", "Unauthorized automated financial or security actions."],
            ["Observability & Alerting", "Global Error Trigger workflow sending alerts to Slack/Teams with execution ID.", "Silent agent failures unnoticed by operations teams."]
        ],
        [100, 194, 210]
    )

    story.append(Paragraph("12.1 Capstone Project 100-Point Scoring Rubric", h2_style))
    story.append(Paragraph("Participants demonstrate their end-to-end Capstone against this standardized rubric:", body_style))

    add_table(
        ["Evaluation Domain", "Points", "Key Assessment Criteria"],
        [
            ["1. Business Functionality", "15", "Solves a real enterprise problem; runs end-to-end without manual intervention."],
            ["2. n8n Canvas Architecture", "15", "Proper separation of concerns; clean subnode wiring (Model, Memory, Tools)."],
            ["3. Prompt Engineering Quality", "15", "5-pillar prompt structure with strict constraints and output formatting."],
            ["4. Retrieval Accuracy (RAG/Tools)", "15", "768-dim Pinecone indexing, clean source citations, zero hallucination."],
            ["5. Error Handling & Edge Cases", "10", "Handles empty input, API timeouts, and missing records gracefully."],
            ["6. Security & Credential Hygiene", "10", "All keys vaulted; PII sanitized; prompt injection defenses active."],
            ["7. Testing Rigor & Test Suite", "10", "Documented positive, negative, and adversarial test executions in history."],
            ["8. Documentation & Live Demo", "10", "Clear README, structured 10-minute live demo, articulate Q&A responses."]
        ],
        [120, 45, 339]
    )

    story.append(PageBreak())

    # =========================================================================
    # FACILITATOR SATURDAY TIMELINE & MASTER GLOSSARY
    # =========================================================================
    story.append(Paragraph("Master Facilitator Saturday Intensive Timeline", h1_style))
    story.append(Paragraph("Turnkey minute-by-minute facilitator timeline for running Session 1:", body_style))

    timeline_data = [
        ["09:00 - 09:30", "Welcome & Mental Models", "Demystify AI hype; contrast deterministic rules vs probabilistic agents."],
        ["09:30 - 10:15", "n8n Core Mastery", "Live build: Webhook -> Transform -> IF -> Respond. Explain $json vs nodeJson."],
        ["10:15 - 10:30", "Morning Break", "Verify any remaining credentials and environment setups for participants."],
        ["10:30 - 11:30", "Prompt Engineering", "5-pillar prompt structure; structured JSON schemas; hands-on classification lab."],
        ["11:30 - 12:45", "Agent Deep-Dive & Demo 1", "Trainer Live Demo 1: Customer Support Triage Agent with Gemini & Custom Tool."],
        ["12:45 - 01:45", "Lunch Break", "Informal discussion on corporate use cases, governance, and architecture."],
        ["01:45 - 03:00", "Hands-on Lab 1", "Participants build assigned Basic Agent from Part I. Trainer assists & debugs."],
        ["03:00 - 03:15", "Afternoon Break", "Prepare Pinecone vector indexes for RAG module."],
        ["03:15 - 04:30", "Vector DB & RAG Demo 2", "Trainer Live Demo 2: Ingestion & QA RAG with Gemini & Pinecone Serverless."],
        ["04:30 - 05:15", "Hands-on Lab 2", "Participants build assigned RAG Knowledge Assistant from Part II."],
        ["05:15 - 05:30", "Showcase & Capstone Briefing", "2 participant demos; review Capstone project specifications and homework."]
    ]
    add_table(["Time Window", "Training Phase", "Facilitator Action & Deliverable"], timeline_data, [80, 130, 294])

    story.append(Spacer(1, 4))
    story.append(Paragraph("Master Glossary of Key Terminology", h1_style))
    
    glossary_data = [
        ["Agentic AI", "Autonomous systems capable of goal decomposition, tool selection, and multi-step action execution."],
        ["Chunking", "Partitioning documents into smaller, cohesive passages with overlap to optimize semantic vector retrieval."],
        ["Cosine Similarity", "Mathematical metric measuring the directional alignment of two vectors in multi-dimensional space."],
        ["Grounding", "Anchoring LLM completions in verified, external facts (documents or databases) to prevent hallucinations."],
        ["MCP", "Model Context Protocol; open standard for exposing tools and resources to AI clients via JSON-RPC."],
        ["Pinecone", "Managed, cloud-native vector database optimized for low-latency semantic indexing and similarity search."],
        ["RAG", "Retrieval-Augmented Generation; combining vector search retrieval with generative LLMs for fact-based answers."],
        ["ReAct Loop", "Reason + Act prompting paradigm where an LLM alternates between reasoning steps and tool executions."],
        ["Subnodes", "Specialized connection points in n8n cluster nodes providing Models, Memory, Tools, and Parsers."]
    ]
    add_table(["Terminology", "Authoritative Engineering Definition"], glossary_data, [100, 404])

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated comprehensive {filename}")

if __name__ == "__main__":
    build_pdf()
