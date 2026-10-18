package portal

import (
	"crypto/rand"
	"github.com/YahyaNashar22/pixelerion_api/internal/httpx"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func (a *API) upload(w http.ResponseWriter, r *http.Request) {
	if !a.taskAccess(r, r.PathValue("id")) {
		writeProblem(w, 404, "Task not found")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 6<<20)
	if err := r.ParseMultipartForm(6 << 20); err != nil {
		writeProblem(w, 400, "Upload one PNG, JPEG or WebP image up to 5 MB")
		return
	}
	defer r.MultipartForm.RemoveAll()
	file, header, err := r.FormFile("file")
	if err != nil {
		writeProblem(w, 400, "Choose a screenshot")
		return
	}
	defer file.Close()
	data, err := io.ReadAll(io.LimitReader(file, (5<<20)+1))
	if err != nil || len(data) > 5<<20 || len(data) == 0 {
		writeProblem(w, 400, "Screenshot must be between 1 byte and 5 MB")
		return
	}
	media := http.DetectContentType(data)
	if !oneOf(media, "image/png", "image/jpeg", "image/webp") {
		writeProblem(w, 400, "Only PNG, JPEG and WebP screenshots are allowed")
		return
	}
	if err := os.MkdirAll(a.cfg.UploadDir, 0700); err != nil {
		a.fail(w, err)
		return
	}
	id := rand.Text()
	path := filepath.Join(a.cfg.UploadDir, id)
	if err := os.WriteFile(path, data, 0600); err != nil {
		a.fail(w, err)
		return
	}
	filename := filepath.Base(strings.ReplaceAll(header.Filename, "\\", "/"))
	if len(filename) > 200 {
		filename = "screenshot"
	}
	// Files are private and addressed only through an authorized download endpoint.
	_, err = a.store.DB.ExecContext(r.Context(), "INSERT INTO attachments(id,task_id,filename,media_type,size,created_at) VALUES(?,?,?,?,?,?)", id, r.PathValue("id"), filename, media, len(data), stamp())
	if err != nil {
		os.Remove(path)
		a.fail(w, err)
		return
	}
	httpx.WriteJSON(w, 201, Record{"id": id})
}
func (a *API) download(w http.ResponseWriter, r *http.Request) {
	var task, filename, media string
	err := a.store.DB.QueryRowContext(r.Context(), "SELECT task_id,filename,media_type FROM attachments WHERE id=?", r.PathValue("id")).Scan(&task, &filename, &media)
	if err != nil || !a.taskAccess(r, task) {
		writeProblem(w, 404, "Attachment not found")
		return
	}
	w.Header().Set("Content-Type", media)
	w.Header().Set("Content-Disposition", mime.FormatMediaType("inline", map[string]string{"filename": filename}))
	w.Header().Set("Content-Security-Policy", "default-src 'none'; sandbox")
	http.ServeFile(w, r, filepath.Join(a.cfg.UploadDir, r.PathValue("id")))
}
