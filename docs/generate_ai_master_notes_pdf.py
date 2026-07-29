from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
)


OUTPUT_PATH = Path(r"C:\Users\asus\Desktop\Bot\frontend\public\downloads\ai-master-notes-v1.pdf")


CHAPTERS = [
    {
        "title": "Introduction to AI and Modern AI Systems",
        "overview": "This chapter builds the foundation for understanding artificial intelligence as a field, as a practical engineering discipline, and as a force shaping modern learning, work, and software.",
        "subtopics": [
            ("What AI means in simple terms", "Artificial intelligence refers to computer systems that perform tasks that normally require human reasoning, pattern recognition, language understanding, or decision support."),
            ("The difference between narrow AI and general AI", "Narrow AI solves specific tasks such as translation, ranking, prediction, and image classification, while general AI remains a research aspiration rather than a shipping product."),
            ("Why data is central to AI", "AI systems improve when they are trained on useful, relevant, and well-labeled data because patterns are learned from examples rather than hand-written rules alone."),
            ("How AI appears in daily life", "Recommendation systems, spam filtering, maps, fraud scoring, voice assistants, and smart search are common examples of AI already embedded in daily products."),
            ("The AI pipeline", "A typical AI pipeline includes problem definition, data collection, preprocessing, model selection, training, evaluation, deployment, and monitoring."),
            ("Why AI matters for students", "Students who understand AI can use it more responsibly, evaluate outputs better, and connect theory with practical tools used in academics and industry."),
        ],
        "examples": [
            "A translation app converts one language into another using statistical and neural language patterns.",
            "A shopping platform recommends products by modeling user behavior and product similarity.",
            "A spam filter classifies incoming emails based on features learned from previous examples.",
        ],
    },
    {
        "title": "Machine Learning Basics",
        "overview": "Machine learning is the branch of AI that enables systems to learn from data. This chapter explains the core learning styles, model behavior, and evaluation ideas that every beginner should know.",
        "subtopics": [
            ("What machine learning is", "Machine learning teaches systems to identify patterns from data and then use those patterns to make predictions or decisions on new inputs."),
            ("Supervised learning", "In supervised learning, the model learns from labeled examples where the correct output is already known."),
            ("Unsupervised learning", "In unsupervised learning, the model looks for patterns, clusters, or structure in data without explicit labels."),
            ("Reinforcement learning", "In reinforcement learning, an agent learns by taking actions, observing rewards, and gradually improving its strategy."),
            ("Features and labels", "Features are the measurable input characteristics, while labels are the target outputs used for learning in supervised problems."),
            ("Training, validation, and test split", "Reliable ML depends on evaluating models on unseen data to avoid fooling ourselves with overly optimistic results."),
            ("Overfitting and underfitting", "Overfitting happens when a model memorizes noise, while underfitting happens when the model is too simple to learn the underlying pattern."),
        ],
        "examples": [
            "Predicting whether a student will pass based on attendance and practice score is a supervised problem.",
            "Grouping customers into behavior segments without labels is an unsupervised learning problem.",
            "A game-playing agent improving after repeated attempts illustrates reinforcement learning.",
        ],
    },
    {
        "title": "Deep Learning Foundations",
        "overview": "Deep learning extends machine learning through layered neural networks. It powers image analysis, speech recognition, and large-scale language systems.",
        "subtopics": [
            ("Why neural networks matter", "Neural networks can model highly complex patterns and relationships in data, especially when simpler linear methods are not enough."),
            ("Artificial neurons and layers", "Each artificial neuron takes inputs, applies weights and an activation function, and passes its output to the next layer."),
            ("Forward pass and backpropagation", "The model makes a prediction through a forward pass, computes error, and then updates weights through backpropagation."),
            ("Activation functions", "ReLU, sigmoid, and tanh help neural networks learn non-linear relationships rather than simple straight-line mappings."),
            ("Epochs, batches, and learning rate", "These training settings control how the model sees data, how often it updates, and how quickly it learns."),
            ("CNNs and computer vision", "Convolutional neural networks are specialized for grid-like data such as images, where local visual patterns matter."),
            ("RNNs, sequence models, and limitations", "Older sequence models helped process text and time-series data before transformers became dominant."),
        ],
        "examples": [
            "Image classification systems rely on deep learning to distinguish between objects, scenes, and handwritten text.",
            "Speech-to-text engines convert spoken words to text using deep learning sequence modeling.",
            "Medical scan analysis uses neural models to support pattern detection, though human review still matters.",
        ],
    },
    {
        "title": "Natural Language Processing and Large Language Models",
        "overview": "Modern AI products often feel intelligent because they work with language. This chapter explains NLP fundamentals and how large language models operate.",
        "subtopics": [
            ("What NLP is", "Natural Language Processing focuses on how machines read, classify, summarize, generate, and reason over human language."),
            ("Tokenization", "Language models break text into tokens, which are smaller pieces such as words, subwords, or punctuation units."),
            ("Embeddings", "Embeddings convert words or phrases into numerical vectors so semantic similarity can be measured mathematically."),
            ("Transformers", "Transformer architecture uses attention to capture relationships across long sequences more effectively than older models."),
            ("What LLMs actually predict", "Large language models predict the next token based on context, and their apparent reasoning emerges from scale and training patterns."),
            ("Context windows", "The context window defines how much text a model can consider at one time while generating or analyzing output."),
            ("Hallucinations and reliability", "LLMs can sound confident while being wrong, so validation, prompting discipline, and human review are essential."),
        ],
        "examples": [
            "A chatbot answering study questions is powered by NLP and an LLM rather than human-written responses for every case.",
            "Semantic search uses embeddings to find meaning-based matches instead of only exact keywords.",
            "Automatic summarization tools compress long content into smaller explanations using sequence modeling.",
        ],
    },
    {
        "title": "Prompt Engineering and Prompting Patterns",
        "overview": "Prompting is the practical skill of guiding an AI model toward better output. Good prompts improve clarity, reliability, and usefulness.",
        "subtopics": [
            ("Why prompts matter", "The quality of instructions strongly affects the structure, tone, depth, and correctness of the output."),
            ("Prompt anatomy", "Strong prompts specify role, task, constraints, audience, format, and sometimes examples."),
            ("Few-shot prompting", "Providing examples in the prompt helps the model understand the target pattern more precisely."),
            ("Chain-of-thought sensitivity", "Some tasks benefit from stepwise reasoning, but exposing or over-requesting long reasoning can also add noise."),
            ("Structured output prompting", "Requesting tables, bullet lists, JSON, or labeled sections can make output easier to reuse and validate."),
            ("Prompt iteration", "Prompt engineering is rarely one-shot; good practitioners refine prompts after checking output quality and edge cases."),
            ("Safety-minded prompting", "Prompts should respect privacy, avoid abusive or misleading output, and reduce overconfident unsupported claims."),
        ],
        "examples": [
            "A prompt for exam revision can ask for definitions, examples, and five MCQs for a topic in one format.",
            "A developer prompt can require bullet-point output, code fences, and a list of assumptions.",
            "A study assistant prompt can request explanation at beginner level with one real-world analogy and one short test question.",
        ],
    },
    {
        "title": "AI Tools and Practical Workflows",
        "overview": "This chapter focuses on how AI is actually used in work and study systems, from content drafting to research, coding, summarization, and review.",
        "subtopics": [
            ("AI as an assistant, not an autopilot", "Practical workflows succeed when AI accelerates drafting and discovery while humans remain responsible for correctness."),
            ("Research workflow with AI", "A good workflow moves from question framing, to source gathering, to synthesis, to manual verification."),
            ("Writing workflow with AI", "AI can outline, rewrite, summarize, or simplify, but final voice, evidence quality, and structure should be human reviewed."),
            ("Coding workflow with AI", "AI helps with debugging, scaffolding, refactoring ideas, and test suggestions, but code still needs verification and context awareness."),
            ("Revision workflow for students", "Students can use AI for chapter summaries, MCQ creation, practice questions, and explanation of weak areas."),
            ("AI plus productivity tools", "Workflows often combine chat models, spreadsheets, note apps, design tools, and automation systems."),
            ("Human-in-the-loop review", "The strongest AI workflow always includes a review checkpoint before public submission or high-stakes use."),
        ],
        "examples": [
            "A student asks AI to turn a chapter into revision bullets, then manually checks facts against class material.",
            "A founder drafts product copy with AI, but edits tone, pricing, and compliance details manually.",
            "A developer asks AI to explain a bug, then confirms the root cause with logs and tests.",
        ],
    },
    {
        "title": "AI for Students, Creators, Business, and Coding",
        "overview": "AI creates different kinds of value depending on the user. This chapter shows how AI can help different groups in practical and responsible ways.",
        "subtopics": [
            ("AI for students", "Students use AI for revision, explanation, time planning, question generation, and concept simplification."),
            ("AI for creators", "Creators use AI for ideation, script drafting, thumbnail concepts, editing support, and content repurposing."),
            ("AI for small business", "Businesses use AI for customer support drafts, product descriptions, reporting, and productivity workflows."),
            ("AI for coding", "AI coding systems assist with boilerplate, debugging hypotheses, documentation, and test generation."),
            ("Where human judgment still wins", "Strategy, empathy, accountability, and domain-specific decisions still require human oversight."),
            ("Risks of overdependence", "Using AI without checking can cause plagiarism, weak learning, low originality, and confident errors."),
            ("Choosing the right tool", "Different tools are optimized for chat, search, documents, design, automation, code, or analytics."),
        ],
        "examples": [
            "A student turns class topics into MCQ drills and short-answer prompts.",
            "A creator turns one long script into a caption, short reel outline, and thumbnail concept.",
            "A business owner drafts FAQs and customer replies faster while still reviewing tone and accuracy.",
        ],
    },
    {
        "title": "AI Ethics, Safety, Bias, and Limitations",
        "overview": "Understanding AI without ethics is incomplete. This chapter explains how bias, privacy, misuse, and reliability issues affect the responsible use of AI.",
        "subtopics": [
            ("Bias in data and models", "AI can inherit historical bias from training data and amplify unfair patterns unless systems are designed carefully."),
            ("Privacy and data handling", "Sensitive data should not be casually pasted into public or unknown AI systems without understanding retention and policy."),
            ("Misinformation and hallucination", "AI can generate false claims that sound polished, which makes verification essential."),
            ("Copyright and originality", "Generated content raises questions about ownership, attribution, originality, and ethical reuse."),
            ("Safety guardrails", "Responsible products use policy constraints, moderation layers, auditing, and human checks to reduce harmful outputs."),
            ("Explainability and trust", "In many real systems, organizations must explain why an automated recommendation or score was produced."),
            ("Human accountability", "Even if AI helped draft the output, people remain accountable for high-stakes decisions and published work."),
        ],
        "examples": [
            "A hiring tool trained on biased historical data can unfairly disadvantage certain groups.",
            "A student using AI-generated facts without checking can submit incorrect work confidently.",
            "A business handling customer data through AI should understand privacy policy and storage implications first.",
        ],
    },
    {
        "title": "AI Careers and Future Trends",
        "overview": "AI is creating new roles and transforming older ones. This chapter explains the skill paths, opportunities, and future direction of the field.",
        "subtopics": [
            ("Career paths in AI", "Common paths include data analyst, ML engineer, data scientist, AI product manager, prompt designer, AI researcher, and automation specialist."),
            ("Skills that matter", "Statistics, programming, problem framing, data handling, evaluation, communication, and domain knowledge all matter."),
            ("Why fundamentals still win", "Trendy tools change quickly, but strong fundamentals in data, logic, and communication remain durable."),
            ("The role of no-code and low-code AI", "Automation and no-code tools let non-programmers use AI workflows, expanding access to productivity gains."),
            ("AI in education and workplaces", "Future workplaces will value people who know how to guide, evaluate, and improve AI-assisted workflows."),
            ("Limitations of hype", "Not every task needs AI, and not every AI claim translates into sustainable product value."),
            ("How to prepare for the future", "The best preparation combines fundamentals, tool familiarity, portfolio projects, and critical thinking."),
        ],
        "examples": [
            "A student can build a portfolio by creating a simple AI study assistant or analytics dashboard.",
            "A non-technical founder can use AI automation tools to improve workflows without becoming a full-time engineer.",
            "A software engineer can grow into AI systems work by adding data and model-evaluation skills over time.",
        ],
    },
    {
        "title": "Revision Zone: Key Terms, Probable Questions, MCQs, and Short Answers",
        "overview": "This final chapter is designed as a revision engine. It condenses the full notes into quick-recall material for exams, viva rounds, interviews, and self-testing.",
        "subtopics": [
            ("How to revise effectively with AI notes", "Good revision cycles move from concept recall to practice questions to mistake review and memory reinforcement."),
            ("Key AI terms every beginner should know", "Students should be able to explain model, data, training, inference, accuracy, prompt, token, embedding, and bias."),
            ("Short-answer method", "A strong short answer defines the term, explains its role, and gives one example in compact form."),
            ("Viva preparation", "Viva-style answers should be brief, clear, and example-driven rather than overly technical."),
            ("MCQ strategy", "Read all options carefully, eliminate weak distractors, and connect the question to core concepts instead of memorized phrases."),
            ("Common mistakes to avoid", "Do not confuse AI with all software, do not treat hallucinated output as verified fact, and do not skip data quality concerns."),
        ],
        "examples": [
            "If asked to define machine learning, start with learning from data, mention patterns, and add a prediction example.",
            "If asked about prompt engineering, explain that the prompt shapes the model output and helps improve quality and structure.",
            "If asked about AI ethics, connect bias, privacy, and accountability in one compact answer.",
        ],
    },
]


