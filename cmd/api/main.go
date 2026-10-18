package main

import (
	"context"
	"errors"
	"github.com/YahyaNashar22/pixelerion_api/internal/bootstrap"
	"github.com/YahyaNashar22/pixelerion_api/internal/config"
	"github.com/YahyaNashar22/pixelerion_api/internal/database"
	"github.com/YahyaNashar22/pixelerion_api/internal/portal"
	repository "github.com/YahyaNashar22/pixelerion_api/internal/repository/sqlite"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	if err := run(); err != nil {
		slog.Error("application stopped", "error", err)
		os.Exit(1)
	}
}
func run() error {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := config.LoadDotEnv(".env"); err != nil {
		return err
	}
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	startup, stop := context.WithTimeout(ctx, 30*time.Second)
	db, err := database.Open(startup, cfg.SQLitePath)
	if err != nil {
		stop()
		return err
	}
	defer db.Close()
	err = bootstrap.EnsureAdmin(startup, repository.NewUserRepository(db), cfg.BootstrapAdmin.Username, cfg.BootstrapAdmin.Email, cfg.BootstrapAdmin.Password)
	stop()
	if err != nil {
		return err
	}
	server := &http.Server{Addr: ":" + cfg.HTTP.Port, Handler: portal.New(db, cfg, logger), ReadTimeout: cfg.HTTP.ReadTimeout, ReadHeaderTimeout: cfg.HTTP.ReadHeaderTimeout, WriteTimeout: cfg.HTTP.WriteTimeout, IdleTimeout: cfg.HTTP.IdleTimeout, MaxHeaderBytes: 1 << 20}
	mailCtx, stopMail := context.WithCancel(ctx)
	defer stopMail()
	mailDone := make(chan struct{})
	go func() { defer close(mailDone); portal.RunMailer(mailCtx, db, cfg.SMTP, logger) }()
	result := make(chan error, 1)
	go func() {
		logger.Info("server started", "port", cfg.HTTP.Port, "environment", cfg.App.Environment, "database", "sqlite")
		result <- server.ListenAndServe()
	}()
	select {
	case err = <-result:
	case <-ctx.Done():
	}
	stopMail()
	shutdown, finish := context.WithTimeout(context.Background(), cfg.HTTP.ShutdownTimeout)
	defer finish()
	if e := server.Shutdown(shutdown); e != nil {
		return e
	}
	select {
	case <-mailDone:
	case <-shutdown.Done():
		return shutdown.Err()
	}
	if err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}
