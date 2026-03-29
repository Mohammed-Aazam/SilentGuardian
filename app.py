# app.py
from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

from signals import compute_signals, compare_to_baseline, compute_baseline, score_caution
from signals import compute_focus_signals, compute_focus_baseline, compare_focus_to_baseline
from storage import (
    init_db, DB,
    load_history, save_entry, load_baseline, save_baseline, reset_clarity,
    load_focus_history, save_focus_entry, load_focus_baseline, save_focus_baseline, reset_focus,
    reset_all,
)
from claude_client import analyze, analyze_focus
from auth import register_auth_routes, login_required, current_user, current_user_id

app = Flask(__name__)
app.secret_key = os.environ["SECRET_KEY"]
app.permanent_session_lifetime = timedelta(days=30)

db = DB()
with app.app_context():
    init_db()

register_auth_routes(app, db)

CLARITY_PROMPTS = [
    "Tell me about your morning so far.",
    "What is something you enjoyed recently?",
    "How are you feeling today and what have you been up to?",
    "Describe something that made you smile this week.",
    "What did you do this morning?",
]

# 3-question sets for daily focus check-in — one set rotates by weekday
FOCUS_PROMPT_SETS = [
    [
        "Walk me through what's on your plate right now — what are the 2 or 3 biggest things demanding your attention?",
        "What's one task you've been putting off, and what's the real reason it's stalled?",
        "How is your energy and focus today compared to a typical day? What's driving that?",
    ],
    [
        "Describe your morning so far — what got done, what got derailed, and what's still waiting?",
        "What's the thing you most want to finish today but feel least like doing? What's in the way?",
        "When did you last feel genuinely in the zone? What made that possible?",
    ],
    [
        "What's competing for your attention right now — list everything that's pulling at you.",
        "Which of those things actually matters most today, and which are noise?",
        "What would a good day look like by the time you finish — what needs to be true?",
    ],
    [
        "Walk me through the last hour — what were you doing, and how focused did it feel?",
        "Is there anything you're actively avoiding right now? What happens when you think about it?",
        "What's your biggest focus blocker today — time, energy, clarity, or something else?",
    ],
    [
        "What's sitting unfinished that's taking up background mental space right now?",
        "Describe how scattered or focused you feel in words — and what's causing it.",
        "What one thing, if you got it done today, would make everything else feel easier?",
    ],
]

# Single prompts used only during onboarding (5 baseline sessions)
FOCUS_ONBOARDING_PROMPTS = [
    "Walk me through what's on your plate right now.",
    "What task have you been putting off, and what's getting in the way?",
    "Describe your energy today and what you've managed to do.",
    "What's been pulling your attention in different directions?",
    "Tell me about a moment today where you felt in the zone or lost the thread.",
]

# ── Pages ─────────────────────────────────────────────────────────────────────

@app.route("/")
@login_required
def index():
    uid = current_user_id()
    baseline = load_baseline(uid)
    history  = load_history(uid)
    today    = datetime.now().strftime("%Y-%m-%d")
    today_done = any(e["date"][:10] == today for e in history)

    # Allow explicit repeat of clarity check-in if requested
    repeat = request.args.get("repeat") == "1"
    if repeat:
        today_done = False

    prompt   = CLARITY_PROMPTS[datetime.now().weekday() % len(CLARITY_PROMPTS)]
    return render_template("index.html",
        baseline=baseline, history=history[-3:],
        today_done=today_done, prompt=prompt,
        user=current_user())

@app.route("/onboarding")
@login_required
def onboarding():
    collected = request.args.get("collected", "0")
    step = int(collected) + 1
    prompt = CLARITY_PROMPTS[(step - 1) % len(CLARITY_PROMPTS)]
    return render_template("onboarding.html", step=step,
                           total=5, prompt=prompt, collected=collected,
                           user=current_user())

@app.route("/history")
@login_required
def history_page():
    uid = current_user_id()
    history = load_history(uid)
    return render_template("history.html",
        history=list(reversed(history)), user=current_user())