MCQS = [
    ("Which option best describes artificial intelligence?", ["A spreadsheet formula", "A system that performs tasks requiring patterns or reasoning", "A hardware cable", "A web browser"], "B"),
    ("In supervised learning, the training data usually contains:", ["Only unlabeled examples", "Labeled inputs and outputs", "No examples at all", "Only images"], "B"),
    ("What is overfitting?", ["A model that performs well on training data but poorly on new data", "A model that uses too little data", "A model that only uses numbers", "A model that is always accurate"], "A"),
    ("Which architecture became central to modern large language models?", ["Bubble sort", "Transformer", "Linear search", "Binary tree traversal"], "B"),
    ("What does a prompt do?", ["Deletes model weights", "Guides the model toward a useful output pattern", "Increases screen brightness", "Formats a hard drive"], "B"),
    ("Why should AI output be verified?", ["Because models can hallucinate or misstate facts", "Because AI never produces text", "Because the internet is offline", "Because prompts are illegal"], "A"),
    ("Which is a common real-world AI application?", ["Recommendation systems", "Paper staplers", "Ink refills", "USB cable colors"], "A"),
    ("What does an embedding help represent?", ["Battery life", "Semantic meaning in numeric form", "Screen resolution", "Keyboard size"], "B"),
    ("Which statement is most responsible?", ["Paste private data anywhere into AI tools", "Never review AI output", "Use AI with human oversight and privacy awareness", "Treat every generated answer as final truth"], "C"),
    ("What is one strong use of AI for students?", ["Generating revision questions and summaries", "Replacing all studying", "Ignoring class notes", "Skipping fact checking"], "A"),
]


