// sellermodel.js

export class Seller {
  constructor(id, name, email, password, shopName, shopDetails) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password; // hashed password
    this.shopName = shopName;
    this.shopDetails = shopDetails || null;
  }

  // Return seller data without sensitive information
  toSafeObject() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      shopName: this.shopName,
      shopDetails: this.shopDetails
    };
  }

  // Create token payload
  toTokenPayload() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      shopName: this.shopName,
      shopDetails: this.shopDetails
    };
  }
}
