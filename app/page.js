'use client';

import { useEffect, useMemo, useState } from 'react';

const emptyForm = { name: '', description: '', price: '' };
const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export default function Home() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  // READ: Ambil katalog produk dari API.
  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal memuat data produk.');
      setProducts(data);
      setApiStatus('connected');
    } catch (err) {
      setApiStatus('offline');
      setError(err.message || 'Terjadi kendala saat memuat produk.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!formOpen && !selectedProduct) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (formOpen) closeForm();
        else setSelectedProduct(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [formOpen, selectedProduct]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    if (!query) return products;

    return products.filter((product) =>
      `${product.name} ${product.description || ''}`.toLocaleLowerCase('id-ID').includes(query)
    );
  }, [products, search]);

  const totalValue = products.reduce((total, product) => total + Number(product.price || 0), 0);
  const averagePrice = products.length ? totalValue / products.length : 0;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setFormError('');
    setNotice('');
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  // UPDATE: Isi form dengan data produk yang dipilih.
  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
    });
    setError('');
    setFormError('');
    setNotice('');
    setFormOpen(true);
  }

  // CREATE / UPDATE: Simpan produk baru atau perubahan produk.
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setFormError('');
    setNotice('');

    try {
      const isEditing = Boolean(editingId);
      const response = await fetch(isEditing ? `/api/products/${editingId}` : '/api/products', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menyimpan produk.');

      if (isEditing && selectedProduct?.id === editingId) {
        setSelectedProduct({ ...selectedProduct, ...data });
      }
      closeForm();
      setNotice(isEditing ? 'Perubahan produk berhasil disimpan.' : 'Produk baru berhasil ditambahkan.');
      await loadProducts();
    } catch (err) {
      const message = err.message || 'Terjadi kendala saat menyimpan produk.';
      setError(message);
      setFormError(message);
    } finally {
      setSaving(false);
    }
  }

  // DELETE: Minta konfirmasi, lalu hapus produk terpilih.
  async function handleDelete(product) {
    if (!window.confirm(`Hapus "${product.name}" dari katalog?`)) return;

    setDeletingId(product.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gagal menghapus produk.');
      setSelectedProduct(null);
      setNotice('Produk berhasil dihapus dari katalog.');
      await loadProducts();
    } catch (err) {
      setError(err.message || 'Terjadi kendala saat menghapus produk.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="app-shell" id="overview">
      <aside className="sidebar" aria-label="Navigasi utama">
        <a className="brand" href="#overview" aria-label="Ruang Katalog, beranda">
          <span className="brand-mark" aria-hidden="true">r.</span>
          <span className="brand-name">ruang<span>katalog</span></span>
        </a>

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="side-nav">
          <a className="nav-link active" href="#overview">
            <span className="nav-icon" aria-hidden="true">◫</span>
            Ringkasan
          </a>
          <a className="nav-link" href="#products">
            <span className="nav-icon" aria-hidden="true">▤</span>
            Daftar produk
            <span className="nav-count">{products.length}</span>
          </a>
        </nav>

        <div className="sidebar-note">
          <span className="note-dot" />
          <div>
            <strong>Database katalog</strong>
            <span>MySQL · Aiven</span>
          </div>
        </div>
        <div className="sidebar-footer">Dibuat untuk mengelola katalog dengan rapi.</div>
      </aside>

      <section className="content-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> Inventaris</div>
          <div className="topbar-right">
            <span className="connection-status" data-state={apiStatus}>
              <span />
              {apiStatus === 'checking' ? 'Memeriksa database' : apiStatus === 'connected' ? 'MySQL terhubung' : 'Database bermasalah'}
            </span>
            <div className="profile-mark" aria-label="Admin">A</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">PENGELOLAAN KATALOG</p>
              <h1>Inventaris produk</h1>
              <p className="page-description">Semua produkmu, tersusun rapi di satu tempat.</p>
            </div>
            <button className="button button-dark" type="button" onClick={startCreate}>
              <span aria-hidden="true">＋</span> Produk baru
            </button>
          </section>

          {(error || notice) && (
            <div className={`feedback ${error ? 'feedback-error' : 'feedback-success'}`} role="status">
              <span aria-hidden="true">{error ? '!' : '✓'}</span>
              {error || notice}
              {error && (
                <button type="button" className="feedback-action" onClick={loadProducts}>
                  Coba lagi
                </button>
              )}
            </div>
          )}

          <section className="stats-grid" aria-label="Ringkasan katalog">
            <article className="stat-card">
              <div className="stat-topline"><span>Total produk</span><span className="stat-symbol">▤</span></div>
              <strong>{loading ? '—' : products.length}</strong>
              <span className="stat-foot">item dalam katalog</span>
            </article>
            <article className="stat-card stat-card-accent">
              <div className="stat-topline"><span>Nilai katalog</span><span className="stat-symbol">↗</span></div>
              <strong>{loading ? '—' : currency.format(totalValue)}</strong>
              <span className="stat-foot">akumulasi harga produk</span>
            </article>
            <article className="stat-card">
              <div className="stat-topline"><span>Harga rata-rata</span><span className="stat-symbol">⌁</span></div>
              <strong>{loading ? '—' : currency.format(averagePrice)}</strong>
              <span className="stat-foot">per produk</span>
            </article>
          </section>

          <section className="management-grid">
            <div className="panel product-panel" id="products">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">KATALOG</p>
                  <h2>Semua produk <span className="heading-count">{products.length}</span></h2>
                </div>
                <button className="button button-light refresh-button" type="button" onClick={loadProducts} disabled={loading}>
                  <span aria-hidden="true">↻</span> Segarkan
                </button>
              </div>

              <label className="search-box">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama atau deskripsi produk..."
                  aria-label="Cari produk"
                />
                <kbd>/</kbd>
              </label>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>PRODUK</th>
                      <th>HARGA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className="product-row"
                        tabIndex={0}
                        role="button"
                        aria-label={`Lihat detail ${product.name}`}
                        onClick={() => setSelectedProduct(product)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedProduct(product);
                          }
                        }}
                      >
                        <td>
                          <div className="product-cell">
                            <span className={`product-avatar avatar-${index % 4}`} aria-hidden="true">
                              {(product.name || '?').trim().charAt(0).toLocaleUpperCase('id-ID')}
                            </span>
                            <span className="product-copy">
                              <strong>{product.name}</strong>
                              <span>{product.description || 'Tanpa deskripsi'}</span>
                            </span>
                          </div>
                        </td>
                        <td className="price-cell">{currency.format(Number(product.price))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!loading && visibleProducts.length === 0 && (
                  <div className="empty-state">
                    <span className="empty-icon" aria-hidden="true">{search ? '⌕' : '＋'}</span>
                    <strong>{search ? 'Produk tidak ditemukan' : 'Katalog masih kosong'}</strong>
                    <p>{search ? 'Coba kata kunci lain.' : 'Tambahkan produk pertama untuk mulai mengisi katalog.'}</p>
                  </div>
                )}
                {loading && <div className="table-loading">Mengambil data katalog...</div>}
              </div>
              <div className="table-foot">
                Menampilkan <strong>{visibleProducts.length}</strong> dari <strong>{products.length}</strong> produk
              </div>
            </div>
          </section>
          <footer className="page-footer">Ruang Katalog <span>·</span> Kelola produk tanpa kerumitan.</footer>
        </div>
      </section>

      {formOpen && (
        <div className="dialog-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm();
        }}>
          <section className="panel form-panel product-dialog" role="dialog" aria-modal="true" aria-labelledby="form-title">
            <div className="panel-heading form-heading">
              <div>
                <p className="eyebrow">{editingId ? 'PERBARUI DATA' : 'KATALOG BARU'}</p>
                <h2 id="form-title">{editingId ? 'Edit produk' : 'Tambah produk'}</h2>
              </div>
              <button className="dialog-close" type="button" onClick={closeForm} aria-label="Tutup form">×</button>
            </div>
            <p className="form-intro">
              {editingId ? 'Sesuaikan informasi produk di bawah ini.' : 'Lengkapi informasi untuk memasukkan produk ke katalog.'}
            </p>
            {formError && (
              <div className="feedback feedback-error dialog-feedback" role="alert">
                <span aria-hidden="true">!</span>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="name">Nama produk <span>*</span></label>
                <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Contoh: Kopi Susu Aren" maxLength={255} required autoFocus />
              </div>
              <div className="form-field">
                <label htmlFor="description">Deskripsi <span className="optional-label">OPSIONAL</span></label>
                <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Ceritakan detail singkat produk..." />
              </div>
              <div className="form-field">
                <label htmlFor="price">Harga jual <span>*</span></label>
                <div className="price-input">
                  <span>Rp</span>
                  <input id="price" name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} placeholder="0" required />
                </div>
                <span className="field-hint">Masukkan harga dalam rupiah.</span>
              </div>
              <div className="form-actions">
                <button className="button button-dark submit-button" type="submit" disabled={saving}>
                  {saving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambahkan produk'}
                  {!saving && <span aria-hidden="true">→</span>}
                </button>
                <button className="button button-light cancel-button" type="button" onClick={closeForm}>Batal</button>
              </div>
            </form>
            <div className="required-note"><span>*</span> Wajib diisi</div>
          </section>
        </div>
      )}

      {selectedProduct && (
        <div className="details-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedProduct(null);
        }}>
          <aside className="details-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title">
            <div className="drawer-topbar">
              <span className="eyebrow">DETAIL PRODUK</span>
              <button className="dialog-close" type="button" onClick={() => setSelectedProduct(null)} aria-label="Tutup detail">×</button>
            </div>
            <div className="detail-identity">
              <span className="detail-avatar" aria-hidden="true">
                {(selectedProduct.name || '?').trim().charAt(0).toLocaleUpperCase('id-ID')}
              </span>
              <span className="detail-kicker">INVENTARIS KATALOG</span>
              <h2 id="detail-title">{selectedProduct.name}</h2>
            </div>
            <div className="detail-section">
              <span className="detail-label">DESKRIPSI</span>
              <p className="detail-description">{selectedProduct.description || 'Belum ada deskripsi untuk produk ini.'}</p>
            </div>
            <div className="detail-price">
              <span className="detail-label">HARGA JUAL</span>
              <strong>{currency.format(Number(selectedProduct.price))}</strong>
            </div>
            <div className="drawer-actions">
              <button className="button button-dark" type="button" onClick={() => startEdit(selectedProduct)}>
                Edit produk <span aria-hidden="true">↗</span>
              </button>
              <button
                className="button button-delete"
                type="button"
                onClick={() => handleDelete(selectedProduct)}
                disabled={deletingId === selectedProduct.id}
              >
                {deletingId === selectedProduct.id ? 'Menghapus...' : 'Hapus produk'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
