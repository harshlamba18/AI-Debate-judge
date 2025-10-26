from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import random
import re
import asyncio
from blockchain_record import store_ai_result
import os

app = FastAPI(title="Free AI Debate Judge")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Smaller model (6× lighter than bart-large-mnli)
MODEL_NAME = os.getenv("MODEL_NAME", "valhalla/distilbart-mnli-12-1")

# ✅ Lazy loading to reduce startup RAM
judge_model = None

class DebateInput(BaseModel):
    side_a: str
    side_b: str
    topic: str


def load_model():
    global judge_model
    if judge_model is None:
        # Load model lazily (first call only)
        judge_model = pipeline(
            "zero-shot-classification",
            model=MODEL_NAME,
            device=-1,  # force CPU
            cache_dir="./model_cache",  # avoid re-downloading each time
        )
    return judge_model


def calculate_strict_score(eval_result, exponent=3):
    top_score = eval_result["scores"][0]
    score = top_score ** exponent * 100
    score += random.uniform(-2, 2)
    return round(score, 2)


def _escape_control_chars(text: str) -> str:
    def _repl(m):
        return "\\u%04x" % ord(m.group(0))
    return re.sub(r"[\x00-\x1f]", _repl, text)


@app.post("/judge")
async def judge_debate(data: DebateInput):
    model = load_model()
    criteria = ["logical", "clear", "relevant", "convincing", "emotional appeal"]

    # Run both sides concurrently on background threads
    side_a_eval, side_b_eval = await asyncio.gather(
        asyncio.to_thread(model, data.side_a, candidate_labels=criteria),
        asyncio.to_thread(model, data.side_b, candidate_labels=criteria)
    )

    side_a_score = calculate_strict_score(side_a_eval)
    side_b_score = calculate_strict_score(side_b_eval)

    if side_a_score > side_b_score:
        verdict = "Side A is more persuasive overall."
    elif side_b_score > side_a_score:
        verdict = "Side B is more persuasive overall."
    else:
        verdict = "Both sides were equally persuasive."

    reasoning = (
        f"Side A top trait: {side_a_eval['labels'][0]} | "
        f"Side B top trait: {side_b_eval['labels'][0]} | "
        f"Verdict: {verdict}"
    )

    try:
        tx_hash = await asyncio.to_thread(store_ai_result, data.topic, side_a_score, side_b_score, verdict)
    except Exception:
        tx_hash = None

    return {
        "topic": data.topic,
        "side_a_score": side_a_score,
        "side_b_score": side_b_score,
        "verdict": verdict,
        "reasoning": reasoning,
        "transaction_hash": tx_hash,
    }
