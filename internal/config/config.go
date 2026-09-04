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
	var readTimeout, readHeaderTimeout, writeTimeout, idleTimeout, shutdownTimeout time.Duration
	var err error

	if readTimeout, err = getDurationEnv("HTTP_READ_TIMEOUT_SECONDS", 15*time.Second); err != nil {
		return nil, err
	}
	if readHeaderTimeout, err = getDurationEnv("HTTP_READ_HEADER_TIMEOUT_SECONDS", 15*time.Second); err != nil {
		return nil, err
	}
	if writeTimeout, err = getDurationEnv("HTTP_WRITE_TIMEOUT_SECONDS", 15*time.Second); err != nil {
		return nil, err
	}
	if idleTimeout, err = getDurationEnv("HTTP_IDLE_TIMEOUT_SECONDS", 15*time.Second); err != nil {
		return nil, err
	}
	if shutdownTimeout, err = getDurationEnv("HTTP_SHUTDOWN_TIMEOUT_SECONDS", 15*time.Second); err != nil {
		return nil, err
	}

	cfg := &Config{
		App: AppConfig{
			Environment: getEnv("APP_ENV", "development"),
		},
		HTTP: HTTPConfig{
			Port:              getEnv("HTTP_PORT", "8080"),
			ReadTimeout:       readTimeout,
			ReadHeaderTimeout: readHeaderTimeout,
			WriteTimeout:      writeTimeout,
			IdleTimeout:       idleTimeout,
			ShutdownTimeout:   shutdownTimeout,
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

func getDurationEnv(key string, fallback time.Duration) (time.Duration, error) {
	value, exists := os.LookupEnv(key)

	if !exists || value == "" {
		return fallback, nil
	}

	seconds, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf(
			"%s must be a valid number of seconds: %w",
			key,
			err,
		)
	}

	if seconds <= 0 {
		return 0, fmt.Errorf(
			"%s must be greater than zero",
			key,
		)
	}

	return time.Duration(seconds) * time.Second, nil
}