SHORT_QUESTIONS = [
    "Define artificial intelligence in simple words.",
    "Differentiate between AI, machine learning, and deep learning.",
    "What is supervised learning? Give one example.",
    "Why are data quality and preprocessing important?",
    "What are transformers and why are they important in language AI?",
    "What is prompt engineering?",
    "Explain one benefit and one risk of AI in education.",
    "What is hallucination in large language models?",
    "Why is human review still important in AI workflows?",
    "List three career paths related to AI.",
]


KEY_TERMS = [
    "Artificial Intelligence", "Machine Learning", "Deep Learning", "Training Data", "Inference", "Feature", "Label",
    "Transformer", "Token", "Embedding", "Prompt", "Bias", "Hallucination", "Overfitting", "Evaluation",
    "Accuracy", "Recall", "Precision", "Automation", "Human-in-the-loop",
]


WORKBOOK_SETS = [
    "Foundation Drill",
    "Concept Builder",
    "Application Practice",
    "Exam Booster",
    "Viva Recall Set",
    "MCQ Master Set",
    "Mistake Review Set",
    "Rapid Revision Set",
]


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#0F172A"),
            spaceAfter=16,
        )
    )
    styles.add(
        ParagraphStyle(
            name="CoverSub",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#334155"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="ChapterTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=24,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=12,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=10,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="NotesBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#1E293B"),
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TinyLabel",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#0891B2"),
            spaceBefore=6,
            spaceAfter=4,
        )
    )
    return styles


