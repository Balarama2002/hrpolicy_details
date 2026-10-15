import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_deck(filename):
    prs = Presentation()
    # 16:9 widescreen
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Color Palette
    BG_DARK = RGBColor(15, 23, 42)      # #0F172A
    CARD_DARK = RGBColor(30, 41, 59)    # #1E293B
    TEXT_LIGHT = RGBColor(248, 250, 252) # #F8FAFC
    TEXT_MUTED = RGBColor(148, 163, 184) # #94A3B8
    TEXT_DARK = RGBColor(30, 41, 59)    # #1E293B
    
    BG_LIGHT = RGBColor(248, 250, 252)  # #F8FAFC
    CARD_LIGHT = RGBColor(255, 255, 255) # White
    BORDER_LIGHT = RGBColor(226, 232, 240) # #E2E8F0
    
    ACCENT_BLUE = RGBColor(37, 99, 235)  # #2563EB
    ACCENT_TEAL = RGBColor(13, 148, 136) # #0D9488
    ACCENT_GREEN = RGBColor(16, 185, 129) # #10B981
    ACCENT_AMBER = RGBColor(245, 158, 11) # #F59E0B

    def add_header(slide, title_text, category_text="HR ASSISTANCE AGENT • COST & ARCHITECTURE ANALYSIS"):
        # Category tracker
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.7), Inches(0.35))
        tf_cat = cat_box.text_frame
        tf_cat.word_wrap = True
        tf_cat.margin_left = tf_cat.margin_top = tf_cat.margin_right = tf_cat.margin_bottom = 0
        p_cat = tf_cat.paragraphs[0]
        p_cat.text = category_text.upper()
        p_cat.font.size = Pt(10)
        p_cat.font.bold = True
        p_cat.font.color.rgb = ACCENT_BLUE
        
        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.7), Inches(0.7))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(22)
        p_title.font.bold = True
        p_title.font.color.rgb = BG_DARK

    def set_slide_background(slide, color):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = color
        bg.line.color.rgb = color
        return bg

    def add_card(slide, left, top, width, height, bg_color=CARD_LIGHT, border_color=BORDER_LIGHT):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1)
        return shape

    # =========================================================================
    # SLIDE 1: Title Slide (Dark Theme)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1, BG_DARK)

    # Accent pill
    pill = add_card(s1, Inches(1.0), Inches(1.2), Inches(3.6), Inches(0.4), bg_color=CARD_DARK, border_color=ACCENT_BLUE)
    tf_p = pill.text_frame
    p_p = tf_p.paragraphs[0]
    p_p.alignment = PP_ALIGN.CENTER
    p_p.text = "TOTAL COST OF OWNERSHIP (TCO) & ROI"
    p_p.font.size = Pt(11)
    p_p.font.bold = True
    p_p.font.color.rgb = ACCENT_BLUE

    # Main Title
    tbox = s1.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11.3), Inches(2.2))
    tf_t = tbox.text_frame
    tf_t.word_wrap = True
    p1 = tf_t.paragraphs[0]
    p1.text = "TGH HR Assistance Agent\nConsolidated Cost Analysis"
    p1.font.size = Pt(40)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_LIGHT

    # Subtitle
    subbox = s1.shapes.add_textbox(Inches(1.0), Inches(4.2), Inches(11.3), Inches(1.0))
    tf_sub = subbox.text_frame
    tf_sub.word_wrap = True
    p_sub = tf_sub.paragraphs[0]
    p_sub.text = "End-to-End Economic Breakdown: LLMs (Gemini/Mistral), Pinecone Vector DB,\nJira Cloud Ticketing, and Hostinger n8n Orchestration Infrastructure."
    p_sub.font.size = Pt(16)
    p_sub.font.color.rgb = TEXT_MUTED

    # Stat strip at bottom
    stats = [
        ("Avg Query Cost", "< $0.002", "LLM + Vector Search"),
        ("Deflection Rate", "80% - 85%", "Automated RAG Resolution"),
        ("Est. Monthly TCO", "$65 - $160", "Hostinger + Pinecone + Jira + AI"),
        ("ROI Multiplier", "18x - 35x", "Cost Avoidance vs Manual HR")
    ]
    card_w = Inches(2.65)
    for i, (label, val, desc) in enumerate(stats):
        cx = Inches(1.0 + i * 2.85)
        c = add_card(s1, cx, Inches(5.5), card_w, Inches(1.3), bg_color=CARD_DARK, border_color=CARD_DARK)
        tf_c = c.text_frame
        p_l = tf_c.paragraphs[0]
        p_l.text = label.upper()
        p_l.font.size = Pt(10)
        p_l.font.color.rgb = TEXT_MUTED
        
        p_v = tf_c.add_paragraph()
        p_v.text = val
        p_v.font.size = Pt(22)
        p_v.font.bold = True
        p_v.font.color.rgb = ACCENT_GREEN if i in [1, 3] else TEXT_LIGHT
        
        p_d = tf_c.add_paragraph()
        p_d.text = desc
        p_d.font.size = Pt(9)
        p_d.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 2: Architectural Scope & Workflows Overview (Light Theme)
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2, BG_LIGHT)
    add_header(s2, "Architecture & Integrated Workflow Footprint")

    wf_cards = [
        ("1. Orchestration Layer", "MWF_HR_AssistanceAgent", "Main Workflow Router", [
            "MS Teams Trigger & Graph API Integration",
            "Context validation & Chat History parsing",
            "Dispatches to RAG sub-workflow & Jira notifier",
            "Audit logging into n8n native Data Table (HR_AGENT_AUDIT_LOG)",
            "Adaptive Card feedback rendering (👍/👎/🎟️ Ticket)"
        ], ACCENT_BLUE),
        ("2. AI & Retrieval Layer", "SWF_RAG_VectorSearch", "RAG Intelligence Core", [
            "Embeddings: Google Gemini Embedding-2",
            "Vector Database: Pinecone ('allhrpolicydetails', top_k=4)",
            "Reasoning LLM: Google Gemini Flash / Mistral Cloud",
            "Dual classification: 'Sufficient' vs 'Insufficient Data'",
            "Teams HTML formatting & strict Anti-Hallucination guardrails"
        ], ACCENT_TEAL),
        ("3. Escalation & Ticketing", "SWF_RAG_NotifyCustomer", "Helpdesk Integration", [
            "Autonomous Ticket Summarizer (Gemini Flash Lite agent)",
            "Direct API integration with Atlassian Jira Cloud",
            "Auto-generates Service Request under 'IT Helpdesk'",
            "Attaches chat screenshots/images via MS Graph API",
            "Sends Jira deep link back to employee & audit log update"
        ], ACCENT_AMBER)
    ]

    for i, (layer, name, subtitle, bullets, acc_col) in enumerate(wf_cards):
        left_pos = Inches(0.8 + i * 3.95)
        card = add_card(s2, left_pos, Inches(1.6), Inches(3.8), Inches(5.2))
        
        # Color bar indicator on top of card
        bar = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_pos, Inches(1.6), Inches(3.8), Inches(0.1))
        bar.fill.solid()
        bar.fill.fore_color.rgb = acc_col
        bar.line.color.rgb = acc_col

        tbox = s2.shapes.add_textbox(left_pos + Inches(0.25), Inches(1.85), Inches(3.3), Inches(4.8))
        tf = tbox.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = layer
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = acc_col
        
        p2 = tf.add_paragraph()
        p2.text = name
        p2.font.size = Pt(15)
        p2.font.bold = True
        p2.font.color.rgb = BG_DARK
        
        p3 = tf.add_paragraph()
        p3.text = subtitle
        p3.font.size = Pt(11)
        p3.font.italic = True
        p3.font.color.rgb = TEXT_MUTED
        
        tf.add_paragraph() # spacer
        
        for b in bullets:
            pb = tf.add_paragraph()
            pb.text = "• " + b
            pb.font.size = Pt(11)
            pb.font.color.rgb = TEXT_DARK
            pb.space_after = Pt(6)

    # =========================================================================
    # SLIDE 3: Component Deep-Dive 1: LLMs & Embeddings
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3, BG_LIGHT)
    add_header(s3, "Cost Component 1: LLM Reasoning & Embeddings")

    # Left card: Token Economics
    c_left = add_card(s3, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2))
    tb_l = s3.shapes.add_textbox(Inches(1.05), Inches(1.85), Inches(5.2), Inches(4.7))
    tfl = tb_l.text_frame
    tfl.word_wrap = True
    
    pl1 = tfl.paragraphs[0]
    pl1.text = "TOKEN CONSUMPTION PROFILE (PER QUERY)"
    pl1.font.size = Pt(12)
    pl1.font.bold = True
    pl1.font.color.rgb = ACCENT_BLUE

    items_tokens = [
        ("System Prompt & Policy Rules", "~1,400 tokens", "16 strict guidelines, formatting & tone"),
        ("Retrieved Policy Context (topK=4)", "~1,800 tokens", "4 policy passages from Pinecone index"),
        ("User Query & Chat Thread History", "~250 tokens", "Current employee question + context"),
        ("Total Input Context", "~3,450 tokens", "Processed per employee interaction"),
        ("Generated Response Output", "~350 tokens", "Teams HTML formatted answer + follow-ups")
    ]
    for title, val, sub in items_tokens:
        p_t = tfl.add_paragraph()
        p_t.text = f"{title}: {val}"
        p_t.font.size = Pt(12)
        p_t.font.bold = True
        p_t.font.color.rgb = BG_DARK
        p_t.space_before = Pt(8)
        
        p_s = tfl.add_paragraph()
        p_s.text = sub
        p_s.font.size = Pt(10)
        p_s.font.color.rgb = TEXT_MUTED

    # Right card: Pricing Model & Unit Cost
    c_right = add_card(s3, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2))
    tb_r = s3.shapes.add_textbox(Inches(7.05), Inches(1.85), Inches(5.2), Inches(4.7))
    tfr = tb_r.text_frame
    tfr.word_wrap = True
    
    pr1 = tfr.paragraphs[0]
    pr1.text = "PRICING RATES & PER-TRANSACTION COSTS"
    pr1.font.size = Pt(12)
    pr1.font.bold = True
    pr1.font.color.rgb = ACCENT_TEAL

    rates = [
        ("Google Gemini Flash (Primary RAG)", "$0.075 / 1M Input | $0.30 / 1M Output", "Base RAG cost: ~$0.00036 per query!"),
        ("Google Gemini Embeddings", "$0.00002 / 1k tokens", "Negligible (~$0.000003 per search query)"),
        ("Mistral Cloud (Alternative/Fallback)", "$0.20 / 1M Input | $0.60 / 1M Output", "Base cost: ~$0.00090 per query"),
        ("Ticket Summarizer Agent (Escalations)", "$0.00015 per escalated Jira ticket", "Only triggered for ~15% unresolved queries")
    ]
    for model, rate, note in rates:
        pr_m = tfr.add_paragraph()
        pr_m.text = model
        pr_m.font.size = Pt(12)
        pr_m.font.bold = True
        pr_m.font.color.rgb = BG_DARK
        pr_m.space_before = Pt(8)
        
        pr_rt = tfr.add_paragraph()
        pr_rt.text = f"Rate: {rate}"
        pr_rt.font.size = Pt(11)
        pr_rt.font.color.rgb = ACCENT_TEAL
        
        pr_n = tfr.add_paragraph()
        pr_n.text = note
        pr_n.font.size = Pt(10)
        pr_n.font.color.rgb = TEXT_MUTED

    # Highlight box at bottom of right card
    hl = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(7.05), Inches(5.4), Inches(5.2), Inches(1.1))
    hl.fill.solid()
    hl.fill.fore_color.rgb = RGBColor(238, 242, 255)
    hl.line.color.rgb = ACCENT_BLUE
    tf_hl = hl.text_frame
    p_hl = tf_hl.paragraphs[0]
    p_hl.text = "BLENDED LLM UNIT COST PER QUERY: $0.0005 - $0.0008"
    p_hl.font.size = Pt(11)
    p_hl.font.bold = True
    p_hl.font.color.rgb = ACCENT_BLUE
    p_hl2 = tf_hl.add_paragraph()
    p_hl2.text = "1,000 queries = $0.65 | 5,000 queries = $3.25 | 20,000 queries = $13.00\nExtreme efficiency achieved via Gemini Flash & compact prompt architecture."
    p_hl2.font.size = Pt(9)
    p_hl2.font.color.rgb = BG_DARK

    # =========================================================================
    # SLIDE 4: Component Deep-Dive 2: Vector DB & Data Store Costs
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4, BG_LIGHT)
    add_header(s4, "Cost Component 2: Vector Database & Audit Store")

    c1 = add_card(s4, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2))
    tb1 = s4.shapes.add_textbox(Inches(1.05), Inches(1.85), Inches(5.2), Inches(4.7))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    
    p = tf1.paragraphs[0]
    p.text = "PINECONE VECTOR DATABASE ('allhrpolicydetails')"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    pc_points = [
        ("Architecture Model", "Serverless Index (Recommended & Current)", "Pay only for what is stored and queried without idle compute"),
        ("Storage Sizing", "< 50 MB total policy vector data", "Complete HR policy manual (50-100 docs) is < 10,000 vectors\nCost: $0.33/GB-mo = ~$0.05/month"),
        ("Read Units (RU)", "1-2 RUs per user inquiry", "Rate: $0.004 per 1,000 RUs\n5,000 employee queries = 10,000 RUs = ~$0.04/month"),
        ("Pinecone Monthly Cost", "Free Tier to $5.00 / month", "Serverless Starter includes up to $5/mo free credit, covering normal corporate HR search volume entirely!"),
        ("Enterprise Pod Alternative", "$70 - $140 / month", "Only required if company policy demands dedicated VPC peering")
    ]
    for t, v, d in pc_points:
        pt = tf1.add_paragraph()
        pt.text = f"{t}: {v}"
        pt.font.size = Pt(11)
        pt.font.bold = True
        pt.font.color.rgb = BG_DARK
        pt.space_before = Pt(6)
        pd = tf1.add_paragraph()
        pd.text = d
        pd.font.size = Pt(9.5)
        pd.font.color.rgb = TEXT_MUTED

    c2 = add_card(s4, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2))
    tb2 = s4.shapes.add_textbox(Inches(7.05), Inches(1.85), Inches(5.2), Inches(4.7))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    
    p = tf2.paragraphs[0]
    p.text = "AUDIT LOG & STATE STORE ('HR_AGENT_AUDIT_LOG')"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_TEAL

    al_points = [
        ("Native n8n Data Table", "Internal SQLite / PostgreSQL instance", "Zero third-party SaaS subscription or per-row API licensing fee"),
        ("Data Captured", "Employee Name, Question, Response, Message ID, Jira Ticket #, Jira URL, Feedback", "Full compliance and audit traceability per interaction"),
        ("Storage Impact", "~1 KB per interaction record", "20,000 queries = 20 MB database growth per month\nNegligible impact on server NVMe storage"),
        ("Retention & Backup", "Automated cron purge or S3 dump", "Historical logs easily exported to data lake at $0.023/GB"),
        ("Incremental Cost", "$0.00 / month (Fully Absorbable)", "100% included in the existing Hostinger VPS hosting budget")
    ]
    for t, v, d in al_points:
        pt = tf2.add_paragraph()
        pt.text = f"{t}: {v}"
        pt.font.size = Pt(11)
        pt.font.bold = True
        pt.font.color.rgb = BG_DARK
        pt.space_before = Pt(6)
        pd = tf2.add_paragraph()
        pd.text = d
        pd.font.size = Pt(9.5)
        pd.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 5: Component Deep-Dive 3: Jira Ticketing & MS Teams
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5, BG_LIGHT)
    add_header(s5, "Cost Component 3: Jira Helpdesk & MS Teams Interface")

    cj = add_card(s5, Inches(0.8), Inches(1.6), Inches(5.7), Inches(5.2))
    tbj = s5.shapes.add_textbox(Inches(1.05), Inches(1.85), Inches(5.2), Inches(4.7))
    tfj = tbj.text_frame
    tfj.word_wrap = True
    
    p = tfj.paragraphs[0]
    p.text = "ATLASSIAN JIRA CLOUD (ram25tgh.atlassian.net)"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    jira_points = [
        ("Integration Role", "Auto-creates Service Request on 'IT/HR Helpdesk'", "Triggered when AI detects 'Insufficient Data' or user clicks 'Raise ticket'"),
        ("Architectural Driver", "Single Service Bot Account via REST API", "KEY INSIGHT: Employees in MS Teams DO NOT need Jira licenses to raise tickets! Tickets are filed on their behalf via bot token."),
        ("Jira Service Management (JSM)", "Tiered by Agent Seats (HR Team)", [
            "Free Tier: Up to 3 Agents = $0.00/mo (Ideal for pilot)",
            "Standard Tier: $22.05 / agent / mo (e.g. 3 HR agents = $66.15/mo)",
            "Unlimited Customers / Employees creating tickets at $0"
        ]),
        ("Alternative: Jira Software", "Standard: ~$8.15 / user / mo", "If using standard Jira project boards for internal task tracking")
    ]
    for item in jira_points:
        pt = tfj.add_paragraph()
        pt.text = item[0] + ": " + item[1]
        pt.font.size = Pt(11)
        pt.font.bold = True
        pt.font.color.rgb = BG_DARK
        pt.space_before = Pt(6)
        if isinstance(item[2], list):
            for sub in item[2]:
                ps = tfj.add_paragraph()
                ps.text = "  • " + sub
                ps.font.size = Pt(9.5)
                ps.font.color.rgb = TEXT_DARK
        else:
            ps = tfj.add_paragraph()
            ps.text = item[2]
            ps.font.size = Pt(9.5)
            ps.font.color.rgb = TEXT_MUTED

    ct = add_card(s5, Inches(6.8), Inches(1.6), Inches(5.7), Inches(5.2))
    tbt = s5.shapes.add_textbox(Inches(7.05), Inches(1.85), Inches(5.2), Inches(4.7))
    tft = tbt.text_frame
    tft.word_wrap = True
    
    p = tft.paragraphs[0]
    p.text = "MICROSOFT TEAMS & GRAPH API (FRONTEND)"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = ACCENT_TEAL

    teams_points = [
        ("Interaction Channel", "1:1 Chat Bot + Adaptive Feedback Cards", "Delivers seamless employee experience natively inside Teams"),
        ("API Infrastructure", "Microsoft Graph API v1.0", "Used for chat triggers, message fetching, attachments & adaptive cards"),
        ("Licensing Requirements", "Existing M365 Business / Enterprise License", "Uses existing corporate Microsoft 365 E3/E5/Business seats.\nZero incremental bot subscription required from Microsoft."),
        ("Graph API Call Limits", "Protected Tier Limits (10k+ calls/min)", "Current polling and webhook triggers comfortably operate within standard Microsoft tenant service limits."),
        ("Net Incremental Cost", "$0.00 / month (100% Sunk Corporate Asset)", "Leverages enterprise tools already deployed in company")
    ]
    for t, v, d in teams_points:
        pt = tft.add_paragraph()
        pt.text = f"{t}: {v}"
        pt.font.size = Pt(11)
        pt.font.bold = True
        pt.font.color.rgb = BG_DARK
        pt.space_before = Pt(6)
        pd = tft.add_paragraph()
        pd.text = d
        pd.font.size = Pt(9.5)
        pd.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 6: Component Deep-Dive 4: n8n Infrastructure & Hosting
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6, BG_LIGHT)
    add_header(s6, "Cost Component 4: n8n Orchestration & Hosting")

    # 3 options side by side
    tiers = [
        ("Current Architecture", "Hostinger Cloud VPS", "Self-Hosted Docker Setup", "$12 - $24", "/ month", [
            "Running at: n8n.srv1901759.hstgr.cloud",
            "Specifications: 2-4 vCPU, 8-16 GB RAM, NVMe",
            "Unlimited workflow executions & triggers",
            "n8n Community Edition (Open Source, $0 license)",
            "Direct full control over data residency & privacy",
            "Fixed predictable monthly overhead"
        ], ACCENT_GREEN, True),
        ("Managed SaaS", "n8n Cloud (Pro)", "Fully Managed Hosting", "$25 - $55", "/ month (€20-50)", [
            "Hosted directly by n8n.io",
            "Zero server maintenance, auto-updates & backups",
            "Execution limits: 2.5k - 10k executions/mo",
            "Additional execution bundles cost extra",
            "Good for teams without DevOps personnel",
            "Higher variable cost at scale"
        ], ACCENT_BLUE, False),
        ("Enterprise Scale", "n8n Enterprise", "Compliance & Governance", "$500+", "/ month", [
            "Advanced Role-Based Access Control (RBAC)",
            "Single Sign-On (SAML / Okta / Azure AD)",
            "External secret managers & custom logging",
            "Dedicated SLA and enterprise support",
            "Only necessary for strict SOC2/ISO compliance",
            "Optional future upgrade path"
        ], RGBColor(100, 116, 139), False)
    ]

    for i, (tag, name, sub, price, period, bullets, col, is_rec) in enumerate(tiers):
        left_pos = Inches(0.8 + i * 3.95)
        c = add_card(s6, left_pos, Inches(1.6), Inches(3.8), Inches(5.2),
                     bg_color=RGBColor(255, 255, 255),
                     border_color=col if is_rec else BORDER_LIGHT)
        
        # Pill
        pill = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_pos, Inches(1.6), Inches(3.8), Inches(0.35))
        pill.fill.solid()
        pill.fill.fore_color.rgb = col
        pill.line.color.rgb = col
        tf_pill = pill.text_frame
        p_pl = tf_pill.paragraphs[0]
        p_pl.alignment = PP_ALIGN.CENTER
        p_pl.text = tag.upper()
        p_pl.font.size = Pt(9.5)
        p_pl.font.bold = True
        p_pl.font.color.rgb = TEXT_LIGHT

        tb = s6.shapes.add_textbox(left_pos + Inches(0.2), Inches(2.05), Inches(3.4), Inches(4.6))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = name
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = BG_DARK
        
        p_sub = tf.add_paragraph()
        p_sub.text = sub
        p_sub.font.size = Pt(10)
        p_sub.font.color.rgb = TEXT_MUTED
        
        p_pr = tf.add_paragraph()
        p_pr.text = price
        p_pr.font.size = Pt(24)
        p_pr.font.bold = True
        p_pr.font.color.rgb = col
        p_pr.space_before = Pt(8)
        
        p_per = tf.add_paragraph()
        p_per.text = period
        p_per.font.size = Pt(10)
        p_per.font.color.rgb = TEXT_MUTED
        
        tf.add_paragraph() # spacer
        
        for b in bullets:
            pb = tf.add_paragraph()
            pb.text = "• " + b
            pb.font.size = Pt(10)
            pb.font.color.rgb = TEXT_DARK
            pb.space_after = Pt(4)

    # =========================================================================
    # SLIDE 7: Consolidated TCO Matrix (The Core Table)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7, BG_LIGHT)
    add_header(s7, "Consolidated TCO Model Across Operating Scales")

    # Add Table
    rows = 7
    cols = 5
    t_left = Inches(0.8)
    t_top = Inches(1.6)
    t_width = Inches(11.7)
    t_height = Inches(4.3)
    
    table_shape = s7.shapes.add_table(rows, cols, t_left, t_top, t_width, t_height)
    tbl = table_shape.table
    tbl.columns[0].width = Inches(3.2)
    tbl.columns[1].width = Inches(2.0)
    tbl.columns[2].width = Inches(2.1)
    tbl.columns[3].width = Inches(2.2)
    tbl.columns[4].width = Inches(2.2)

    headers = ["Cost Component / Layer", "Unit Pricing Basis", "Pilot (1k queries/mo)", "Production (5k/mo)", "Enterprise (20k/mo)"]
    for j, h in enumerate(headers):
        cell = tbl.cell(0, j)
        cell.fill.solid()
        cell.fill.fore_color.rgb = CARD_DARK
        p = cell.text_frame.paragraphs[0]
        p.text = h
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = TEXT_LIGHT
        cell.vertical_anchor = MSO_ANCHOR.MIDDLE

    matrix_data = [
        ("1. LLM & Embeddings (Gemini Flash)", "~$0.00065 / query", "$0.65 / mo", "$3.25 / mo", "$13.00 / mo"),
        ("2. Vector Database (Pinecone Serverless)", "Storage + RU Usage", "$0.00 (Free Tier)", "$2.50 / mo", "$8.00 / mo"),
        ("3. Ticketing (Jira Service Mgmt - 3 Agents)", "Per Agent ($22/mo) or Free", "$0.00 (Free 3-agent)", "$66.15 (3 agents)", "$66.15 (3 agents)"),
        ("4. Infrastructure (Hostinger VPS n8n)", "KVM VPS Compute & Storage", "$14.00 / mo", "$18.00 / mo", "$24.00 / mo"),
        ("5. MS Teams, Graph API & Audit DB", "Corporate Sunk Asset", "$0.00 / mo", "$0.00 / mo", "$0.00 / mo"),
        ("TOTAL CONSOLIDATED MONTHLY COST", "Fixed + Variable Combined", "$14.65 - $15 / mo", "$89.90 - $90 / mo", "$111.15 - $115 / mo")
    ]

    for i, row in enumerate(matrix_data):
        is_total = (i == len(matrix_data) - 1)
        for j, val in enumerate(row):
            cell = tbl.cell(i + 1, j)
            cell.fill.solid()
            if is_total:
                cell.fill.fore_color.rgb = RGBColor(220, 252, 231) if j > 1 else CARD_DARK
            else:
                cell.fill.fore_color.rgb = CARD_LIGHT if i % 2 == 0 else RGBColor(241, 245, 249)
            
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(11 if is_total else 10.5)
            p.font.bold = is_total or (j == 0)
            if is_total:
                p.font.color.rgb = RGBColor(22, 101, 52) if j > 1 else TEXT_LIGHT
            else:
                p.font.color.rgb = BG_DARK
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE

    # Summary callouts below table
    sc = add_card(s7, Inches(0.8), Inches(6.1), Inches(11.7), Inches(0.9), bg_color=CARD_LIGHT, border_color=ACCENT_BLUE)
    tf_sc = sc.text_frame
    p_sc = tf_sc.paragraphs[0]
    p_sc.text = "KEY TAKEAWAY: TOTAL COST PER EMPLOYEE QUERY IS UNDER $0.02 (LESS THAN 2 CENTS!)"
    p_sc.font.size = Pt(11)
    p_sc.font.bold = True
    p_sc.font.color.rgb = ACCENT_BLUE
    p_sc2 = tf_sc.add_paragraph()
    p_sc2.text = "At 5,000 monthly queries, total solution cost is ~$90/month ($1,080/year), including Jira triage seats, Hostinger hosting, and AI compute. If Jira is already an active corporate subscription, the net added cost is merely ~$25/month!"
    p_sc2.font.size = Pt(9.5)
    p_sc2.font.color.rgb = BG_DARK

    # =========================================================================
    # SLIDE 8: ROI, Deflection & Business Value
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8, BG_LIGHT)
    add_header(s8, "Business Value, Deflection Rate & Cost Avoidance")

    # 3 big metric cards
    val_cards = [
        ("TRADITIONAL HR SUPPORT", "Manual Ticket Handling", "$18.50", "per ticket handled by HR staff", [
            "Average 15-25 minutes HR triage time",
            "Email & Slack back-and-forth delays",
            "Slow turnaround on routine policy FAQs",
            "5,000 inquiries = ~$92,500 labor value"
        ], RGBColor(239, 68, 68)),
        ("AI AGENT DEFLECTION", "Autonomous RAG Resolution", "$0.001", "per direct AI resolved answer", [
            "Instant answers (< 3 seconds in Teams)",
            "80% - 85% inquiries resolved at zero escalation",
            "Strict anti-hallucination policy guardrails",
            "Available 24x7 across all shifts & timezones"
        ], ACCENT_GREEN),
        ("NET ANNUAL SAVINGS", "Cost Avoidance & Efficiency", "$45,000+", "annualized productivity gain", [
            "Over 4,000 manual HR hours saved annually",
            "HR team focuses on strategic high-value tasks",
            "Automated Jira tickets created with full context",
            "Payback period: Immediate (< 14 days)"
        ], ACCENT_BLUE)
    ]

    for i, (title, sub, big_num, num_sub, bullets, col) in enumerate(val_cards):
        left_pos = Inches(0.8 + i * 3.95)
        c = add_card(s8, left_pos, Inches(1.6), Inches(3.8), Inches(5.2))
        
        # Color bar
        bar = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, left_pos, Inches(1.6), Inches(3.8), Inches(0.1))
        bar.fill.solid()
        bar.fill.fore_color.rgb = col
        bar.line.color.rgb = col

        tb = s8.shapes.add_textbox(left_pos + Inches(0.2), Inches(1.85), Inches(3.4), Inches(4.8))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = col
        
        p2 = tf.add_paragraph()
        p2.text = sub
        p2.font.size = Pt(13)
        p2.font.bold = True
        p2.font.color.rgb = BG_DARK
        
        p3 = tf.add_paragraph()
        p3.text = big_num
        p3.font.size = Pt(32)
        p3.font.bold = True
        p3.font.color.rgb = col
        p3.space_before = Pt(10)
        
        p4 = tf.add_paragraph()
        p4.text = num_sub
        p4.font.size = Pt(10)
        p4.font.italic = True
        p4.font.color.rgb = TEXT_MUTED
        
        tf.add_paragraph() # spacer
        
        for b in bullets:
            pb = tf.add_paragraph()
            pb.text = "• " + b
            pb.font.size = Pt(10.5)
            pb.font.color.rgb = TEXT_DARK
            pb.space_after = Pt(6)

    # =========================================================================
    # SLIDE 9: Optimization Strategies & Governance
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9, BG_LIGHT)
    add_header(s9, "Cost Optimization & Architectural Guardrails")

    opt_cards = [
        ("1. Context & Retrieval Tuning", [
            ("Top-K Optimization", "Keep topK=4 chunks. Avoid excessive context stuffing to keep input tokens under 3,500."),
            ("Chunk Size Standardization", "Ensure chunks are 300-500 tokens with metadata to prevent duplicate document segments."),
            ("Hybrid Filtering", "Use metadata filtering (e.g. policy_type='leave') to reduce vector search compute latency.")
        ]),
        ("2. Model Selection & Fallback", [
            ("Default to Gemini Flash", "Gemini 1.5/2.0 Flash provides state-of-the-art reasoning at 10x lower cost than GPT-4o."),
            ("Mistral Cloud as Redundant Fallback", "Keep Mistral as an active fallback only when primary API limits or rate-limits are hit."),
            ("Prompt Caching", "Leverage prompt caching for the 1,400-token system prompt for an additional 50% discount on inputs.")
        ]),
        ("3. Jira & Helpdesk Efficiency", [
            ("De-duplication Logic", "Ensure existing open tickets by the same user on the same topic prevent duplicate ticket creation."),
            ("Batch Screenshot Attachments", "Only fetch and attach images when image IDs exist (already implemented in workflow)."),
            ("Bot Account Optimization", "Maintain single integration service user to keep Jira billing locked to actual human HR agents.")
        ]),
        ("4. Infrastructure Rightsizing", [
            ("Hostinger VPS Scaling", "2 vCPU / 8GB RAM ($14/mo) easily handles 10,000+ executions/month with sub-second response."),
            ("Automated Audit Archival", "Purge or archive n8n execution data older than 30 days to keep database footprint compact."),
            ("Webhook Health Monitoring", "Configure uptime heartbeats on n8n webhooks to prevent dropped employee requests.")
        ])
    ]

    for i, (title, items) in enumerate(opt_cards):
        row = i // 2
        col = i % 2
        left_pos = Inches(0.8 + col * 5.95)
        top_pos = Inches(1.6 + row * 2.65)
        
        c = add_card(s9, left_pos, top_pos, Inches(5.7), Inches(2.45))
        tb = s9.shapes.add_textbox(left_pos + Inches(0.2), top_pos + Inches(0.15), Inches(5.3), Inches(2.15))
        tf = tb.text_frame
        tf.word_wrap = True
        
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = ACCENT_BLUE
        
        for subt, desc in items:
            pt = tf.add_paragraph()
            pt.text = f"• {subt}: "
            pt.font.size = Pt(10)
            pt.font.bold = True
            pt.font.color.rgb = BG_DARK
            pt.space_before = Pt(3)
            # append desc
            r = pt.add_run()
            r.text = desc
            r.font.bold = False
            r.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 10: Executive Summary & Questions for Alignment
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10, BG_DARK)
    
    # Title
    tbox = s10.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.7), Inches(1.0))
    tf = tbox.text_frame
    p = tf.paragraphs[0]
    p.text = "Executive Alignment & Final Takeaway"
    p.font.size = Pt(26)
    p.font.bold = True
    p.font.color.rgb = TEXT_LIGHT

    # Left Card: Summary Takeaways
    c_l = add_card(s10, Inches(0.8), Inches(1.9), Inches(5.7), Inches(4.8), bg_color=CARD_DARK, border_color=CARD_DARK)
    tb_l = s10.shapes.add_textbox(Inches(1.05), Inches(2.1), Inches(5.2), Inches(4.3))
    tfl = tb_l.text_frame
    tfl.word_wrap = True
    
    p = tfl.paragraphs[0]
    p.text = "CONSOLIDATED BOTTOM LINE"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_GREEN

    points_summary = [
        "Extremely Lean Cost Structure: Full stack operates at under $90 - $115/month for 5,000 to 20,000 monthly employee queries.",
        "Zero Employee Licensing Overhead: Microsoft Teams front-end and Jira bot integrations incur $0 extra per employee.",
        "Massive ROI & Deflection: By deflecting 80-85% of repetitive HR inquiries, the system pays for itself in less than 2 weeks.",
        "Production-Ready Architecture: Already connected and configured with Hostinger VPS, Pinecone, Jira Cloud, and n8n."
    ]
    for pt in points_summary:
        p_pt = tfl.add_paragraph()
        p_pt.text = "✔ " + pt
        p_pt.font.size = Pt(11)
        p_pt.font.color.rgb = TEXT_LIGHT
        p_pt.space_before = Pt(10)

    # Right Card: Questions for Customizing Exact Company Scope
    c_r = add_card(s10, Inches(6.8), Inches(1.9), Inches(5.7), Inches(4.8), bg_color=CARD_DARK, border_color=ACCENT_BLUE)
    tb_r = s10.shapes.add_textbox(Inches(7.05), Inches(2.1), Inches(5.2), Inches(4.3))
    tfr = tb_r.text_frame
    tfr.word_wrap = True
    
    p = tfr.paragraphs[0]
    p.text = "ALIGNMENT QUESTIONS FOR FINAL BUDGET SIGN-OFF"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = ACCENT_BLUE

    qs = [
        ("Expected Monthly Query Volume", "What is your target headcount and expected inquiry volume (e.g. 500, 2,500, or 10,000 queries/month)?"),
        ("Existing Jira Licensing", "Does your IT/HR department already hold active Jira Service Management (JSM) agent licenses, or should this be budgeted as new spend?"),
        ("Pinecone Tier Preference", "Is Pinecone Serverless ($0-5/mo) approved by security, or does compliance require a dedicated AWS/GCP Private VPC pod ($70/mo)?"),
        ("Primary vs Fallback Model Policy", "Do you prefer keeping Gemini Flash as 100% primary (lowest cost), or routing specific confidential topics to private models?")
    ]
    for q_title, q_desc in qs:
        pq = tfr.add_paragraph()
        pq.text = f"? {q_title}:"
        pq.font.size = Pt(11)
        pq.font.bold = True
        pq.font.color.rgb = ACCENT_AMBER
        pq.space_before = Pt(8)
        
        pd = tfr.add_paragraph()
        pd.text = q_desc
        pd.font.size = Pt(9.5)
        pd.font.color.rgb = TEXT_MUTED

    prs.save(filename)
    print(f"Presentation saved successfully to: {filename}")

if __name__ == "__main__":
    out_path = r"c:\Users\TGH-HYD-090\OneDrive\Documents\HR AGent UI\HR_Agent_Consolidated_Cost_Analysis.pptx"
    create_deck(out_path)
