import React from 'react';
import { useUser, UserProfile } from '@clerk/nextjs';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

const ProfilePage: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  // Redirect if not signed in
  React.useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-32 h-32 rounded-full overflow-hidden">
              <img 
                src={user.imageUrl} 
                alt={user.fullName || 'Profile'} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">{user.fullName}</h1>
              <p className="text-gray-600 mb-4">{user.primaryEmailAddress?.emailAddress}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Account Information</h2>
                  <p><span className="font-medium">User ID:</span> {user.id}</p>
                  <p><span className="font-medium">Created:</span> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clerk's built-in profile management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Manage Account</h2>
          <UserProfile />
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Order History</h2>
          <div className="text-center py-8 text-gray-500">
            <p>You haven't placed any orders yet.</p>
            <button 
              onClick={() => router.push('/products')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;