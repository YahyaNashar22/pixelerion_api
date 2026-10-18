package config

import (
	"fmt"
	"net/mail"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	App            AppConfig
	HTTP           HTTPConfig
	SQLitePath     string
	PublicURL      string
	UploadDir      string
	ClientDir      string
	SMTP           SMTPConfig
	BootstrapAdmin BootstrapAdminConfig
}
type AppConfig struct{ Environment string }
type HTTPConfig struct {
	Port              string
	ReadTimeout       time.Duration
	ReadHeaderTimeout time.Duration
	WriteTimeout      time.Duration
	IdleTimeout       time.Duration
	ShutdownTimeout   time.Duration
}
type BootstrapAdminConfig struct {
	Username string
	Email    string
	Password string
}
type SMTPConfig struct {
	Host         string
	Port         string
	Username     string
	Password     string
	From         string
	SupportEmail string
}

func Load() (*Config, error) {
	c := &Config{
		App:        AppConfig{getEnv("APP_ENV", "development")},
		SQLitePath: getEnv("SQLITE_PATH", "data/pixelerion.db"),
		PublicURL:  strings.TrimRight(getEnv("PUBLIC_URL", "http://localhost:8443"), "/"),
		UploadDir:  getEnv("UPLOAD_DIR", "data/uploads"), ClientDir: getEnv("CLIENT_DIST_DIR", "client/dist"),
		SMTP:           SMTPConfig{getEnv("SMTP_HOST", "smtp.gmail.com"), getEnv("SMTP_PORT", "587"), os.Getenv("SMTP_USERNAME"), os.Getenv("SMTP_PASSWORD"), os.Getenv("SMTP_FROM"), os.Getenv("SUPPORT_EMAIL")},
		BootstrapAdmin: BootstrapAdminConfig{os.Getenv("BOOTSTRAP_ADMIN_USERNAME"), os.Getenv("BOOTSTRAP_ADMIN_EMAIL"), os.Getenv("BOOTSTRAP_ADMIN_PASSWORD")},
	}
	c.HTTP.Port = getEnv("HTTP_PORT", "8080")
	for _, v := range []struct {
		key     string
		target  *time.Duration
		seconds int
	}{
		{"HTTP_READ_TIMEOUT_SECONDS", &c.HTTP.ReadTimeout, 15}, {"HTTP_READ_HEADER_TIMEOUT_SECONDS", &c.HTTP.ReadHeaderTimeout, 5},
		{"HTTP_WRITE_TIMEOUT_SECONDS", &c.HTTP.WriteTimeout, 30}, {"HTTP_IDLE_TIMEOUT_SECONDS", &c.HTTP.IdleTimeout, 60},
		{"HTTP_SHUTDOWN_TIMEOUT_SECONDS", &c.HTTP.ShutdownTimeout, 10},
	} {
		n, err := strconv.Atoi(getEnv(v.key, strconv.Itoa(v.seconds)))
		if err != nil || n < 1 {
			return nil, fmt.Errorf("%s must be positive seconds", v.key)
		}
		*v.target = time.Duration(n) * time.Second
	}
	port, err := strconv.Atoi(c.HTTP.Port)
	if err != nil || port < 1 || port > 65535 {
		return nil, fmt.Errorf("HTTP_PORT is invalid")
	}
	u, err := url.Parse(c.PublicURL)
	if err != nil || u.Host == "" || u.User != nil || (u.Scheme != "http" && u.Scheme != "https") || u.RawQuery != "" || u.Fragment != "" || u.Path != "" {
		return nil, fmt.Errorf("PUBLIC_URL must be an origin, e.g. https://pixelerion.com")
	}
	switch c.App.Environment {
	case "development", "test", "staging", "production":
	default:
		return nil, fmt.Errorf("invalid APP_ENV")
	}
	if c.App.Environment != "development" && c.App.Environment != "test" && u.Scheme != "https" {
		return nil, fmt.Errorf("HTTPS PUBLIC_URL is required outside development")
	}
	if c.BootstrapAdmin.Username == "" || len(c.BootstrapAdmin.Password) < 12 || len(c.BootstrapAdmin.Password) > 72 {
		return nil, fmt.Errorf("bootstrap admin username and a 12-72 byte password are required")
	}
	if _, err := mail.ParseAddress(c.BootstrapAdmin.Email); err != nil {
		return nil, fmt.Errorf("invalid bootstrap admin email")
	}
	if c.SMTP.Username != "" || c.SMTP.Password != "" || c.SMTP.From != "" || c.SMTP.SupportEmail != "" {
		if c.SMTP.Username == "" || c.SMTP.Password == "" || c.SMTP.From == "" || c.SMTP.SupportEmail == "" {
			return nil, fmt.Errorf("SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM and SUPPORT_EMAIL must be set together")
		}
		for _, addr := range []string{c.SMTP.From, c.SMTP.SupportEmail} {
			if _, err := mail.ParseAddress(addr); err != nil || strings.ContainsAny(addr, "\r\n") {
				return nil, fmt.Errorf("invalid SMTP email address")
			}
		}
	}
	return c, nil
}
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