@app.route("/focus")
@login_required
def focus_index():
    uid = current_user_id()
    baseline   = load_focus_baseline(uid)
    history    = load_focus_history(uid)
    today      = datetime.now().strftime("%Y-%m-%d")
    today_done = any(e["date"][:10] == today for e in history)

    # Allow explicit repeat of focus check-in if requested
    repeat = request.args.get("repeat") == "1"
    if repeat:
        today_done = False

    # Pass the 3-question set for today
    prompts = FOCUS_PROMPT_SETS[datetime.now().weekday() % len(FOCUS_PROMPT_SETS)]
    return render_template("focus.html", baseline=baseline, history=history[-3:],
                           today_done=today_done, prompts=prompts, user=current_user(),
                           repeat_mode=repeat)

@app.route("/focus/onboarding")
@login_required
def focus_onboarding():
    collected = request.args.get("collected", "0")
    step = int(collected) + 1
    prompt = FOCUS_ONBOARDING_PROMPTS[(step - 1) % len(FOCUS_ONBOARDING_PROMPTS)]
    return render_template("focus_onboarding.html", step=step,
                           total=5, prompt=prompt, collected=collected,
                           user=current_user())

@app.route("/focus/history")
@login_required
def focus_history_page():
    uid = current_user_id()
    history = load_focus_history(uid)
    return render_template("focus_history.html",
        history=list(reversed(history)), user=current_user())

# ── Clarity API ───────────────────────────────────────────────────────────────

@app.route("/api/baseline", methods=["POST"])
@login_required
def api_baseline():
    uid   = current_user_id()
    texts = request.json.get("texts", [])
    if len(texts) < 5:
        return jsonify({"error": "Need at least 5 samples"}), 400
    baseline = compute_baseline(texts)
    save_baseline(uid, baseline)
    return jsonify({"ok": True, "baseline": baseline})

@app.route("/api/analyze", methods=["POST"])
@login_required
def api_analyze():
    uid  = current_user_id()
    text = request.json.get("text", "").strip()
    if len(text.split()) < 10:
        return jsonify({"error": "Response too short — please enter at least 10 words"}), 400
    baseline = load_baseline(uid)
    if not baseline:
        return jsonify({"error": "No baseline found — please complete setup first"}), 400
    history  = load_history(uid)
    signals  = compute_signals(text)
    deltas   = compare_to_baseline(signals, baseline)
    caution_level, flags, score = score_caution(signals, deltas)
    try:
        from dataclasses import asdict
        analysis = analyze(text, signals, baseline, deltas, history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    entry = {
        "id":       str(int(datetime.now().timestamp() * 1000)),
        "date":     datetime.now().isoformat(),
        "text":     text,
        "signals":  asdict(signals),
        "deltas":   deltas,
        "score":    score,
        "flags":    flags,
        "analysis": analysis,
    }
    save_entry(uid, entry)
    return jsonify(entry)

@app.route("/api/reset", methods=["POST"])
@login_required
def api_reset():
    reset_clarity(current_user_id())
    return jsonify({"ok": True})

# ── Focus API ─────────────────────────────────────────────────────────────────

@app.route("/api/focus/baseline", methods=["POST"])
@login_required
def api_focus_baseline():
    uid   = current_user_id()
    texts = request.json.get("texts", [])
    if len(texts) < 5:
        return jsonify({"error": "Need at least 5 samples"}), 400
    baseline = compute_focus_baseline(texts)
    save_focus_baseline(uid, baseline)
    return jsonify({"ok": True, "baseline": baseline})

@app.route("/api/focus/analyze", methods=["POST"])
@login_required
def api_focus_analyze():
    uid  = current_user_id()
    text = request.json.get("text", "").strip()
    if len(text.split()) < 10:
        return jsonify({"error": "Response too short — please enter at least 10 words"}), 400
    baseline = load_focus_baseline(uid)
    if not baseline:
        return jsonify({"error": "No baseline found — please complete setup first"}), 400
    history  = load_focus_history(uid)
    signals  = compute_focus_signals(text)
    deltas   = compare_focus_to_baseline(signals, baseline)
    try:
        from dataclasses import asdict
        analysis = analyze_focus(text, signals, baseline, deltas, history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    entry = {
        "id":       str(int(datetime.now().timestamp() * 1000)),
        "date":     datetime.now().isoformat(),
        "text":     text,
        "signals":  asdict(signals),
        "deltas":   deltas,
        "analysis": analysis,
    }
    save_focus_entry(uid, entry)
    return jsonify(entry)

@app.route("/api/focus/reset", methods=["POST"])
@login_required
def api_focus_reset():
    reset_focus(current_user_id())
    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
