package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/YahyaNashar22/pixelerion_api/internal/config"
	"github.com/YahyaNashar22/pixelerion_api/internal/httpserver"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	cfg, err := config.Load()
	if err != nil {
		logger.Error(
			"failed to load configuration",
			"error",
			err,
		)

		os.Exit(1)
	}

	server := httpserver.New(cfg)

	serverErrors := make(chan error, 1)

	go func() {
		logger.Info(
			"server starting",
			"port",
			cfg.HTTP.Port,
			"environment",
			cfg.App.Environment,
		)

		err := server.Start()

		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			serverErrors <- err
		}
	}()

	shutdownSignal := make(chan os.Signal, 1)

	// With graceful shutdown:
	// SIGTERM → stop accepting new connections → let active requests finish → close resources → exit
	signal.Notify(
		shutdownSignal,
		syscall.SIGINT,
		syscall.SIGTERM,
	)

	select {
	case err := <-serverErrors:
		logger.Error(
			"server error",
			"error",
			err,
		)
		os.Exit(1)

	case sig := <-shutdownSignal:
		logger.Info(
			"shutdown signal received",
			"signal",
			sig.String(),
		)
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		cfg.HTTP.ShutdownTimeout,
	)

	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Error(
			"graceful shutdown failed",
			"error",
			err,
		)
		os.Exit(1)
	}

	logger.Info("server stopped gracefully")
}
