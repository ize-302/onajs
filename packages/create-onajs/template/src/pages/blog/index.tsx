import { Link } from 'react-router-dom'

export default function Blog() {
  const posts = ['hello-world', 'file-based-routing', 'vite-plugins']

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
      <Link to="/">← Home</Link>
    </div>
  )
}
