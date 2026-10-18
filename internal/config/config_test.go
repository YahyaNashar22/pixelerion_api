package config

import (
	"os"
	"path/filepath"
	"testing"
)

func baseEnv(t *testing.T) {
	t.Helper()
	for key, value := range map[string]string{"APP_ENV": "test", "PUBLIC_URL": "http://localhost:8443", "HTTP_PORT": "8080", "BOOTSTRAP_ADMIN_USERNAME": "admin", "BOOTSTRAP_ADMIN_EMAIL": "admin@example.com", "BOOTSTRAP_ADMIN_PASSWORD": "Secure-config-password", "SMTP_USERNAME": "", "SMTP_PASSWORD": "", "SMTP_FROM": "", "SUPPORT_EMAIL": ""} {
		t.Setenv(key, value)
	}
}
func TestProductionRequiresHTTPS(t *testing.T) {
	baseEnv(t)
	t.Setenv("APP_ENV", "production")
	if _, err := Load(); err == nil {
		t.Fatal("HTTP production origin accepted")
	}
	t.Setenv("PUBLIC_URL", "https://studio.example.com")
	if _, err := Load(); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PUBLIC_URL", "https://user:pass@studio.example.com")
	if _, err := Load(); err == nil {
		t.Fatal("URL credentials accepted")
	}
}
func TestSMTPRequiresCompleteConfiguration(t *testing.T) {
	baseEnv(t)
	t.Setenv("SUPPORT_EMAIL", "support@example.com")
	if _, err := Load(); err == nil {
		t.Fatal("partial SMTP config accepted")
	}
}
func TestDotEnvNeverOverridesProcessValues(t *testing.T) {
	t.Setenv("PIXELERION_TEST_EXISTING", "process")
	const newKey = "PIXELERION_TEST_FROM_FILE"
	previous, exists := os.LookupEnv(newKey)
	os.Unsetenv(newKey)
	t.Cleanup(func() {
		if exists {
			os.Setenv(newKey, previous)
		} else {
			os.Unsetenv(newKey)
		}
	})
	path := filepath.Join(t.TempDir(), ".env")
	if err := os.WriteFile(path, []byte("PIXELERION_TEST_EXISTING=file\nPIXELERION_TEST_FROM_FILE='literal $value # text'\n"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := LoadDotEnv(path); err != nil {
		t.Fatal(err)
	}
	if os.Getenv("PIXELERION_TEST_EXISTING") != "process" || os.Getenv(newKey) != "literal $value # text" {
		t.Fatal("environment precedence or literal values changed")
	}
}
