import os
from datetime import datetime
from dateutil.relativedelta import relativedelta

from flask import Flask, request, abort, render_template, redirect, url_for, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import cloudinary
import cloudinary.uploader

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

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True
)

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
shopping_collection = db["shopping_list"]


def init_db():
    """
    MongoDB 不需要像 SQLite 一樣 CREATE TABLE。
    這裡先建立索引，方便之後依照 user_id 查資料。
    """
    products_collection.create_index("user_id")
    products_collection.create_index("expire_date")
    products_collection.create_index("product_type")
    shopping_collection.create_index("user_id")


# =========================
# 共用工具
# =========================

def normalize_product_type(product_type):
    """
    統一產品類型命名。

    因為前端可能傳：
    - makeup
    - cosmetics
    - comestics  錯字版，但先相容

    後端統一存成：
    - cosmetics = 化妝品
    - skincare = 保養品
    """
    if not product_type:
        return "cosmetics"

    if product_type in ["makeup", "cosmetics", "comestics"]:
        return "cosmetics"

    if product_type == "skincare":
        return "skincare"

    return None


def get_product_type_query(product_type):
    """
    給 GET 查詢使用。
    如果前端查 cosmetics / comestics / makeup，
    就把舊資料和新資料都查出來。
    """
    if not product_type:
        return None

    if product_type in ["makeup", "cosmetics", "comestics"]:
        return {"$in": ["makeup", "cosmetics", "comestics"]}

    if product_type == "skincare":
        return "skincare"

    return product_type


def calculate_expire_date(base_date, expire_months):
    base_date_obj = datetime.strptime(base_date, "%Y-%m-%d")
    expire_date_obj = base_date_obj + relativedelta(months=expire_months)
    return expire_date_obj.strftime("%Y-%m-%d")


def build_expire_fields(data):
    """
    支援兩種日期模式：

    1. date_mode = "manufacture"
       使用 manufacture_date + expire_months 計算 expire_date

    2. date_mode = "direct"
       使用者直接填 expire_date
    """
    date_mode = data.get("date_mode")

    manufacture_date = data.get("manufacture_date", "")
    expire_months = data.get("expire_months", "")
    expire_date = data.get("expire_date", "")

    if date_mode == "manufacture":
        if not manufacture_date:
            raise ValueError("manufacture_date 為必填")

        if expire_months in ["", None]:
            raise ValueError("expire_months 為必填")

        expire_months = int(expire_months)
        expire_date = calculate_expire_date(manufacture_date, expire_months)

        return {
            "date_mode": "manufacture",
            "manufacture_date": manufacture_date,
            "expire_months": expire_months,
            "expire_date": expire_date
        }

    elif date_mode == "direct":
        if not expire_date:
            raise ValueError("expire_date 為必填")

        datetime.strptime(expire_date, "%Y-%m-%d")

        return {
            "date_mode": "direct",
            "manufacture_date": "",
            "expire_months": "",
            "expire_date": expire_date
        }

    else:
        raise ValueError("date_mode 只能是 manufacture 或 direct")


def product_to_dict(product):
    """
    MongoDB 的 _id 是 ObjectId，不能直接 jsonify，
    所以轉成字串 id 給前端使用。
    """
    return {
        "id": str(product["_id"]),
        "user_id": product.get("user_id", DEFAULT_USER_ID),
        "product_type": product.get("product_type", "cosmetics"),
        "product_name": product.get("product_name", ""),
        "brand": product.get("brand", ""),
        "category": product.get("category", ""),
        "shade": product.get("shade", ""),
        "image_url": product.get("image_url", ""),
        "date_mode": product.get("date_mode", ""),
        "manufacture_date": product.get("manufacture_date", ""),
        "expire_months": product.get("expire_months", ""),
        "expire_date": product.get("expire_date", ""),
        "created_at": product.get("created_at", ""),
        "updated_at": product.get("updated_at", "")
    }


def shopping_to_dict(item):
    return {
        "id": str(item["_id"]),
        "user_id": item.get("user_id", DEFAULT_USER_ID),
        "item_name": item.get("item_name", ""),
        "brand": item.get("brand", ""),
        "category": item.get("category", ""),
        "source": item.get("source", ""),
        "note": item.get("note", ""),
        "is_bought": item.get("is_bought", False),
        "created_at": item.get("created_at", ""),
        "updated_at": item.get("updated_at", "")
    }


