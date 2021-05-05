const YEAR = new Date().getFullYear()

export default {
  footer: (
    <small style={{ display: 'block', marginTop: '8rem' }}>
      <hr></hr>
      Copyright <time>{YEAR}</time> © tomtan.
      <a href="/feed.xml">RSS</a>
      <style jsx>{`
        a {
          float: right;
          color: white;
          display:inline-block;
          padding:0.2em 1em;
          margin:0 0.1em 0.1em 0;
          border-radius:4em;
          box-sizing: border-box;
          text-decoration:none;
          background-color:#0677ed;
          text-align:center;
          transition: all 0.2s;
        }
        a:hover {
          background-color: #4ea1fa;
        }
        @media screen and (max-width: 480px) {
          article {
            padding-top: 2rem;
            padding-bottom: 4rem;
          }
        }
      `}</style>
    </small>
  )
}
