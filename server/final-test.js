import fetch from 'node-fetch';

const finalTest = async () => {
  try {
    console.log('🧪 Running final order placement test...\n');
    
    // Get first product
    const productsResponse = await fetch('http://localhost:5000/api/products');
    const products = await productsResponse.json();
    const testProduct = products[0];
    
    console.log(`Testing with product: ${testProduct.title} (ID: ${testProduct.id})`);
    
    // Create test order
    const orderData = {
      customerName: 'Final Test Customer',
      customerPhone: '+8801234567890',
      customerAddress: '123 Test Address, Dhaka, Bangladesh',
      customerEmail: 'finaltest@example.com',
      deliveryLocation: 'inside_dhaka',
      deliveryCharge: 60,
      items: [{
        id: testProduct.id,
        title: testProduct.title,
        price: testProduct.price,
        quantity: 1,
        image: testProduct.image
      }],
      total: testProduct.price + 60
    };
    
    const response = await fetch('http://localhost:5000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Order placed successfully!');
      console.log(`   Order ID: ${result.orderId}`);
      console.log(`   Total: $${orderData.total}`);
      console.log(`   Items: ${orderData.items.length}`);
      console.log('\n🎉 ORDER PLACEMENT IS NOW WORKING! 🎉');
    } else {
      const error = await response.text();
      console.log('❌ Order placement failed:', error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

finalTest();
