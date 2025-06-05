

backenndURL: localhost:5000
/api/products = get all products
/api/sellers = get all sellers

api expectation example for get /products:
{
        "id": 1,
        "title": "dd",
        "description": "d",
        "price": 2,
        "discount": 0,
        "discount_validity": "",
        "final_price": 2,
        "category": "2",
        "brand": "none",
        "stock": 0,
        "deliverycharge_inside": 0,
        "deliverycharge_outside": 0,
        "sold": "{}",
        "rating": "{}",
        "total_rating": "{}",
        "reviews": "{}",
        "shopname": "{}",
        "shopdetails": "{}",
        "tags": "",
        "image": "/uploads/image-1749128794840-538504628.jpg",
        "seller_id": 2
    }

add api expectation for /sellers:
{
            "id": 1,
            "name": "shawon",
            "email": "shawon@gmail.com",
            "shopName": "dsds",
            "shopDetails": "ddsd"
        }