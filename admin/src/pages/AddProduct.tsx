import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ProductForm from "../components/ProductForm";
import { getToken } from '../utils/auths';

const AddProduct: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (formData: FormData) => {
    try {
      // Fetch seller profile to get shopName and shopDetails
      const token = getToken();
      const profileRes = await axios.get('http://localhost:5000/api/sellers/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { shopName, shopDetails } = profileRes.data;
      formData.append('shopName', shopName);
      formData.append('shopDetails', shopDetails);

      await axios.post('http://localhost:5000/api/products', formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
      });
      alert('Product added!');
      navigate('/');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Add Product</h1>
      <ProductForm initialData={undefined} onSubmit={handleSubmit} />
    </div>
  );
};

export default AddProduct;