def add_cover(story, styles):
    story.extend(
        [
            Spacer(1, 1.0 * inch),
            Paragraph("AI Master Notes", styles["CoverTitle"]),
            Paragraph("EduStack Premium PDF", styles["CoverSub"]),
            Spacer(1, 0.22 * inch),
            Paragraph(
                "A clean, exam-style AI notes handbook built for students, self-learners, revision practice, and practical concept clarity.",
                styles["CoverSub"],
            ),
            Spacer(1, 0.35 * inch),
            Paragraph(
                "Inside this PDF:", styles["SectionTitle"]
            ),
            ListFlowable(
                [
                    ListItem(Paragraph("10 structured chapters from AI basics to careers and ethics", styles["NotesBody"])),
                    ListItem(Paragraph("Concept summaries, bullet revision notes, and real examples", styles["NotesBody"])),
                    ListItem(Paragraph("Probable viva questions, MCQs, and short-answer practice", styles["NotesBody"])),
                    ListItem(Paragraph("Designed for fast revision and clear understanding", styles["NotesBody"])),
                ],
                bulletType="bullet",
                leftIndent=18,
            ),
            Spacer(1, 0.4 * inch),
            Paragraph("Prepared for EduStack learners", styles["CoverSub"]),
            Spacer(1, 0.1 * inch),
            Paragraph("Version 1.0", styles["CoverSub"]),
            PageBreak(),
        ]
    )


