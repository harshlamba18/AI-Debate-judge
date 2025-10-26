from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel, ValidationError
from transformers import pipeline
from fastapi.middleware.cors import CORSMiddleware
import random
import json
import re
import asyncio
from blockchain_record import store_ai_result



app = FastAPI(title="Free AI Debate Judge")



app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_methods=["*"],

    allow_headers=["*"],

)



judge_model = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")



class DebateInput(BaseModel):
    side_a: str
    side_b: str
    topic: str



def calculate_strict_score(eval_result, exponent=3):
    """
    Strict scoring using only top label score and exponentiation.
    Adds a tiny random adjustment to break ties.
    """
    top_score = eval_result["scores"][0]
    score = top_score ** exponent * 100
    # Add small random adjustment ±2% to make scores more distinct
    score += random.uniform(-2, 2)
    return round(score, 2)



def _escape_control_chars(text: str) -> str:
    # Replace ASCII control characters (0x00-0x1F) with \u00XX escapes so json.loads won't fail.
    def _repl(m):
        return "\\u%04x" % ord(m.group(0))
    return re.sub(r"[\x00-\x1f]", _repl, text)



@app.post("/judge")
async def judge_debate(data: DebateInput):
    criteria = ["logical", "clear", "relevant", "convincing", "emotional appeal"]

    # Evaluate both sides in a thread to avoid blocking the event loop
    side_a_eval = await asyncio.to_thread(judge_model, data.side_a, candidate_labels=criteria)
    side_b_eval = await asyncio.to_thread(judge_model, data.side_b, candidate_labels=criteria)

    # Calculate strict scores
    side_a_score = calculate_strict_score(side_a_eval)
    side_b_score = calculate_strict_score(side_b_eval)

    # Verdict
    if side_a_score > side_b_score:
        verdict = "Side A is more persuasive overall."
    elif side_b_score > side_a_score:
        verdict = "Side B is more persuasive overall."
    else:
        verdict = "Both sides were equally persuasive."

    # Reasoning
    reasoning = (
        f"Side A top trait: {side_a_eval['labels'][0]} | "
        f"Side B top trait: {side_b_eval['labels'][0]} | "
        f"Verdict: {verdict}"
    )

    # persist result to blockchain (best-effort) off the event loop
    try:
        tx_hash = await asyncio.to_thread(store_ai_result, data.topic, side_a_score, side_b_score, verdict)
    except Exception:
        tx_hash = None

    return {
        "topic": data.topic,
        "side_a_score": round(side_a_score, 2),
        "side_b_score": round(side_b_score, 2),
        "verdict": verdict,
        "reasoning": reasoning,
        "transaction_hash": tx_hash,
    }