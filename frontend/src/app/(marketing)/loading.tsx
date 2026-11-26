/** Tampilan saat halaman publik sedang dimuat: logo dengan cincin emas dan kerangka konten. */
export default function Loading() {
  return (
    <div className="sq-loading" role="status" aria-live="polite">
      <section className="ld-head">
        <div className="wrap">
          <div className="ld-mark">
            <span className="ld-ring" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sq/brand-icon.png" alt="" width={56} height={56} />
          </div>
          <p className="ld-text">Menyiapkan halaman untuk Anda</p>
          <span className="ld-bar w60" />
          <span className="ld-bar w40" />
        </div>
      </section>
      <section className="wrap ld-body" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div className="ld-card" key={i}>
            <span className="ld-img" />
            <span className="ld-line w80" />
            <span className="ld-line w50" />
            <span className="ld-line w30" />
          </div>
        ))}
      </section>
      <span className="sr-only">Memuat halaman</span>
    </div>
  );
}
