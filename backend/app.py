import os
from datetime import datetime
from dateutil.relativedelta import relativedelta

from flask import Flask, request, abort, render_template, redirect, url_for, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId

from linebot.v3 import WebhookHandler
from linebot.v3.exceptions import InvalidSignatureError
from linebot.v3.messaging import (
    Configuration,
    ApiClient,
    MessagingApi,
    ReplyMessageRequest,
    TextMessage
)
from linebot.v3.webhooks import (
    MessageEvent,
    TextMessageContent
)


# =========================
# 基本設定
# =========================

load_dotenv()

app = Flask(__name__)
CORS(app)


# =========================
# MongoDB 設定
# =========================

MONGO_URI = os.environ.get("MONGO_URI")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "mzbm")
DEFAULT_USER_ID = os.environ.get("DEFAULT_USER_ID", "demo_user")

if not MONGO_URI:
    raise RuntimeError("請先在 .env 設定 MONGO_URI")

mongo_client = MongoClient(MONGO_URI)
db = mongo_client[MONGO_DB_NAME]
products_collection = db["products"]


def init_db():
    """
    MongoDB 不需要像 SQLite 一樣 CREATE TABLE。
    這裡先建立索引，方便之後依照 user_id 查資料。
    """
    products_collection.create_index("user_id")
    products_collection.create_index("expire_date")


def calculate_expire_date(open_date, expire_months):
    open_date_obj = datetime.strptime(open_date, "%Y-%m-%d")
    expire_date_obj = open_date_obj + relativedelta(months=expire_months)
    return expire_date_obj.strftime("%Y-%m-%d")


def product_to_dict(product):
    """
    MongoDB 的 _id 是 ObjectId，不能直接 jsonify，
    所以轉成字串 id 給前端使用。
    """
    return {
        "id": str(product["_id"]),
        "user_id": product.get("user_id", DEFAULT_USER_ID),
        "product_name": product.get("product_name", ""),
        "brand": product.get("brand", ""),
        "category": product.get("category", ""),
        "open_date": product.get("open_date", ""),
        "expire_months": product.get("expire_months", 12),
        "expire_date": product.get("expire_date", ""),
        "created_at": product.get("created_at", ""),
        "updated_at": product.get("updated_at", "")
    }


def get_user_id_from_request():
    """
    暫時先支援三種方式：
    1. query string：/api/products?user_id=xxx
    2. JSON body 裡的 user_id
    3. 預設 demo_user

    之後做 LINE LIFF / LINE Login 時，
    前端取得 LINE userId 後，就可以傳 user_id 給 API。
    """
    user_id = request.args.get("user_id")

    if not user_id and request.is_json:
        data = request.get_json(silent=True) or {}
        user_id = data.get("user_id")

    return user_id or DEFAULT_USER_ID


# =========================
# LINE Bot 設定
# =========================

LINE_CHANNEL_ACCESS_TOKEN = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN")
LINE_CHANNEL_SECRET = os.environ.get("LINE_CHANNEL_SECRET")

