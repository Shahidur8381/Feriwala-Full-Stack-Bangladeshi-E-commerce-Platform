import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductForm from "../components/ProductForm";
import ProductList from "../components/ProductList";
import { getToken } from "../utils/auths";

interface SellerProfile {
  name: string;
  email: string;
  shopName: string;
  shopDetails: string;
}

interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  image?: string;
  discount?: number;
  discount_validity?: string;
  category: string;
  brand?: string;
  stock?: number;
  tags?: string;
  deliverycharge_inside?: number;
  deliverycharge_outside?: number;
}

const ManageProduct: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);

  const fetchSellerProfile = async () => {
    try {
      const token = getToken();
      const res = await axios.get("http://localhost:5000/api/sellers/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSellerProfile(res.data.seller);
    } catch (error) {
      console.error("Failed to fetch seller profile", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = getToken();
      // Corrected endpoint to fetch seller's products
      const res = await axios.get("http://localhost:5000/api/products/my-products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  useEffect(() => {
    fetchSellerProfile();
    fetchProducts();
  }, []);

  const handleDelete = async (productId: number) => {
    try {
      const token = getToken();
      await axios.delete(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
    } catch (error) {
      console.error("Failed to delete product", error);
      alert("Failed to delete product. Please try again.");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    window.scrollTo(0, 0);
  };

  const handleFormSubmit = async (formData: FormData) => {
    try {
      const token = getToken();
      
      if (!sellerProfile) {
        throw new Error("Seller profile not loaded");
      }
      
      // Add shop information from seller profile
      formData.append("shopname", sellerProfile.shopName);
      formData.append("shopdetails", sellerProfile.shopDetails);

      if (editingProduct) {
        // Corrected endpoint for updating products
        await axios.put(
          `http://localhost:5000/api/products/${editingProduct.id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert("Product updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/products", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        alert("Product added successfully");
      }

      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product", error);
      alert("Failed to save product: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
      {!sellerProfile ? (
        <div style={{ color: "red", marginBottom: "20px" }}>
          Please complete your shop profile before adding products.
        </div>
      ) : (
        <ProductForm 
          initialData={editingProduct || undefined} 
          onSubmit={handleFormSubmit} 
        />
      )}

      <h2 style={{ marginTop: 40 }}>Your Products</h2>
      {products.length === 0 ? (
        <p>No products found. Add your first product!</p>
      ) : (
        <ProductList 
          products={products} 
          onEdit={handleEdit}
          onDelete={handleDelete} 
        />
      )}
    </div>
  );
};

export default ManageProduct;