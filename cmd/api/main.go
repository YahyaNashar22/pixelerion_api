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
	"github.com/YahyaNashar22/pixelerion_api/internal/database"
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

	mongoCtx, mongoCancel := context.WithTimeout(
		context.Background(),
		cfg.Mongo.ConnectTimeout,
	)

	mongoDb, err := database.ConnectMongo(
		mongoCtx,
		cfg.Mongo,
	)

	mongoCancel()

	if err != nil {
		logger.Error(
			"failed to connect to mongodb",
			"error",
			err,
		)

		os.Exit(1)
	}

	logger.Info(
		"mongodb connected",
		"database",
		cfg.Mongo.Database,
	)

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

	case sig := <-shutdownSignal:
		logger.Info(
			"shutdown signal received",
			"signal",
			sig.String(),
		)
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(
		context.Background(),
		cfg.HTTP.ShutdownTimeout,
	)

	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error(
			"graceful http shutdown failed",
			"error",
			err,
		)
	}

	if err := mongoDb.Disconnect(shutdownCtx); err != nil {
		logger.Error(
			"mongodb disconnect failed",
			"error",
			err,
		)
	}

	logger.Info("server stopped gracefully")
}