def add_table_of_contents(story, styles):
    story.append(Paragraph("Table of Contents", styles["ChapterTitle"]))
    for index, chapter in enumerate(CHAPTERS, start=1):
        story.append(Paragraph(f"{index}. {chapter['title']}", styles["NotesBody"]))
    story.append(PageBreak())


def bullet_list(items, styles):
    return ListFlowable(
        [ListItem(Paragraph(item, styles["NotesBody"])) for item in items],
        bulletType="bullet",
        leftIndent=18,
        spaceBefore=4,
        spaceAfter=8,
    )


def detailed_note_paragraphs(chapter_title, subtopic, detail):
    return [
        f"{subtopic} sits at the heart of {chapter_title.lower()} because it explains how theory becomes usable in a real system. {detail} In exam language, this means you should be able to define the term, connect it to one workflow, and state why it matters for output quality or system performance.",
        f"When revising {subtopic.lower()}, focus on the relationship between input, processing, and outcome. Students often remember surface-level definitions but forget the operational meaning. A stronger answer explains what changes when this concept is applied correctly, what breaks when it is ignored, and which kinds of products rely on it most heavily.",
        f"In practice, {subtopic.lower()} should be discussed with one concrete scenario. This may be a chatbot, recommendation engine, analytics dashboard, coding assistant, or revision tool. The purpose of the example is not decoration; it proves that you understand how the concept behaves beyond textbook phrasing.",
        f"Another strong revision method is to compare {subtopic.lower()} with a neighboring concept from the same chapter. Comparison sharpens understanding because it forces you to state boundaries: what this concept covers, what it does not cover, and what would happen if a team selected the wrong approach in a real product or exam case study.",
    ]


def step_framework(subtopic):
    return [
        f"Start by writing a one-line definition of {subtopic.lower()} in simple language.",
        f"Then explain the input, output, or workflow role that {subtopic.lower()} plays.",
        f"Add one real-world use case where {subtopic.lower()} improves quality, speed, or decision making.",
        f"Close with one limitation, risk, or condition that must be checked before relying on it.",
    ]


def memory_anchors(chapter_title, subtopic):
    return [
        f"Anchor 1: connect {subtopic.lower()} to the main purpose of {chapter_title.lower()}.",
        f"Anchor 2: remember one product or tool where {subtopic.lower()} is clearly visible.",
        f"Anchor 3: pair {subtopic.lower()} with one common mistake students make while explaining it.",
        f"Anchor 4: summarise {subtopic.lower()} in three words before expanding the full answer.",
    ]


def case_study_lines(chapter_title, subtopic):
    return [
        f"Case study: imagine a study app team building a feature around {subtopic.lower()}. Their goal is to improve clarity, personalization, and revision speed for learners using {chapter_title.lower()}.",
        f"The team first defines what success looks like, then checks whether {subtopic.lower()} is the right tool for the job. They compare reliability, cost, quality, and risk before moving forward.",
        f"Once the feature is drafted, the team tests outputs with real users and records where {subtopic.lower()} helps, where it confuses users, and where human review is still required.",
        f"The lesson from this case study is simple: the concept becomes valuable only when it is tied to a clear objective, measurable quality, and responsible review.",
    ]


def exam_builder_lines(chapter_title, subtopic):
    return [
        f"Long-answer approach: begin with a compact definition of {subtopic.lower()}, then explain its mechanism in the context of {chapter_title.lower()}, followed by one real example and one limitation.",
        f"Short-answer approach: define {subtopic.lower()} in one line, mention its role, and finish with one direct use case.",
        f"Viva approach: speak clearly, avoid jargon overload, and explain {subtopic.lower()} as if the listener is smart but hearing the concept for the first time.",
    ]


