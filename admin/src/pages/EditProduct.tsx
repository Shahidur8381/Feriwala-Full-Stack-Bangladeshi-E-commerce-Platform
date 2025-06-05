import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ProductForm from "../components/ProductForm";
import { getToken } from '../utils/auths';

interface ProductData {
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

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const token = getToken();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        // First try to get the product using the seller's products endpoint
        const res = await axios.get(
          `http://localhost:5000/api/products/my-products`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Find the specific product by ID in the returned array
        const foundProduct = res.data.find((p: any) => p.id === parseInt(id || '0'));
        
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          // If not found in seller's products, try direct product endpoint
          const directRes = await axios.get(
            `http://localhost:5000/api/products/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          setProduct(directRes.data);
        }
      } catch (error) {
        console.error("Failed to load product", error);
        alert("Failed to load product. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id, token]);

  const handleSubmit = async (formData: FormData) => {
    try {
      if (!token) {
        alert('Authentication required');
        navigate('/login');
        return;
      }
      
      // Add seller profile information to the form data
      try {
        const profileRes = await axios.get('http://localhost:5000/api/sellers/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const { shopName, shopDetails } = profileRes.data.seller;
        formData.append('shopName', shopName);
        formData.append('shopDetails', shopDetails);
      } catch (profileError) {
        console.error("Failed to fetch seller profile", profileError);
      }
      
      await axios.put(
        `http://localhost:5000/api/products/${id}`, 
        formData, 
        {
          headers: { 
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          },
        }
      );
      alert("Product updated successfully!");
      navigate("/manage-products");
    } catch (error) {
      console.error("Failed to update product", error);
      alert("Failed to update product. Please try again.");
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Loading product...</p>;
  if (!product) return <p style={{ padding: 20 }}>Product not found.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Edit Product</h1>
      <ProductForm
        initialData={{
          id: product.id,
          title: product.title || "",
          price: product.price || 0,
          description: product.description || "",
          image: product.image || "",
          discount: product.discount || 0,
          discount_validity: product.discount_validity || "",
          category: product.category || "",
          brand: product.brand || "",
          stock: product.stock || 0,
          tags: product.tags || "",
          deliverycharge_inside: product.deliverycharge_inside || 0,
          deliverycharge_outside: product.deliverycharge_outside || 0,
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default EditProduct;