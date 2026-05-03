import { useParams, Link } from 'react-router-dom'

export default function BlogPost() {
  const { slug } = useParams()
  return (
    <div>
      <h1>{slug}</h1>
      <Link to="/blog">← Blog</Link>
    </div>
  )
}
