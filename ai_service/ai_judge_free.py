import os
import re
import random
import asyncio
import httpx
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from blockchain_record import store_ai_result
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Debate Judge (Groq - Llama 3.1 8B Instant)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("Missing GROQ_API_KEY in environment variables.")

GROQ_MODEL = "llama-3.1-8b-instant"

# --- Input schema ---
class DebateInput(BaseModel):
    side_a: str
    side_b: str
    topic: str


# --- Groq evaluation helper ---
async def evaluate_argument(side_text: str, topic: str) -> tuple[float, str]:
    """
    Get a score (0–100) and reasoning line for a given debate side.
    """
    prompt = f"""
You are an impartial debate judge.
Evaluate the following argument about the topic: "{topic}".

Argument:
{side_text}

1. Rate its persuasiveness from 0 to 100, considering logic, clarity, relevance, and emotional appeal.
2. Give one short sentence explaining why.

Respond in this format exactly:
Score: <number>
Reason: <short sentence>
    """

    async with httpx.AsyncClient(timeout=30.0) as client:
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
        payload = {
            "model": GROQ_MODEL,
            "messages": [
                {"role": "system", "content": "You are an objective debate evaluator."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,
        }

        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
        )

        if response.status_code != 200:
            print("Groq API error:", response.text)
            return random.uniform(45, 55), "Evaluation failed, using fallback."

        result = response.json()
        text = result["choices"][0]["message"]["content"].strip()

        score_match = re.search(r"(\d+(\.\d+)?)", text)
        reason_match = re.search(r"Reason:\s*(.+)", text, re.IGNORECASE)

        score = float(score_match.group(1)) if score_match else random.uniform(45, 55)
        score = max(0.0, min(score, 100.0))
        reason = reason_match.group(1).strip() if reason_match else "No reasoning provided."

        return score, reason


# --- Debate judging endpoint ---
@app.post("/judge")
async def judge_debate(data: DebateInput):
    """
    Compare both debate sides and return the same structured response
    as before so the frontend continues working without changes.
    """
    (side_a_score, side_a_reason), (side_b_score, side_b_reason) = await asyncio.gather(
        evaluate_argument(data.side_a, data.topic),
        evaluate_argument(data.side_b, data.topic),
    )

    if side_a_score > side_b_score:
        verdict = "Side A is more persuasive overall."
    elif side_b_score > side_a_score:
        verdict = "Side B is more persuasive overall."
    else:
        verdict = "Both sides were equally persuasive."

    reasoning = (
        f"Side A: {side_a_reason} (Score: {side_a_score:.1f}) | "
        f"Side B: {side_b_reason} (Score: {side_b_score:.1f}) | "
        f"Verdict: {verdict}"
    )

    try:
        tx_hash = await asyncio.to_thread(
            store_ai_result, data.topic, side_a_score, side_b_score, verdict
        )
    except Exception as e:
        print("Blockchain error:", e)
        tx_hash = None

    # ✅ Same response shape your frontend expects
    return {
        "topic": data.topic,
        "side_a_score": side_a_score,
        "side_b_score": side_b_score,
        "verdict": verdict,
        "reasoning": reasoning,
        "transaction_hash": tx_hash,
    }
