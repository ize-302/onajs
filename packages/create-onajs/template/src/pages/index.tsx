import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <nav>
        <Link to="/about">About</Link>
        {' · '}
        <Link to="/blog">Blog</Link>
      </nav>
    </div>
  )
}
