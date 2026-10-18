package portal

import (
	"bytes"
	"encoding/json"
	"image"
	"image/color"
	"image/png"
	"mime/multipart"
	"net/http/httptest"
	"testing"
)

func TestScreenshotUploadAndDownloadRequireProjectAccess(t *testing.T) {
	f := setup(t)
	client, owner := f.client("owner")
	_, stranger := f.client("other")
	_, project := f.call("POST", "/admin/projects", Record{"client_id": client, "title": "Private project"}, f.admin, 200)
	_, task := f.call("POST", "/admin/projects/"+project["id"].(string)+"/tasks", Record{"title": "Design", "status": "review"}, f.admin, 200)
	img := image.NewRGBA(image.Rect(0, 0, 2, 2))
	img.Set(0, 0, color.White)
	var screenshot bytes.Buffer
	if err := png.Encode(&screenshot, img); err != nil {
		t.Fatal(err)
	}
	var body bytes.Buffer
	form := multipart.NewWriter(&body)
	part, err := form.CreateFormFile("file", "progress.png")
	if err != nil {
		t.Fatal(err)
	}
	part.Write(screenshot.Bytes())
	form.Close()
	path := "/api/v1/admin/tasks/" + task["id"].(string) + "/attachments"
	upload := httptest.NewRequest("POST", path, &body)
	upload.Header.Set("Origin", testOrigin)
	upload.Header.Set("Content-Type", form.FormDataContentType())
	upload.AddCookie(f.admin)
	response := httptest.NewRecorder()
	f.handler.ServeHTTP(response, upload)
	if response.Code != 201 {
		t.Fatalf("upload: %d %s", response.Code, response.Body.String())
	}
	result := Record{}
	json.Unmarshal(response.Body.Bytes(), &result)
	id := result["id"].(string)
	for _, example := range []struct {
		cookie string
		want   int
	}{{"owner", 200}, {"other", 404}, {"anonymous", 401}} {
		download := httptest.NewRequest("GET", "/api/v1/attachments/"+id, nil)
		if example.cookie == "owner" {
			download.AddCookie(owner)
		}
		if example.cookie == "other" {
			download.AddCookie(stranger)
		}
		res := httptest.NewRecorder()
		f.handler.ServeHTTP(res, download)
		if res.Code != example.want {
			t.Fatalf("%s: %d", example.cookie, res.Code)
		}
		if res.Code == 200 && (!bytes.Equal(res.Body.Bytes(), screenshot.Bytes()) || res.Header().Get("Content-Type") != "image/png") {
			t.Fatal("incorrect screenshot response")
		}
	}
	// MIME sniffing rejects HTML renamed as an image.
	var bad bytes.Buffer
	form = multipart.NewWriter(&bad)
	part, _ = form.CreateFormFile("file", "fake.png")
	part.Write([]byte("<html><script>alert(1)</script></html>"))
	form.Close()
	upload = httptest.NewRequest("POST", path, &bad)
	upload.Header.Set("Origin", testOrigin)
	upload.Header.Set("Content-Type", form.FormDataContentType())
	upload.AddCookie(f.admin)
	response = httptest.NewRecorder()
	f.handler.ServeHTTP(response, upload)
	if response.Code != 400 {
		t.Fatal("non-image upload accepted")
	}
}