configuration = Configuration(access_token=LINE_CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(LINE_CHANNEL_SECRET)


@app.route("/callback", methods=["POST"])
def callback():
    signature = request.headers.get("X-Line-Signature")
    body = request.get_data(as_text=True)

    app.logger.info("Request body: " + body)

    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        app.logger.info("Invalid signature. Please check your channel access token/channel secret.")
        abort(400)

    return "OK"


@handler.add(MessageEvent, message=TextMessageContent)
def handle_message(event):
    user_text = event.message.text

    # LINE webhook 裡面可以拿到 LINE userId
    # 這個之後可以用來讓每個使用者查自己的資料
    line_user_id = getattr(event.source, "user_id", DEFAULT_USER_ID)

    if user_text == "查詢產品":
        count = products_collection.count_documents({
            "user_id": line_user_id
        })
        reply_text = f"你目前資料庫裡有 {count} 筆美妝產品 💄"
    else:
        reply_text = "早安哇😙💅💥"

    with ApiClient(configuration) as api_client:
        line_bot_api = MessagingApi(api_client)
        line_bot_api.reply_message_with_http_info(
            ReplyMessageRequest(
                reply_token=event.reply_token,
                messages=[TextMessage(text=reply_text)]
            )
        )


# =========================
# 人看的網頁版：給你自己測試用
# =========================

@app.route("/")
def home():
    return redirect(url_for("products"))


@app.route("/products")
def products():
    user_id = request.args.get("user_id", DEFAULT_USER_ID)

    products = list(
        products_collection
        .find({"user_id": user_id})
        .sort("_id", -1)
    )

    products = [product_to_dict(product) for product in products]

    return render_template("products.html", products=products)


@app.route("/products/new", methods=["GET", "POST"])
def new_product():
    if request.method == "POST":
        user_id = request.form.get("user_id", DEFAULT_USER_ID)
        product_name = request.form["product_name"]
        brand = request.form.get("brand", "")
        category = request.form.get("category", "")
        open_date = request.form["open_date"]
        expire_months = int(request.form["expire_months"])

        expire_date = calculate_expire_date(open_date, expire_months)
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        product = {
            "user_id": user_id,
            "product_name": product_name,
            "brand": brand,
            "category": category,
            "open_date": open_date,
            "expire_months": expire_months,
            "expire_date": expire_date,
            "created_at": now,
            "updated_at": now
        }

        products_collection.insert_one(product)

        return redirect(url_for("products", user_id=user_id))

    return render_template("new_products.html")


@app.route("/products/delete/<product_id>", methods=["POST"])
def delete_product(product_id):
    try:
        object_id = ObjectId(product_id)
    except InvalidId:
        return "產品 ID 格式錯誤", 400

    products_collection.delete_one({"_id": object_id})

    return redirect(url_for("products"))


# =========================
# 給組員網站串接用的 API
# =========================

@app.route("/api/products", methods=["GET"])
def api_get_products():
    user_id = request.args.get("user_id", DEFAULT_USER_ID)

    products = list(
        products_collection
        .find({"user_id": user_id})
        .sort("_id", -1)
    )

    return jsonify([product_to_dict(product) for product in products])


@app.route("/api/products", methods=["POST"])
def api_create_product():
    data = request.get_json()

    if data is None:
        return jsonify({"error": "請傳送 JSON 格式資料"}), 400

    user_id = data.get("user_id", DEFAULT_USER_ID)
    product_name = data.get("product_name")
    brand = data.get("brand", "")
    category = data.get("category", "")
    open_date = data.get("open_date")
    expire_months = data.get("expire_months", 12)

    if not product_name:
        return jsonify({"error": "product_name 為必填"}), 400

    if not open_date:
        return jsonify({"error": "open_date 為必填"}), 400

    try:
        expire_months = int(expire_months)
        expire_date = calculate_expire_date(open_date, expire_months)
    except ValueError:
        return jsonify({"error": "open_date 格式需為 YYYY-MM-DD，expire_months 需為數字"}), 400

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    product = {
        "user_id": user_id,
        "product_name": product_name,
        "brand": brand,
        "category": category,
        "open_date": open_date,
        "expire_months": expire_months,
        "expire_date": expire_date,
        "created_at": now,
        "updated_at": now
    }

    result = products_collection.insert_one(product)

    inserted_product = products_collection.find_one({
        "_id": result.inserted_id
    })

    return jsonify({
        "message": "新增成功",
        "product": product_to_dict(inserted_product)
    }), 201


@app.route("/api/products/<product_id>", methods=["DELETE"])
def api_delete_product(product_id):
    try:
        object_id = ObjectId(product_id)
    except InvalidId:
        return jsonify({"error": "產品 ID 格式錯誤"}), 400

    result = products_collection.delete_one({
        "_id": object_id
    })

    if result.deleted_count == 0:
        return jsonify({"error": "找不到這筆產品"}), 404

    return jsonify({
        "message": "刪除成功",
        "deleted_id": product_id
    })


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