def get_user_id_from_request():
    """
    暫時先支援三種方式：
    1. query string：/api/products?user_id=xxx
    2. JSON body 裡的 user_id
    3. 預設 demo_user
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
        product_type = normalize_product_type(request.form.get("product_type", "cosmetics"))
        product_name = request.form.get("product_name")
        brand = request.form.get("brand", "")
        category = request.form.get("category", "")
        shade = request.form.get("shade", "")
        image_url = request.form.get("image_url", "")
        date_mode = request.form.get("date_mode")

        if product_type is None:
            return "product_type 只能是 cosmetics 或 skincare", 400

        data = {
            "date_mode": date_mode,
            "manufacture_date": request.form.get("manufacture_date", ""),
            "expire_months": request.form.get("expire_months", ""),
            "expire_date": request.form.get("expire_date", "")
        }

        if not product_name:
            return "product_name 為必填", 400

        try:
            expire_fields = build_expire_fields(data)
        except ValueError as e:
            return str(e), 400

        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        product = {
            "user_id": user_id,
            "product_type": product_type,
            "product_name": product_name,
            "brand": brand,
            "category": category,
            "shade": shade,
            "image_url": image_url,
            "date_mode": expire_fields["date_mode"],
            "manufacture_date": expire_fields["manufacture_date"],
            "expire_months": expire_fields["expire_months"],
            "expire_date": expire_fields["expire_date"],
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

@app.route("/api/upload-image", methods=["POST"])
def upload_image_api():
    if "image" not in request.files:
        return jsonify({
            "error": "請上傳圖片，欄位名稱必須是 image"
        }), 400

    image = request.files["image"]

    if image.filename == "":
        return jsonify({
            "error": "沒有選擇圖片"
        }), 400

    try:
        result = cloudinary.uploader.upload(
            image,
            folder="mybeautystudio/products"
        )

        image_url = result.get("secure_url")

        return jsonify({
            "message": "圖片上傳成功",
            "image_url": image_url
        }), 201

    except Exception as e:
        return jsonify({
            "error": "圖片上傳失敗",
            "detail": str(e)
        }), 500

@app.route("/api/products", methods=["GET"])
def get_products_api():
    user_id = request.args.get("user_id", DEFAULT_USER_ID)
    product_type = request.args.get("product_type")

    query = {
        "user_id": user_id
    }

    product_type_query = get_product_type_query(product_type)

    if product_type_query:
        query["product_type"] = product_type_query

    products = list(products_collection.find(query).sort("created_at", -1))

    return jsonify([product_to_dict(product) for product in products])


@app.route("/api/products", methods=["POST"])
def add_product_api():
    data = request.get_json()

    if data is None:
        return jsonify({"error": "請傳送 JSON 格式資料"}), 400

    user_id = data.get("user_id", DEFAULT_USER_ID)
    product_type = normalize_product_type(data.get("product_type", "cosmetics"))
    product_name = data.get("product_name")
    brand = data.get("brand", "")
    category = data.get("category", "")
    shade = data.get("shade", "")
    image_url = data.get("image_url", "")

    if product_type is None:
        return jsonify({"error": "product_type 只能是 cosmetics 或 skincare"}), 400

    if not product_name:
        return jsonify({"error": "product_name 為必填"}), 400

    try:
        expire_fields = build_expire_fields(data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    product = {
        "user_id": user_id,
        "product_type": product_type,
        "product_name": product_name,
        "brand": brand,
        "category": category,
        "shade": shade,
        "image_url": image_url,
        "date_mode": expire_fields["date_mode"],
        "manufacture_date": expire_fields["manufacture_date"],
        "expire_months": expire_fields["expire_months"],
        "expire_date": expire_fields["expire_date"],
        "created_at": now,
        "updated_at": now
    }

    result = products_collection.insert_one(product)
    product["_id"] = result.inserted_id

    return jsonify({
        "message": "新增成功",
        "product": product_to_dict(product)
    }), 201


@app.route("/api/products/<product_id>", methods=["PATCH"])
def api_update_product(product_id):
    try:
        object_id = ObjectId(product_id)
    except InvalidId:
        return jsonify({"error": "產品 ID 格式錯誤"}), 400

    data = request.get_json()

    if data is None:
        return jsonify({"error": "請傳送 JSON 格式資料"}), 400

    old_product = products_collection.find_one({"_id": object_id})

    if old_product is None:
        return jsonify({"error": "找不到這筆產品"}), 404

    update_data = {}

    allowed_fields = [
        "product_type",
        "product_name",
        "brand",
        "category",
        "shade",
        "image_url",
        "date_mode",
        "manufacture_date",
        "expire_months",
        "expire_date"
    ]

    for field in allowed_fields:
        if field in data:
            update_data[field] = data.get(field)

    if "product_type" in update_data:
        normalized_type = normalize_product_type(update_data["product_type"])

        if normalized_type is None:
            return jsonify({"error": "product_type 只能是 cosmetics 或 skincare"}), 400

        update_data["product_type"] = normalized_type

    date_related_fields = {
        "date_mode",
        "manufacture_date",
        "expire_months",
        "expire_date"
    }

    if date_related_fields.intersection(data.keys()):
        merged_data = {
            "date_mode": old_product.get("date_mode", ""),
            "manufacture_date": old_product.get("manufacture_date", ""),
            "expire_months": old_product.get("expire_months", ""),
            "expire_date": old_product.get("expire_date", "")
        }

        merged_data.update(data)

        try:
            expire_fields = build_expire_fields(merged_data)
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

        update_data.update(expire_fields)

    if not update_data:
        return jsonify({"error": "沒有可更新的欄位"}), 400

    update_data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    result = products_collection.update_one(
        {"_id": object_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return jsonify({"error": "找不到這筆產品"}), 404

    updated_product = products_collection.find_one({"_id": object_id})

    return jsonify({
        "message": "更新成功",
        "product": product_to_dict(updated_product)
    })


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


# ============================================================
# 購物清單 API
# ============================================================

@app.route("/api/shopping-list", methods=["GET"])
def get_shopping_list_api():
    user_id = request.args.get("user_id", DEFAULT_USER_ID)

    items = list(shopping_collection.find({
        "user_id": user_id
    }).sort("created_at", -1))

    return jsonify([shopping_to_dict(item) for item in items])


@app.route("/api/shopping-list", methods=["POST"])
def add_shopping_item_api():
    data = request.get_json()

    if data is None:
        return jsonify({"error": "請傳送 JSON 格式資料"}), 400

    user_id = data.get("user_id", DEFAULT_USER_ID)
    item_name = data.get("item_name")
    brand = data.get("brand", "")
    category = data.get("category", "")
    source = data.get("source", "")
    note = data.get("note", "")

    if not item_name:
        return jsonify({"error": "item_name 為必填"}), 400

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    item = {
        "user_id": user_id,
        "item_name": item_name,
        "brand": brand,
        "category": category,
        "source": source,
        "note": note,
        "is_bought": False,
        "created_at": now,
        "updated_at": now
    }

    result = shopping_collection.insert_one(item)
    item["_id"] = result.inserted_id

    return jsonify({
        "message": "新增成功",
        "item": shopping_to_dict(item)
    }), 201


@app.route("/api/shopping-list/<item_id>", methods=["PATCH"])
def update_shopping_item_api(item_id):
    data = request.get_json()

    if data is None:
        return jsonify({"error": "請傳送 JSON 格式資料"}), 400

    try:
        object_id = ObjectId(item_id)
    except InvalidId:
        return jsonify({"error": "無效的 item id"}), 400

    allowed_fields = [
        "item_name",
        "brand",
        "category",
        "source",
        "note",
        "is_bought"
    ]

    update_data = {}

    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]

    if not update_data:
        return jsonify({"error": "沒有可更新的欄位"}), 400

    update_data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    result = shopping_collection.update_one(
        {"_id": object_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        return jsonify({"error": "找不到此購物清單項目"}), 404

    updated_item = shopping_collection.find_one({"_id": object_id})

    return jsonify({
        "message": "更新成功",
        "item": shopping_to_dict(updated_item)
    })


@app.route("/api/shopping-list/<item_id>", methods=["DELETE"])
def delete_shopping_item_api(item_id):
    try:
        object_id = ObjectId(item_id)
    except InvalidId:
        return jsonify({"error": "無效的 item id"}), 400

    result = shopping_collection.delete_one({
        "_id": object_id
    })

    if result.deleted_count == 0:
        return jsonify({"error": "找不到此購物清單項目"}), 404

    return jsonify({
        "message": "刪除成功"
    })


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
