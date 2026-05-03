import { Link } from 'react-router-dom'

const posts = ['hello-world', 'file-based-routing', 'vite-plugins']

export default function Blog() {
  return (
    <div>
      <h1>Blog</h1>
      <ul>
        {posts.map(slug => (
          <li key={slug}>
            <Link to={`/blog/${slug}`}>{slug}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
