package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	App  AppConfig
	HTTP HTTPConfig
}

type AppConfig struct {
	Environment string
}

type HTTPConfig struct {
	Port              string
	ReadTimeout       time.Duration
	ReadHeaderTimeout time.Duration
	WriteTimeout      time.Duration
	IdleTimeout       time.Duration
	ShutdownTimeout   time.Duration
}

func Load() (*Config, error) {
	cfg := &Config{
		App: AppConfig{
			Environment: getEnv("APP_ENV", "development"),
		},
		HTTP: HTTPConfig{
			Port:              getEnv("HTTP_PORT", "8080"),
			ReadTimeout:       getDurationEnv("HTTP_READ_TIMEOUT_SECONDS", 15*time.Second),
			ReadHeaderTimeout: getDurationEnv("HTTP_READ_HEADER_TIMEOUT_SECONDS", 5*time.Second),
			WriteTimeout:      getDurationEnv("HTTP_WRITE_TIMEOUT_SECONDS", 30*time.Second),
			IdleTimeout:       getDurationEnv("HTTP_IDLE_TIMEOUT_SECONDS", 60*time.Second),
			ShutdownTimeout:   getDurationEnv("HTTP_SHUTDOWN_TIMEOUT_SECONDS", 10*time.Second),
		},
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}
	return cfg, nil
}

func (c *Config) validate() error {
	port, err := strconv.Atoi(c.HTTP.Port)
	if err != nil {
		return fmt.Errorf("HTTP_PORT must be a valid number: %w", err)
	}

	if port < 1 || port > 65535 {
		return fmt.Errorf("HTTP_PORT must be between 1 and 65535")
	}

	switch c.App.Environment {
	case "development", "staging", "production", "test":
	default:
		return fmt.Errorf(
			"APP_ENV must be development, staging, production, or test",
		)
	}

	return nil
}

func getEnv(key, fallback string) string {
	value, exists := os.LookupEnv(key)

	if !exists || value == "" {
		return fallback
	}

	return value
}

func getDurationEnv(key string, fallback time.Duration) time.Duration {
	value, exists := os.LookupEnv(key)

	if !exists || value == "" {
		return fallback
	}

	seconds, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}

	return time.Duration(seconds) * time.Second
}
