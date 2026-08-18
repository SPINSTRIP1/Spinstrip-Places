export default function AuroraBackground() {
  return (
    <>
      <div className="aurora-stage" aria-hidden="true">
        <div className="aurora-hue">
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
          <div className="aurora-blob aurora-blob-4" />
          <div className="aurora-sheen" />
        </div>
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  )
}
