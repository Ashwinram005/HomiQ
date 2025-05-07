import { useEffect, useState } from 'react'
import axios from 'axios'
import { createRoute, redirect, type RootRoute } from '@tanstack/react-router'
import { isAuthenticated } from '@/lib/auth'

export const MyPosts = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem('token') // Get the stored JWT
        const response = await axios.get(
          'http://localhost:5000/api/posts/myPosts',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        setPosts(response.data)
      } catch (error) {
        console.error('Error fetching my posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  if (loading) return <p className="text-center mt-10">Loading...</p>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Posts</h1>

      {posts.length === 0 ? (
        <p>No posts found.</p>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <div key={post._id} className="border rounded-lg p-4 shadow">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-sm text-gray-600">{post.location}</p>
              <p>₹{post.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


export default (parentRoute: RootRoute) =>
    createRoute({
      path: "/myposts",
      component: MyPosts,
      getParentRoute: () => parentRoute,
      beforeLoad: async () => {
        const auth = await isAuthenticated();
        if (!auth) {
          return redirect({ to: "/" });
        }
      },
    });