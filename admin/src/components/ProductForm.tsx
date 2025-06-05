import React, { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FaSave} from "react-icons/fa";

interface Props {
  initialData?: {
    id?: number;
    title: string;
    price: number;
    discount?: number;
    discount_validity?: string;
    description: string;
    category: string;
    brand?: string;
    stock?: number;
    tags?: string;
    image?: string;
    deliverycharge_inside?: number;
    deliverycharge_outside?: number;
  };
  onSubmit?: (data: FormData) => void;
}

const ProductForm: React.FC<Props> = ({ initialData, onSubmit }) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [price, setPrice] = useState(initialData?.price || 0);
  const [discount, setDiscount] = useState(initialData?.discount || 0);
  const [discountValidity, setDiscountValidity] = useState(initialData?.discount_validity || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [stock, setStock] = useState(initialData?.stock || 0);
  const [tags, setTags] = useState(initialData?.tags || "");
  const [deliveryChargeInside, setDeliveryChargeInside] = useState(initialData?.deliverycharge_inside || 0);
  const [deliveryChargeOutside, setDeliveryChargeOutside] = useState(initialData?.deliverycharge_outside || 0);
  const [image, setImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>(initialData?.image || "");

  const finalPrice = price - (price * discount) / 100;

  useEffect(() => {
    if (initialData?.image) {
      setPreviewImage(`http://localhost:5000${initialData.image}`);
    }
  }, [initialData]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("price", price.toString());
    formData.append("discount", discount.toString());
    formData.append("discount_validity", discountValidity);
    formData.append("final_price", finalPrice.toString());
    formData.append("description", description);
    formData.append("category", category);
    formData.append("brand", brand);
    formData.append("stock", stock.toString());
    formData.append("tags", tags);
    formData.append("deliverycharge_inside", deliveryChargeInside.toString());
    formData.append("deliverycharge_outside", deliveryChargeOutside.toString());
    
    if (image) {
      formData.append("image", image);
    }

    if (onSubmit) {
      await onSubmit(formData);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h3 className="mb-0 text-center">
          {initialData?.id ? `Edit Product #${initialData.id}` : "Create New Product"}
        </h3>
      </div>
      
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Left Column */}
            <div className="col col-md-6">
              {/* Title */}
              <div className="form-group">
                <label className="form-label">
                  Title <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required
                />
              </div>

              {/* Price */}
              <div className="form-group">
                <label className="form-label">
                  Price ($) <span className="text-danger">*</span>
                </label>
                <input 
                  type="number" 
                  className="form-control"
                  value={price} 
                  onChange={(e) => setPrice(parseFloat(e.target.value))} 
                  min={1} 
                  ////step="1" 
                  required
                />
              </div>

              {/* Discount */}
              <div className="form-group">
                <label className="form-label">Discount (%)</label>
                <input 
                  type="number" 
                  className="form-control"
                  value={discount} 
                  onChange={(e) => setDiscount(parseFloat(e.target.value))} 
                  min={0} 
                  //step="0.01"
                />
              </div>

              {/* Discount Validity */}
              <div className="form-group">
                <label className="form-label">Discount Validity</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={discountValidity} 
                  onChange={(e) => setDiscountValidity(e.target.value)}
                />
              </div>

              {/* Final Price */}
              <div className="form-group">
                <label className="form-label">Final Price</label>
                <input 
                  type="text" 
                  className="form-control bg-light"
                  value={finalPrice.toFixed(2)} 
                  readOnly
                />
              </div>

              {/* Delivery Charges */}
              <div className="row">
                <div className="col col-md-6">
                  <div className="form-group">
                    <label className="form-label">
                      Delivery Charge(Inside Dhaka) ($) <span className="text-danger">*</span>
                    </label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={deliveryChargeInside} 
                      onChange={(e) => setDeliveryChargeInside(parseFloat(e.target.value))} 
                      min={1} 
                      
                      required
                    />
                  </div>
                </div>
                
                <div className="col col-md-6">
                  <div className="form-group">
                    <label className="form-label">
                      Delivery Charge(Outside Dhaka) ($) <span className="text-danger">*</span>
                    </label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={deliveryChargeOutside} 
                      onChange={(e) => setDeliveryChargeOutside(parseFloat(e.target.value))} 
                      min={1} 
                      
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col col-md-6">
              {/* Category */}
              <div className="form-group">
                <label className="form-label">
                  Category <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control"
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  required
                />
              </div>

              {/* Brand */}
              <div className="form-group">
                <label className="form-label">Brand</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              {/* Stock */}
              <div className="form-group">
                <label className="form-label">
                  Stock <span className="text-danger">*</span>
                </label>
                <input 
                  type="number" 
                  className="form-control"
                  value={stock} 
                  onChange={(e) => setStock(parseInt(e.target.value))} 
                  min={1} 
                  required
                />
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">
                  Description <span className="text-danger">*</span>
                </label>
                <textarea 
                  className="form-control"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={4} 
                  required
                />
              </div>
            </div>
          </div>

            {/* Image Upload */}
            <div className="form-group mt-3">
            <label className="form-label">Product Image *</label>
            <div className="d-flex align-items-center gap-3">
              <div className="flex-grow-1">
              <input 
                type="file" 
                className="form-control"
                onChange={handleImageChange} 
                accept="image/*"
                required={!initialData?.id}
              />
              </div>
              {previewImage && (
              <div className="image-preview">
                <img 
                src={previewImage} 
                alt="Preview" 
                className="preview-img"
                />
              </div>
              )}
            </div>
            </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg btn-block mt-4"
          >
            <FaSave className="mr-2" />
            {initialData?.id ? "Update Product" : "Create Product"}
          </button>
        </form>
      </div>
      
      <style>{`
        .image-preview {
          width: 100px;
          height: 100px;
          border-radius: var(--border-radius-sm);
          overflow: hidden;
          border: 1px solid var(--gray);
        }
        
        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </div>
  );
};

export default ProductForm;