from pathlib import Path

path = Path("frontend/src/components/TripDetailsPage/TripDetailsPage.jsx")
text = path.read_text(encoding="utf-8")

old = """                <div className="trip-details__social-import-field">
                  <span className="trip-details__custom-place-label">Screenshots (optional)</span>
                  <div className="trip-details__social-import-upload-wrap">
                    <label className="trip-details__social-import-add-tile" htmlFor="social-import-files">
                      <input
                        id="social-import-files"
                        ref={socialImportFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="trip-details__social-import-file-input"
                        onChange={(e) => setSocialImportFiles(Array.from(e.target.files || []).slice(0, 8))}
                      />
                      <span className="trip-details__social-import-add-inner">
                        <Plus size={32} strokeWidth={1.35} className="trip-details__social-import-plus" aria-hidden />
                        <span className="trip-details__social-import-add-caption">Add image</span>
                      </span>
                    </label>
                  </div>
                  {socialImportFiles.length > 0 ? (
                    <p className="trip-details__social-import-file-count">{socialImportFiles.length} image(s) selected</p>
                  ) : null}
                </div>
"""

new = """                <div className="trip-details__social-import-field">
                  <span className="trip-details__custom-place-label">Screenshots (optional)</span>
                  <div className="trip-details__social-import-upload-wrap">
                    {socialImportFilePreviews.length > 0 ? (
                      <div className="trip-details__social-import-preview-row">
                        {socialImportFilePreviews.map((p, idx) => (
                          <div key={p.url} className="trip-details__social-import-preview-tile">
                            <img
                              src={p.url}
                              alt=""
                              className="trip-details__social-import-preview-img"
                              loading="lazy"
                              decoding="async"
                            />
                            <button
                              type="button"
                              className="trip-details__social-import-preview-remove"
                              aria-label="Remove image"
                              onClick={() => removeSocialImportFileAt(idx)}
                            >
                              <X size={14} aria-hidden />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <label className="trip-details__social-import-add-tile" htmlFor="social-import-files">
                      <input
                        id="social-import-files"
                        ref={socialImportFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="trip-details__social-import-file-input"
                        onChange={(e) => {
                          const incoming = Array.from(e.target.files || []);
                          if (!incoming.length) return;
                          setSocialImportFiles((prev) => {
                            const base = Array.isArray(prev) ? prev : [];
                            return [...base, ...incoming].slice(0, 8);
                          });
                          if (socialImportFileInputRef.current) socialImportFileInputRef.current.value = '';
                        }}
                      />
                      <span className="trip-details__social-import-add-inner">
                        <Plus size={32} strokeWidth={1.35} className="trip-details__social-import-plus" aria-hidden />
                        <span className="trip-details__social-import-add-caption">Add image</span>
                      </span>
                    </label>
                  </div>
                  {socialImportFiles.length > 0 ? (
                    <p className="trip-details__social-import-file-count">{socialImportFiles.length} image(s) selected</p>
                  ) : null}
                </div>
"""

if old not in text:
    raise SystemExit("Old screenshots block not found.")

text = text.replace(old, new, 1)
path.write_text(text, encoding="utf-8", newline="\n")
print("ok")

