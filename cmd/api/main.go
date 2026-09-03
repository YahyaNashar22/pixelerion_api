package main

import (
	"log/slog"
	"net/http"
	"os"
	"time"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)

		_, _ = w.Write([]byte(`{"status": "ok"}`))
	})

	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,

		//Limits the amount of time the server will wait to read just the HTTP request headers
		// This the primary defense against Slowloris attacks
		ReadHeaderTimeout: 5 * time.Second,

		//  Limits the total time allowed to read the entire request
		// It prevents clients from hanging up the server while uploading massive or trickling data streams
		ReadTimeout: 15 * time.Second,

		// Limits the amount of time the server has to write the response back to the client
		// If a client has a terribly slow download speed, or if your handler gets stuck processing a heavy database query before writing a response, this ensures the connection doesn't stay open forever
		WriteTimeout: 30 * time.Second,

		// Controls how long a Keep-Alive connection can stay open while waiting for the next request.
		// Reusing connections saves CPU and latency, but leaving them open indefinitely would quickly exhaust the server's maximum open file descriptors.
		IdleTimeout: 60 * time.Second,
	}

	logger.Info(
		"server starting",
		"address",
		server.Addr,
	)

	if err := server.ListenAndServe(); err != nil {
		logger.Error(
			"server stopped",
			"error",
			err,
		)

		os.Exit(1)
	}
}
