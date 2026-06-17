import os
from typing import Any

from groq import Groq

GROQ_MODEL = "llama-3.3-70b-versatile"


def _get_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is not set")
    return Groq(api_key=api_key)


def generate_proposal_content(client_data: dict[str, Any]) -> str:
    """Generate polished proposal content using Llama 3.1 70B."""
    client = _get_client()

    client_name = client_data.get("client_name", "Client")
    budget = client_data.get("budget", "Not specified")
    timeline = client_data.get("timeline", "Not specified")
    services = client_data.get("services", [])
    services_text = ", ".join(services) if isinstance(services, list) else str(services)
    company = client_data.get("company", "")
    additional_notes = client_data.get("notes", "")

    prompt = f"""You are an expert digital agency proposal writer. Create a professional, polished client proposal.

Client: {client_name}
Company: {company}
Budget: ${budget}
Timeline: {timeline}
Services Needed: {services_text}
Additional Notes: {additional_notes}

Write a complete proposal with these sections:
1. Executive Summary
2. Understanding Your Needs
3. Proposed Services & Deliverables
4. Project Timeline & Milestones
5. Investment & Pricing Breakdown
6. Why Choose Us
7. Next Steps

Use professional agency language. Include specific deliverables and realistic timelines.
Format with clear headings and bullet points where appropriate."""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior digital agency strategist writing winning client proposals.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=4096,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        raise RuntimeError(f"Groq API error: {str(e)}") from e


def generate_content_item(content_type: str, topic: str, client_name: str = "") -> str:
    """Generate marketing content using Llama 3.1 70B."""
    client = _get_client()

    type_instructions = {
        "blog": "Write a comprehensive blog post (800-1200 words) with an engaging headline, introduction, subheadings, and conclusion. Include SEO-friendly structure.",
        "social": "Write 3 engaging social media posts for different platforms (LinkedIn, Twitter/X, Instagram). Include hashtags and emojis where appropriate.",
        "ad": "Write compelling ad copy including: headline variations (3), primary text (2 versions), and call-to-action options.",
    }

    instruction = type_instructions.get(
        content_type.lower(),
        f"Write professional {content_type} content.",
    )

    prompt = f"""{instruction}

Topic/Subject: {topic}
Client: {client_name or "Agency Client"}

Create high-quality, ready-to-publish content that aligns with modern digital marketing best practices."""

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert content strategist and copywriter for digital agencies.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.8,
            max_tokens=4096,
        )
        return response.choices[0].message.content or ""
    except Exception as e:
        raise RuntimeError(f"Groq API error: {str(e)}") from e
