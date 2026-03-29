# auth.py — Simple email/password auth with Flask session
# Requires: pip install flask bcrypt

import os
import bcrypt
from functools import wraps
from flask import session, redirect, url_for, request, flash


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def current_user() -> dict | None:
    """Return the stored user dict from the session, or None."""
    return session.get("user")


def current_user_id() -> str | None:
    u = current_user()
    if not u:
        return None
    return str(u.get("id"))


def login_required(f):
    """Decorator — redirect to /login if not authenticated."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user():
            session["next"] = request.url
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated


def register_auth_routes(app, db):
    """Attach /login, /register, /logout routes to the app."""

    @app.route("/login", methods=["GET", "POST"])
    def login():
        if current_user():
            return redirect(url_for("index"))

        error = None
        if request.method == "POST":
            email    = request.form.get("email", "").strip().lower()
            password = request.form.get("password", "")

            if not email or not password:
                error = "Email and password are required."
            else:
                user = db.get_user_by_email(email)
                if user and check_password(password, user["password_hash"]):
                    session.permanent = True
                    session["user"] = {
                        "id":    user["id"],
                        "email": user["email"],
                        "name":  user["name"],
                    }
                    next_url = session.pop("next", url_for("index"))
                    return redirect(next_url)
                else:
                    error = "Invalid email or password."

        return app.jinja_env.get_template("login.html").render(error=error, user=None)

    @app.route("/register", methods=["GET", "POST"])
    def register():
        if current_user():
            return redirect(url_for("index"))

        error = None
        if request.method == "POST":
            name     = request.form.get("name", "").strip()
            email    = request.form.get("email", "").strip().lower()
            password = request.form.get("password", "")
            confirm  = request.form.get("confirm", "")

            if not name or not email or not password:
                error = "All fields are required."
            elif len(password) < 8:
                error = "Password must be at least 8 characters."
            elif password != confirm:
                error = "Passwords do not match."
            elif db.get_user_by_email(email):
                error = "An account with that email already exists."
            else:
                pw_hash = hash_password(password)
                user_id = db.create_user(name, email, pw_hash)
                session.permanent = True
                session["user"] = {"id": user_id, "email": email, "name": name}
                return redirect(url_for("index"))

        return app.jinja_env.get_template("register.html").render(error=error, user=None)

    @app.route("/logout")
    def logout():
        session.clear()
        return redirect(url_for("login"))