def model_answer_lines(subtopic):
    return [
        f"Model answer 1: {subtopic} is important because it gives structure to how an AI system receives input, processes information, and produces an output that can be evaluated.",
        f"Model answer 2: In practical terms, {subtopic.lower()} becomes useful only when it improves understanding, efficiency, or prediction quality in a real workflow.",
        f"Model answer 3: The best revision sentence for {subtopic.lower()} should include meaning, one use case, and one caution point.",
    ]


def workbook_questions(chapter_title, subtopic, label):
    return [
        f"{label} Q1: Define {subtopic.lower()} and explain why it matters inside {chapter_title.lower()}.",
        f"{label} Q2: Give one real-world example where {subtopic.lower()} improves output quality.",
        f"{label} Q3: Compare {subtopic.lower()} with another concept from the same chapter.",
        f"{label} Q4: State one risk, limit, or misunderstanding related to {subtopic.lower()}.",
        f"{label} Q5: Write a 5-line exam answer for {subtopic.lower()} using definition, example, and limitation.",
    ]


def workbook_answers(subtopic, label):
    return [
        f"{label} A1: A complete answer should define {subtopic.lower()} first, then link it to one workflow instead of staying abstract.",
        f"{label} A2: A good example should be specific enough to show how {subtopic.lower()} behaves in a product or study setting.",
        f"{label} A3: The comparison answer should state one similarity and one difference clearly.",
        f"{label} A4: The limitation answer should show awareness of where human review or better data is still needed.",
        f"{label} A5: The best short model answer is concise, structured, and avoids unnecessary technical padding.",
    ]


def add_chapter(story, styles, index, chapter):
    story.append(Paragraph(f"Chapter {index}: {chapter['title']}", styles["ChapterTitle"]))
    story.append(Paragraph(chapter["overview"], styles["NotesBody"]))

    story.append(Paragraph("Concept Summary", styles["SectionTitle"]))
    story.append(
        Paragraph(
            f"{chapter['title']} should be understood as both a theory topic and a practical systems topic. "
            "The strongest exam answers define the idea clearly, mention why it matters, and give one realistic example. "
            "For revision, connect each topic to a workflow, a real-world use, and one limitation or caution point.",
            styles["NotesBody"],
        )
    )

    story.append(Paragraph("Core Learning Points", styles["SectionTitle"]))
    for sub_index, (subtopic, detail) in enumerate(chapter["subtopics"], start=1):
        story.append(Paragraph(f"{index}.{sub_index} {subtopic}", styles["TinyLabel"]))
        story.append(Paragraph(detail, styles["NotesBody"]))
        story.append(
            Paragraph(
                "Exam note: explain this point in simple language first, then add one sentence describing where it appears in real tools, products, or study workflows.",
                styles["NotesBody"],
            )
        )
        for paragraph in detailed_note_paragraphs(chapter["title"], subtopic, detail):
            story.append(Paragraph(paragraph, styles["NotesBody"]))

        story.append(Paragraph("Step-by-Step Understanding", styles["SectionTitle"]))
        story.append(bullet_list(step_framework(subtopic), styles))

        story.append(Paragraph("Mini Case Study", styles["SectionTitle"]))
        for line in case_study_lines(chapter["title"], subtopic):
            story.append(Paragraph(line, styles["NotesBody"]))

        story.append(Paragraph("Memory Anchors", styles["SectionTitle"]))
        story.append(bullet_list(memory_anchors(chapter["title"], subtopic), styles))

        story.append(Paragraph("Answer Writing Pattern", styles["SectionTitle"]))
        for line in exam_builder_lines(chapter["title"], subtopic):
            story.append(Paragraph(line, styles["NotesBody"]))

        story.append(Paragraph("Model Answers", styles["SectionTitle"]))
        for line in model_answer_lines(subtopic):
            story.append(Paragraph(line, styles["NotesBody"]))

    story.append(Paragraph("Quick Revision Notes", styles["SectionTitle"]))
    story.append(
        bullet_list(
            [
                f"{chapter['title']} is easiest to remember when linked to a use case, not only a definition.",
                "Use keywords carefully: define the term, explain its role, and add one example.",
                "Always separate what AI can automate from what still needs human judgment.",
                "In exams, compact clarity usually scores better than vague, overcomplicated language.",
                "Good revision combines concept recall, examples, and one limitation or caution.",
            ],
            styles,
        )
    )

    story.append(Paragraph("Examples and Use Cases", styles["SectionTitle"]))
    story.append(bullet_list(chapter["examples"], styles))

    story.append(Paragraph("Probable Viva and Exam Questions", styles["SectionTitle"]))
    story.append(
        bullet_list(
            [
                f"Define {chapter['title'].lower()} in simple words.",
                f"Explain the practical importance of {chapter['title'].lower()}.",
                "Give one real-world example and one limitation.",
                "Differentiate this topic from a closely related topic from another chapter.",
                "How can a student apply this concept during study or revision?",
            ],
            styles,
        )
    )

    story.append(Paragraph("MCQ Practice", styles["SectionTitle"]))
    for mcq_index, (question, options, answer) in enumerate(MCQS, start=1):
        story.append(Paragraph(f"Q{index}.{mcq_index} {question}", styles["NotesBody"]))
        story.append(
            bullet_list(
                [f"{label}. {option}" for label, option in zip(["A", "B", "C", "D"], options)],
                styles,
            )
        )
        story.append(Paragraph(f"Answer: {answer}", styles["NotesBody"]))

    story.append(Paragraph("Short-Answer Practice", styles["SectionTitle"]))
    story.append(
        bullet_list(
            [
                "Write a 3-line answer for the main concept of this chapter.",
                "Describe one benefit of applying this concept in a real workflow.",
                "Mention one limitation, risk, or common misunderstanding.",
                "Create one comparison with another AI topic you have studied.",
            ],
            styles,
        )
    )

    story.append(Paragraph("Workbook Practice Sets", styles["SectionTitle"]))
    for workbook in WORKBOOK_SETS:
        story.append(Paragraph(workbook, styles["TinyLabel"]))
        for subtopic, _detail in chapter["subtopics"]:
            story.append(bullet_list(workbook_questions(chapter["title"], subtopic, workbook), styles))
            story.append(bullet_list(workbook_answers(subtopic, workbook), styles))
    story.append(PageBreak())


def add_revision_zone(story, styles):
    story.append(Paragraph("Final Revision Toolkit", styles["ChapterTitle"]))
    story.append(
        Paragraph(
            "Use this section during final revision. Read the key terms first, then answer short questions without looking back, and finally solve MCQs under a time limit.",
            styles["NotesBody"],
        )
    )

    story.append(Paragraph("Key Terms", styles["SectionTitle"]))
    story.append(bullet_list([f"{term}: know its simple definition, one example, and one practical use." for term in KEY_TERMS], styles))

    story.append(Paragraph("Short Questions", styles["SectionTitle"]))
    story.append(bullet_list(SHORT_QUESTIONS, styles))

    story.append(Paragraph("Revision Strategy", styles["SectionTitle"]))
    story.append(
        bullet_list(
            [
                "First pass: read chapter summaries quickly.",
                "Second pass: test yourself using viva questions.",
                "Third pass: solve MCQs and review weak topics.",
                "Final pass: explain difficult topics aloud in your own words.",
            ],
            styles,
        )
    )

    story.append(Paragraph("Mega Practice Bank", styles["SectionTitle"]))
    for label in WORKBOOK_SETS:
        story.append(Paragraph(label, styles["TinyLabel"]))
        story.append(
            bullet_list(
                [
                    f"{label}: Explain the difference between AI, machine learning, and deep learning.",
                    f"{label}: Describe one responsible and one irresponsible way to use AI in education.",
                    f"{label}: Explain how prompts affect output quality in an LLM workflow.",
                    f"{label}: List common reliability risks in AI systems and suggest controls.",
                    f"{label}: Write one interview-style answer about the future of AI careers.",
                ],
                styles,
            )
        )


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawRightString(doc.pagesize[0] - 40, 20, f"Page {doc.page}")
    canvas.restoreState()


def build_pdf():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    styles = build_styles()
    doc = BaseDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.6 * inch,
        title="AI Master Notes",
        author="EduStack",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    doc.addPageTemplates([PageTemplate(id="all", frames=[frame], onPage=add_page_number)])

    story = []
    add_cover(story, styles)
    add_table_of_contents(story, styles)

    for index, chapter in enumerate(CHAPTERS, start=1):
        add_chapter(story, styles, index, chapter)

    add_revision_zone(story, styles)
    doc.build(story)
    print(f"Generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_pdf()
